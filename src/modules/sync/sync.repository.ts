import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

export interface SyncFilters {
  status?: string;
  entityType?: string;
}

@Injectable()
export class SyncRepository {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(filters: SyncFilters = {}) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.entityType) where.entityType = filters.entityType;
    return where;
  }

  async findPending(limit: number = 50) {
    return this.prisma.syncQueue.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  async findAll(filters: SyncFilters = {}, skip = 0, take = 20) {
    const where = this.buildWhere(filters);

    return this.prisma.syncQueue.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: {
    entityType: string;
    entityId: string;
    operation: string;
    payload: Record<string, any>;
  }) {
    return this.prisma.syncQueue.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        operation: data.operation,
        payload: data.payload,
        status: 'pending',
        attempts: 0,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.syncQueue.findUnique({ where: { id } });
  }

  async updateStatus(id: string, status: string, error?: string) {
    return this.prisma.syncQueue.update({
      where: { id },
      data: {
        status,
        error: error || null,
        ...(status === 'completed' ? { syncedAt: new Date() } : {}),
      },
    });
  }

  async markCompleted(id: string) {
    return this.prisma.syncQueue.update({
      where: { id },
      data: {
        status: 'completed',
        syncedAt: new Date(),
        error: null,
      },
    });
  }

  async markFailed(id: string, error: string) {
    return this.prisma.syncQueue.update({
      where: { id },
      data: {
        status: 'failed',
        error,
        attempts: { increment: 1 },
      },
    });
  }

  async count(filters: SyncFilters = {}): Promise<number> {
    const where = this.buildWhere(filters);
    return this.prisma.syncQueue.count({ where });
  }

  async countByStatus(): Promise<Record<string, number>> {
    const results = await this.prisma.syncQueue.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const counts: Record<string, number> = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };

    for (const row of results) {
      counts[row.status] = row._count.id;
    }

    return counts;
  }

  async resetForRetry(id: string) {
    return this.prisma.syncQueue.update({
      where: { id },
      data: {
        status: 'pending',
        error: null,
      },
    });
  }
}
