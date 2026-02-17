import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

export interface ApprovalFilters {
  status?: string;
  action?: string;
  resourceType?: string;
  requestedById?: string;
}

@Injectable()
export class ApprovalsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly defaultInclude = {
    requestedBy: { select: { id: true, badge: true, name: true } },
    approvedBy: { select: { id: true, badge: true, name: true } },
  };

  async create(data: {
    requestedById: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    payload: Record<string, any>;
    expiresAt: Date;
  }) {
    return this.prisma.pendingApproval.create({
      data,
      include: this.defaultInclude,
    });
  }

  async findAll(filters: ApprovalFilters) {
    const where: Record<string, any> = {};
    if (filters.status) where.status = filters.status;
    if (filters.action) where.action = filters.action;
    if (filters.resourceType) where.resourceType = filters.resourceType;
    if (filters.requestedById) where.requestedById = filters.requestedById;

    return this.prisma.pendingApproval.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: this.defaultInclude,
    });
  }

  async findById(id: string) {
    return this.prisma.pendingApproval.findUnique({
      where: { id },
      include: this.defaultInclude,
    });
  }

  async approve(id: string, approvedById: string) {
    return this.prisma.pendingApproval.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById,
        resolvedAt: new Date(),
      },
      include: this.defaultInclude,
    });
  }

  async reject(id: string, approvedById: string, rejectionReason: string) {
    return this.prisma.pendingApproval.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedById,
        rejectionReason,
        resolvedAt: new Date(),
      },
      include: this.defaultInclude,
    });
  }

  async expire(id: string) {
    return this.prisma.pendingApproval.update({
      where: { id },
      data: { status: 'EXPIRED' },
    });
  }

  async expireStale() {
    return this.prisma.pendingApproval.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    });
  }
}
