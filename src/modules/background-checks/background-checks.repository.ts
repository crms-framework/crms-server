import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

export interface BgCheckFilters {
  requestType?: string;
  status?: string;
  nin?: string;
}

@Injectable()
export class BackgroundChecksRepository {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(filters: BgCheckFilters) {
    const where: any = {};
    if (filters.requestType) where.requestType = filters.requestType;
    if (filters.status) where.status = filters.status;
    if (filters.nin) where.nin = filters.nin;
    return where;
  }

  async findAll(filters: BgCheckFilters = {}, skip = 0, take = 20) {
    const where = this.buildWhere(filters);
    return this.prisma.backgroundCheck.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        requestedBy: { select: { id: true, badge: true, name: true } },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.backgroundCheck.findUnique({
      where: { id },
      include: {
        requestedBy: { select: { id: true, badge: true, name: true } },
      },
    });
  }

  async create(data: {
    nin: string;
    requestedById?: string;
    requestType: string;
    result: Record<string, any>;
    status: string;
    phoneNumber?: string;
    ipAddress?: string;
  }) {
    return this.prisma.backgroundCheck.create({
      data,
      include: {
        requestedBy: { select: { id: true, badge: true, name: true } },
      },
    });
  }

  async update(id: string, data: Record<string, any>) {
    return this.prisma.backgroundCheck.update({
      where: { id },
      data,
      include: {
        requestedBy: { select: { id: true, badge: true, name: true } },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.backgroundCheck.delete({ where: { id } });
  }

  async findByNin(nin: string, skip = 0, take = 20) {
    return this.prisma.backgroundCheck.findMany({
      where: { nin },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        requestedBy: { select: { id: true, badge: true, name: true } },
      },
    });
  }

  async countByNin(nin: string) {
    return this.prisma.backgroundCheck.count({ where: { nin } });
  }

  async countRecentByNin(nin: string, since: Date) {
    return this.prisma.backgroundCheck.count({
      where: {
        nin,
        createdAt: { gte: since },
      },
    });
  }

  async count(filters: BgCheckFilters = {}) {
    const where = this.buildWhere(filters);
    return this.prisma.backgroundCheck.count({ where });
  }
}
