import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApprovalsRepository } from './approvals.repository';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class ApprovalsService {
  private readonly logger = new Logger(ApprovalsService.name);

  constructor(
    private readonly repository: ApprovalsRepository,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  async create(
    data: {
      action: string;
      resourceType: string;
      resourceId?: string;
      payload: Record<string, any>;
    },
    requestedById: string,
  ) {
    // Read expiry hours from FrameworkConfig, default 24
    let expiryHours = 24;
    try {
      const config = await this.prisma.frameworkConfig.findUnique({
        where: { key: 'approval.expiryHours' },
      });
      if (config?.value) {
        expiryHours = Number(config.value) || 24;
      }
    } catch {
      // Use default
    }

    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    const approval = await this.repository.create({
      requestedById,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      payload: data.payload,
      expiresAt,
    });

    await this.auditService.createAuditLog({
      entityType: 'approval',
      entityId: approval.id,
      officerId: requestedById,
      action: 'create_approval_request',
      details: {
        approvalAction: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        expiresAt: expiresAt.toISOString(),
      },
    });

    return approval;
  }

  async findAll(filters: { status?: string; action?: string; resourceType?: string }) {
    // Auto-expire stale approvals
    await this.repository.expireStale();
    return this.repository.findAll(filters);
  }

  async findById(id: string) {
    const approval = await this.repository.findById(id);
    if (!approval) {
      throw new NotFoundException(`Approval not found: ${id}`);
    }
    return approval;
  }

  async approve(id: string, approvedById: string) {
    const approval = await this.repository.findById(id);
    if (!approval) {
      throw new NotFoundException(`Approval not found: ${id}`);
    }

    if (approval.status !== 'PENDING') {
      throw new BadRequestException(`Approval is already ${approval.status}`);
    }

    if (approval.expiresAt < new Date()) {
      await this.repository.expire(id);
      throw new BadRequestException('Approval has expired');
    }

    // Cannot approve own request
    if (approval.requestedById === approvedById) {
      throw new ForbiddenException('Cannot approve your own request');
    }

    const result = await this.repository.approve(id, approvedById);

    await this.auditService.createAuditLog({
      entityType: 'approval',
      entityId: id,
      officerId: approvedById,
      action: 'approve_request',
      details: {
        approvalAction: approval.action,
        requestedById: approval.requestedById,
      },
    });

    return result;
  }

  async reject(id: string, approvedById: string, reason: string) {
    const approval = await this.repository.findById(id);
    if (!approval) {
      throw new NotFoundException(`Approval not found: ${id}`);
    }

    if (approval.status !== 'PENDING') {
      throw new BadRequestException(`Approval is already ${approval.status}`);
    }

    const result = await this.repository.reject(id, approvedById, reason);

    await this.auditService.createAuditLog({
      entityType: 'approval',
      entityId: id,
      officerId: approvedById,
      action: 'reject_request',
      details: {
        approvalAction: approval.action,
        requestedById: approval.requestedById,
        rejectionReason: reason,
      },
    });

    return result;
  }
}
