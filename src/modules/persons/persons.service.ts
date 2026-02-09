import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { PersonsRepository, PersonFilters } from './persons.repository';
import { PaginationQueryDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class PersonsService {
  private readonly logger = new Logger(PersonsService.name);

  constructor(
    private readonly personsRepository: PersonsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(filters: PersonFilters, pagination: PaginationQueryDto) {
    const [data, total] = await Promise.all([
      this.personsRepository.findAll(
        filters,
        pagination.skip,
        pagination.take,
        pagination.sortBy || 'createdAt',
        pagination.sortOrder || 'desc',
      ),
      this.personsRepository.count(filters),
    ]);

    return new PaginatedResponseDto(
      data,
      total,
      pagination.page || 1,
      pagination.limit || 20,
    );
  }

  async findById(id: string, officerId: string) {
    const person = await this.personsRepository.findById(id);
    if (!person) {
      throw new NotFoundException(`Person not found: ${id}`);
    }

    await this.logAudit(officerId, 'read', id, {
      nationalId: person.nationalId,
    });

    return person;
  }

  async findByNationalId(nationalId: string, officerId: string) {
    const person = await this.personsRepository.findByNationalId(nationalId);
    if (!person) {
      throw new NotFoundException(`Person with NIN "${nationalId}" not found`);
    }

    await this.logAudit(officerId, 'read', person.id, {
      nationalId,
      lookupType: 'nin',
    });

    return person;
  }

  async findByFingerprint(fingerprintHash: string, officerId: string) {
    const person = await this.prisma.person.findFirst({
      where: { fingerprintHash },
      include: {
        cases: {
          include: {
            case: { select: { id: true, caseNumber: true, title: true, status: true } },
          },
        },
        createdBy: { select: { id: true, badge: true, name: true } },
      },
    });

    if (!person) {
      throw new NotFoundException('No person found with that fingerprint hash');
    }

    await this.logAudit(officerId, 'read', person.id, {
      lookupType: 'fingerprint',
    });

    return person;
  }

  async create(
    data: {
      nationalId?: string;
      idType?: string;
      countryCode?: string;
      firstName: string;
      lastName: string;
      middleName?: string;
      aliases?: string[];
      dob?: Date;
      gender?: string;
      nationality?: string;
      address?: string;
      phone?: string;
      email?: string;
      fingerprintHash?: string;
      biometricHash?: string;
    },
    officerId: string,
  ) {
    if (data.nationalId) {
      const existing = await this.personsRepository.findByNationalId(data.nationalId);
      if (existing) {
        throw new ConflictException(
          `Person with NIN "${data.nationalId}" already exists`,
        );
      }
    }

    const person = await this.personsRepository.create({
      ...data,
      createdById: officerId,
    });

    await this.logAudit(officerId, 'create', person.id, {
      nationalId: data.nationalId,
      name: `${data.firstName} ${data.lastName}`,
    });

    return person;
  }

  async update(id: string, data: Record<string, any>, officerId: string) {
    const existing = await this.personsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Person not found: ${id}`);
    }

    if (data.nationalId && data.nationalId !== existing.nationalId) {
      const duplicate = await this.personsRepository.findByNationalId(data.nationalId);
      if (duplicate) {
        throw new ConflictException(
          `Person with NIN "${data.nationalId}" already exists`,
        );
      }
    }

    const person = await this.personsRepository.update(id, data);

    await this.logAudit(officerId, 'update', id, {
      changes: Object.keys(data),
    });

    return person;
  }

  async delete(id: string, officerId: string) {
    const existing = await this.personsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Person not found: ${id}`);
    }

    await this.prisma.person.delete({ where: { id } });

    await this.logAudit(officerId, 'delete', id, {
      nationalId: existing.nationalId,
      name: existing.fullName,
    });

    return { deleted: true };
  }

  async updateWantedStatus(id: string, isWanted: boolean, officerId: string) {
    const existing = await this.personsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Person not found: ${id}`);
    }

    const updateData: any = { isWanted };
    if (isWanted && !existing.isWanted) {
      updateData.wantedSince = new Date();
    } else if (!isWanted) {
      updateData.wantedSince = null;
    }

    const person = await this.personsRepository.update(id, updateData);

    await this.logAudit(officerId, 'update_wanted_status', id, {
      nationalId: existing.nationalId,
      isWanted,
    });

    return person;
  }

  async updateRiskLevel(id: string, riskLevel: string, officerId: string) {
    const validLevels = ['low', 'medium', 'high'];
    if (!validLevels.includes(riskLevel)) {
      throw new BadRequestException(
        `Invalid risk level. Must be one of: ${validLevels.join(', ')}`,
      );
    }

    const existing = await this.personsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Person not found: ${id}`);
    }

    const person = await this.personsRepository.update(id, { riskLevel });

    await this.logAudit(officerId, 'update_risk_level', id, {
      nationalId: existing.nationalId,
      previousLevel: existing.riskLevel,
      newLevel: riskLevel,
    });

    return person;
  }

  async addAlias(id: string, alias: string, officerId: string) {
    const existing = await this.personsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Person not found: ${id}`);
    }

    const currentAliases = existing.aliases || [];
    if (currentAliases.includes(alias)) {
      throw new BadRequestException(`Alias "${alias}" already exists for this person`);
    }

    const person = await this.personsRepository.update(id, {
      aliases: [...currentAliases, alias],
    });

    await this.logAudit(officerId, 'add_alias', id, { alias });

    return person;
  }

  async removeAlias(id: string, alias: string, officerId: string) {
    const existing = await this.personsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Person not found: ${id}`);
    }

    const currentAliases = existing.aliases || [];
    if (!currentAliases.includes(alias)) {
      throw new BadRequestException(`Alias "${alias}" not found for this person`);
    }

    const person = await this.personsRepository.update(id, {
      aliases: currentAliases.filter((a: string) => a !== alias),
    });

    await this.logAudit(officerId, 'remove_alias', id, { alias });

    return person;
  }

  async getWantedPersons(pagination: PaginationQueryDto) {
    return this.findAll({ isWanted: true }, pagination);
  }

  async getHighRiskPersons(pagination: PaginationQueryDto) {
    const filters: PersonFilters = {};
    const where: any = { riskLevel: 'high' };

    const [data, total] = await Promise.all([
      this.prisma.person.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, badge: true, name: true } },
        },
      }),
      this.prisma.person.count({ where }),
    ]);

    return new PaginatedResponseDto(
      data,
      total,
      pagination.page || 1,
      pagination.limit || 20,
    );
  }

  async getStats() {
    const [total, wanted, highRisk, byGender, byNationality] = await Promise.all([
      this.prisma.person.count(),
      this.prisma.person.count({ where: { isWanted: true } }),
      this.prisma.person.count({ where: { riskLevel: 'high' } }),
      this.prisma.person.groupBy({
        by: ['gender'],
        _count: { id: true },
      }),
      this.prisma.person.groupBy({
        by: ['nationality'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      total,
      wanted,
      highRisk,
      byGender: byGender.map((r) => ({ gender: r.gender, count: r._count.id })),
      byNationality: byNationality.map((r) => ({
        nationality: r.nationality,
        count: r._count.id,
      })),
    };
  }

  private async logAudit(
    officerId: string,
    action: string,
    entityId: string,
    details: Record<string, any>,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          entityType: 'person',
          entityId,
          officerId,
          action,
          success: true,
          details,
        },
      });
    } catch (err) {
      this.logger.error('Audit log write failed', err);
    }
  }
}
