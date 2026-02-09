import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class AgencyRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== Agency CRUD ====================

  async findAll(skip = 0, take = 20) {
    return this.prisma.agency.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { dataRequests: true, webhooks: true } } },
    });
  }

  async findById(id: string) {
    return this.prisma.agency.findUnique({ where: { id } });
  }

  async findByApiKey(hash: string) {
    return this.prisma.agency.findUnique({ where: { apiKey: hash } });
  }

  async create(data: {
    name: string;
    type: string;
    apiKey: string;
    apiKeyPrefix: string;
    contactEmail?: string;
    contactPhone?: string;
    ipWhitelist?: string[];
    rateLimit?: number;
    permissions: any;
  }) {
    return this.prisma.agency.create({ data });
  }

  async update(id: string, data: Record<string, any>) {
    return this.prisma.agency.update({ where: { id }, data });
  }

  async deactivate(id: string) {
    return this.prisma.agency.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async count() {
    return this.prisma.agency.count();
  }

  async updateLastAccessed(id: string) {
    return this.prisma.agency.update({
      where: { id },
      data: { lastAccessedAt: new Date() },
    });
  }

  // ==================== Webhook CRUD ====================

  async createWebhook(data: {
    agencyId: string;
    event: string;
    url: string;
    secret: string;
  }) {
    return this.prisma.agencyWebhook.create({ data });
  }

  async findWebhooksByAgency(agencyId: string) {
    return this.prisma.agencyWebhook.findMany({
      where: { agencyId, isActive: true },
    });
  }

  async findWebhooksByEvent(event: string) {
    return this.prisma.agencyWebhook.findMany({
      where: { event, isActive: true },
    });
  }

  async deleteWebhook(id: string) {
    return this.prisma.agencyWebhook.delete({ where: { id } });
  }

  async incrementWebhookFailCount(id: string) {
    return this.prisma.agencyWebhook.update({
      where: { id },
      data: { failCount: { increment: 1 } },
    });
  }

  async resetWebhookFailCount(id: string) {
    return this.prisma.agencyWebhook.update({
      where: { id },
      data: { failCount: 0, lastFiredAt: new Date() },
    });
  }

  async disableWebhook(id: string) {
    return this.prisma.agencyWebhook.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ==================== Request Logging ====================

  async logRequest(data: {
    agencyId: string;
    requestType: string;
    entityType: string;
    entityId?: string;
    requestData: any;
    responseData?: any;
    status: string;
    ipAddress?: string;
    responseTime?: number;
  }) {
    return this.prisma.interagencyRequest.create({ data });
  }

  async findRequests(
    filters: {
      agencyId?: string;
      requestType?: string;
      startDate?: string;
      endDate?: string;
    },
    skip = 0,
    take = 20,
  ) {
    const where = this.buildRequestFilters(filters);
    return this.prisma.interagencyRequest.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { agency: { select: { name: true, type: true } } },
    });
  }

  async countRequests(filters: {
    agencyId?: string;
    requestType?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where = this.buildRequestFilters(filters);
    return this.prisma.interagencyRequest.count({ where });
  }

  private buildRequestFilters(filters: {
    agencyId?: string;
    requestType?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};
    if (filters.agencyId) where.agencyId = filters.agencyId;
    if (filters.requestType) where.requestType = filters.requestType;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }
    return where;
  }
}
