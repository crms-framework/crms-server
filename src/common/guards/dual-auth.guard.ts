import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../database/prisma.service';
import { DUAL_AUTH_KEY } from '../decorators/dual-auth.decorator';

@Injectable()
export class DualAuthGuard implements CanActivate {
  private readonly logger = new Logger(DualAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiresDualAuth = this.reflector.getAllAndOverride<boolean>(
      DUAL_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiresDualAuth) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('No authenticated user');
    }

    const approvalId =
      request.headers['x-approval-id'] || request.body?.approvalId;

    if (!approvalId) {
      throw new ForbiddenException(
        'This action requires dual authorization. Provide an approved approval ID via x-approval-id header or approvalId in the request body.',
      );
    }

    const approval = await this.prisma.pendingApproval.findUnique({
      where: { id: approvalId },
    });

    if (!approval) {
      throw new ForbiddenException('Approval not found');
    }

    // Auto-expire stale approvals
    if (approval.status === 'PENDING' && approval.expiresAt < new Date()) {
      await this.prisma.pendingApproval.update({
        where: { id: approvalId },
        data: { status: 'EXPIRED' },
      });
      throw new ForbiddenException('Approval has expired');
    }

    if (approval.status !== 'APPROVED') {
      throw new ForbiddenException(
        `Approval status is ${approval.status}. Only APPROVED approvals can be used.`,
      );
    }

    if (approval.expiresAt < new Date()) {
      throw new ForbiddenException('Approval has expired');
    }

    // The person using the approval must be the one who requested it
    if (approval.requestedById !== user.sub) {
      throw new ForbiddenException(
        'This approval was not requested by you',
      );
    }

    // The approver must be a different person than the requester
    if (approval.approvedById === approval.requestedById) {
      throw new ForbiddenException(
        'Approval was self-approved, which is not allowed',
      );
    }

    // Attach approval info to request for downstream use
    request.approval = approval;

    return true;
  }
}
