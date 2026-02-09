import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { AuditRepository, AuditLogFilters } from './audit.repository';
import { PaginationQueryDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly auditRepository: AuditRepository) {}

  async findAll(filters: AuditLogFilters, pagination: PaginationQueryDto) {
    const { data, total } = await this.auditRepository.findAll(filters, pagination);

    return new PaginatedResponseDto(
      data,
      total,
      pagination.page || 1,
      pagination.limit || 20,
    );
  }

  async findById(id: string) {
    const auditLog = await this.auditRepository.findById(id);

    if (!auditLog) {
      throw new NotFoundException(`Audit log with ID "${id}" not found`);
    }

    return auditLog;
  }

  /**
   * Helper method used by other services to create audit log entries.
   * Audit log creation never throws — failures are logged but swallowed
   * to prevent audit infrastructure from breaking business operations.
   */
  async createAuditLog(data: {
    entityType: string;
    entityId?: string;
    officerId?: string;
    action: string;
    details: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    stationId?: string;
    success?: boolean;
  }) {
    try {
      return await this.auditRepository.create({
        ...data,
        success: data.success ?? true,
      });
    } catch (error) {
      this.logger.error(
        `Failed to create audit log: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    }
  }
}
