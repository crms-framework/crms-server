import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { OfficersRepository, OfficerFilters } from './officers.repository';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { paginate } from '../../common/utils/pagination.util';

@Injectable()
export class OfficersService {
  private readonly logger = new Logger(OfficersService.name);

  constructor(
    private readonly officersRepo: OfficersRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(
    filters: OfficerFilters,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponseDto<any>> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.officersRepo.findAll(filters, skip, limit),
      this.officersRepo.count(filters),
    ]);

    // Strip sensitive fields from response
    const sanitized = data.map((officer) => this.sanitize(officer));

    return paginate(sanitized, total, page, limit);
  }

  async findById(id: string) {
    const officer = await this.officersRepo.findById(id);
    if (!officer) {
      throw new NotFoundException(`Officer with ID "${id}" not found`);
    }
    return this.sanitize(officer);
  }

  async create(
    data: {
      badge: string;
      name: string;
      nationalId?: string;
      email?: string;
      phone?: string;
      pin: string;
      roleId: string;
      stationId: string;
    },
    currentUserId: string,
  ) {
    // Check badge uniqueness
    const existing = await this.officersRepo.findByBadge(data.badge);
    if (existing) {
      throw new ConflictException(`Badge "${data.badge}" is already in use`);
    }

    const officer = await this.officersRepo.create(data);

    // Audit log
    await this.logAudit(currentUserId, 'create', officer.id, {
      badge: data.badge,
      name: data.name,
      roleId: data.roleId,
      stationId: data.stationId,
    });

    this.logger.log(`Officer created: ${officer.badge} by user ${currentUserId}`);

    return this.sanitize(officer);
  }

  async update(
    id: string,
    data: {
      name?: string;
      nationalId?: string;
      email?: string;
      phone?: string;
      roleId?: string;
      stationId?: string;
    },
    currentUserId: string,
  ) {
    const existing = await this.officersRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Officer with ID "${id}" not found`);
    }

    const officer = await this.officersRepo.update(id, data);

    await this.logAudit(currentUserId, 'update', id, {
      changes: data,
    });

    this.logger.log(`Officer updated: ${officer.badge} by user ${currentUserId}`);

    return this.sanitize(officer);
  }

  async deactivate(id: string, currentUserId: string) {
    const existing = await this.officersRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Officer with ID "${id}" not found`);
    }

    const officer = await this.officersRepo.deactivate(id);

    await this.logAudit(currentUserId, 'deactivate', id, {
      badge: existing.badge,
    });

    this.logger.log(`Officer deactivated: ${existing.badge} by user ${currentUserId}`);

    return this.sanitize(officer);
  }

  async activate(id: string, currentUserId: string) {
    const existing = await this.officersRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Officer with ID "${id}" not found`);
    }

    const officer = await this.officersRepo.activate(id);

    await this.logAudit(currentUserId, 'activate', id, {
      badge: existing.badge,
    });

    this.logger.log(`Officer activated: ${existing.badge} by user ${currentUserId}`);

    return this.sanitize(officer);
  }

  /**
   * Strip sensitive fields (pinHash, mfaSecret, etc.) from officer objects.
   */
  private sanitize(officer: any) {
    if (!officer) return officer;
    const {
      pinHash,
      mfaSecret,
      mfaBackupCodes,
      ussdQuickPinHash,
      ...safe
    } = officer;
    return safe;
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
          entityType: 'officer',
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
