import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export interface AuditLogFilters {
  entityType?: string;
  officerId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  stationId?: string;
  success?: boolean;
}

@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: AuditLogFilters, pagination: PaginationQueryDto) {
    const where = this.buildWhereClause(filters);

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          officer: {
            select: {
              id: true,
              badge: true,
              name: true,
            },
          },
        },
        orderBy: {
          [pagination.sortBy || 'createdAt']: pagination.sortOrder || 'desc',
        },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string) {
    return this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        officer: {
          select: {
            id: true,
            badge: true,
            name: true,
          },
        },
      },
    });
  }

  async count(filters: AuditLogFilters): Promise<number> {
    const where = this.buildWhereClause(filters);
    return this.prisma.auditLog.count({ where });
  }

  async create(data: {
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
    return this.prisma.auditLog.create({ data });
  }

  private buildWhereClause(filters: AuditLogFilters) {
    const where: Record<string, any> = {};

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters.officerId) {
      where.officerId = filters.officerId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.stationId) {
      where.stationId = filters.stationId;
    }

    if (filters.success !== undefined) {
      where.success = filters.success;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return where;
  }
}
