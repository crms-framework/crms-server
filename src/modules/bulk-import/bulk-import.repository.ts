import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

export interface ImportJobFilters {
  entityType?: string;
  status?: string;
  officerId?: string;
}

@Injectable()
export class BulkImportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    entityType: string;
    fileKey: string;
    fileName?: string;
    duplicateStrategy: string;
    officerId: string;
    stationId?: string;
  }) {
    return this.prisma.bulkImportJob.create({ data });
  }

  async findById(id: string) {
    return this.prisma.bulkImportJob.findUnique({ where: { id } });
  }

  async findAll(filters: ImportJobFilters, skip: number, take: number) {
    const where = this.buildWhere(filters);

    const [data, total] = await Promise.all([
      this.prisma.bulkImportJob.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.bulkImportJob.count({ where }),
    ]);

    return { data, total };
  }

  async updateStatus(id: string, status: string) {
    const data: any = { status };
    if (status === 'processing' || status === 'validating') {
      data.startedAt = new Date();
    }
    if (status === 'completed' || status === 'failed') {
      data.completedAt = new Date();
    }
    return this.prisma.bulkImportJob.update({ where: { id }, data });
  }

  async updateProgress(
    id: string,
    progress: {
      totalRows?: number;
      processedRows?: number;
      successCount?: number;
      errorCount?: number;
      skippedCount?: number;
      errors?: any[];
      status?: string;
      summary?: any;
    },
  ) {
    const data: any = { ...progress };
    if (progress.status === 'completed' || progress.status === 'failed') {
      data.completedAt = new Date();
    }
    return this.prisma.bulkImportJob.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.bulkImportJob.delete({ where: { id } });
  }

  private buildWhere(filters: ImportJobFilters) {
    const where: any = {};
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.status) where.status = filters.status;
    if (filters.officerId) where.officerId = filters.officerId;
    return where;
  }
}
