import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { StationsRepository } from './stations.repository';
import { CreateStationDto } from './dto/create-station.dto';
import { StationFilterDto } from './dto/station-filter.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class StationsService {
  private readonly logger = new Logger(StationsService.name);

  constructor(
    private readonly stationsRepository: StationsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(filters: StationFilterDto) {
    const [data, total] = await Promise.all([
      this.stationsRepository.findAll(filters),
      this.stationsRepository.count(filters),
    ]);

    return new PaginatedResponseDto(
      data,
      total,
      filters.page || 1,
      filters.limit || 20,
    );
  }

  async findById(id: string) {
    const station = await this.stationsRepository.findById(id);
    if (!station) {
      throw new NotFoundException(`Station not found: ${id}`);
    }
    return station;
  }

  async create(data: CreateStationDto, officerId: string) {
    const existing = await this.stationsRepository.findByCode(data.code);
    if (existing) {
      throw new ConflictException(`Station with code "${data.code}" already exists`);
    }

    const station = await this.stationsRepository.create(data);

    await this.logAudit(officerId, 'create', station.id, {
      name: station.name,
      code: station.code,
    });

    return station;
  }

  async update(
    id: string,
    data: Partial<CreateStationDto>,
    officerId: string,
  ) {
    const existing = await this.stationsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Station not found: ${id}`);
    }

    if (data.code && data.code !== existing.code) {
      const duplicate = await this.stationsRepository.findByCode(data.code);
      if (duplicate) {
        throw new ConflictException(`Station with code "${data.code}" already exists`);
      }
    }

    const station = await this.stationsRepository.update(id, data);

    await this.logAudit(officerId, 'update', id, {
      name: existing.name,
      changes: Object.keys(data),
    });

    return station;
  }

  async delete(id: string, officerId: string) {
    const existing = await this.stationsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Station not found: ${id}`);
    }

    const officerCount = await this.stationsRepository.countOfficers(id);
    if (officerCount > 0) {
      throw new BadRequestException(
        `Cannot delete station "${existing.name}" — ${officerCount} active officer(s) are assigned to it`,
      );
    }

    await this.stationsRepository.delete(id);

    await this.logAudit(officerId, 'delete', id, {
      name: existing.name,
      code: existing.code,
    });

    return { deleted: true };
  }

  async activate(id: string, officerId: string) {
    const existing = await this.stationsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Station not found: ${id}`);
    }

    if (existing.active) {
      throw new BadRequestException('Station is already active');
    }

    const station = await this.stationsRepository.activate(id);

    await this.logAudit(officerId, 'activate', id, {
      name: existing.name,
      code: existing.code,
    });

    return station;
  }

  async deactivate(id: string, officerId: string) {
    const existing = await this.stationsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Station not found: ${id}`);
    }

    if (!existing.active) {
      throw new BadRequestException('Station is already inactive');
    }

    const station = await this.stationsRepository.deactivate(id);

    await this.logAudit(officerId, 'deactivate', id, {
      name: existing.name,
      code: existing.code,
    });

    return station;
  }

  async getStats() {
    const [total, active, inactive, byRegion, byCountry] = await Promise.all([
      this.prisma.station.count(),
      this.prisma.station.count({ where: { active: true } }),
      this.prisma.station.count({ where: { active: false } }),
      this.prisma.station.groupBy({
        by: ['region'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      this.prisma.station.groupBy({
        by: ['countryCode'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
    ]);

    return {
      total,
      active,
      inactive,
      byRegion: byRegion.map((r) => ({ region: r.region, count: r._count.id })),
      byCountry: byCountry.map((r) => ({ countryCode: r.countryCode, count: r._count.id })),
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
          entityType: 'station',
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
