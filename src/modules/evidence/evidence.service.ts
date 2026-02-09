import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { EvidenceRepository, EvidenceFilters } from './evidence.repository';
import { PaginationQueryDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { BusinessRuleException } from '../../common/errors/business-rule.exception';

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  collected: ['stored', 'analyzed'],
  stored: ['analyzed', 'court', 'returned'],
  analyzed: ['stored', 'court'],
  court: ['returned', 'stored'],
  returned: ['destroyed', 'disposed'],
  destroyed: [],
  disposed: [],
};

@Injectable()
export class EvidenceService {
  private readonly logger = new Logger(EvidenceService.name);

  constructor(
    private readonly evidenceRepository: EvidenceRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(filters: EvidenceFilters, pagination: PaginationQueryDto) {
    const [data, total] = await Promise.all([
      this.evidenceRepository.findAll(
        filters,
        pagination.skip,
        pagination.take,
        pagination.sortBy || 'createdAt',
        pagination.sortOrder || 'desc',
      ),
      this.evidenceRepository.count(filters),
    ]);

    return new PaginatedResponseDto(
      data,
      total,
      pagination.page || 1,
      pagination.limit || 20,
    );
  }

  async findById(id: string, officerId: string) {
    const evidence = await this.evidenceRepository.findById(id);
    if (!evidence) {
      throw new NotFoundException(`Evidence not found: ${id}`);
    }

    await this.logAudit(officerId, 'read', id, { qrCode: evidence.qrCode });

    return evidence;
  }

  async findByQrCode(qrCode: string) {
    const evidence = await this.evidenceRepository.findByQrCode(qrCode);
    if (!evidence) {
      throw new NotFoundException(`Evidence with QR code "${qrCode}" not found`);
    }
    return evidence;
  }

  async create(
    data: {
      caseId: string;
      type: string;
      description: string;
      location?: string;
      collectedBy: string;
      collectedAt?: string;
      qrCode?: string;
      fileUrl?: string;
      fileKey?: string;
      fileHash?: string;
      fileSize?: number;
      fileMimeType?: string;
    },
    officerId: string,
    stationId: string,
  ) {
    const validTypes = ['physical', 'document', 'photo', 'video', 'audio', 'digital', 'biological', 'other'];
    if (!validTypes.includes(data.type)) {
      throw new BadRequestException(
        `Invalid evidence type. Must be one of: ${validTypes.join(', ')}`,
      );
    }

    const evidence = await this.evidenceRepository.create({
      type: data.type,
      description: data.description,
      location: data.location,
      collectedById: data.collectedBy,
      collectedDate: data.collectedAt ? new Date(data.collectedAt) : new Date(),
      stationId,
      qrCode: data.qrCode,
      fileUrl: data.fileUrl,
      fileKey: data.fileKey,
      fileHash: data.fileHash,
      fileSize: data.fileSize,
      fileMimeType: data.fileMimeType,
    });

    // Link to case
    await this.evidenceRepository.linkToCase(evidence.id, data.caseId, officerId);

    await this.logAudit(officerId, 'create', evidence.id, {
      qrCode: evidence.qrCode,
      type: data.type,
      caseId: data.caseId,
    });

    return evidence;
  }

  async update(id: string, data: Record<string, any>, officerId: string) {
    const existing = await this.evidenceRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Evidence not found: ${id}`);
    }

    if (existing.isSealed) {
      throw new BusinessRuleException('Cannot modify sealed evidence');
    }

    const evidence = await this.evidenceRepository.update(id, data);

    await this.logAudit(officerId, 'update', id, {
      qrCode: existing.qrCode,
      changes: Object.keys(data),
    });

    return evidence;
  }

  async updateStatus(id: string, newStatus: string, officerId: string) {
    const existing = await this.evidenceRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Evidence not found: ${id}`);
    }

    if (existing.isSealed) {
      throw new BusinessRuleException('Cannot modify sealed evidence');
    }

    const allowed = VALID_STATUS_TRANSITIONS[existing.status];
    if (!allowed) {
      throw new BusinessRuleException(`Unknown current status: ${existing.status}`);
    }
    if (!allowed.includes(newStatus)) {
      throw new BusinessRuleException(
        `Cannot transition evidence from "${existing.status}" to "${newStatus}". Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    const evidence = await this.evidenceRepository.updateStatus(id, newStatus);

    await this.logAudit(officerId, 'status_change', id, {
      qrCode: existing.qrCode,
      fromStatus: existing.status,
      toStatus: newStatus,
    });

    return evidence;
  }

  async addCustodyEvent(
    id: string,
    event: { officerId: string; action: string; location?: string; notes?: string },
    officerId: string,
  ) {
    const existing = await this.evidenceRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Evidence not found: ${id}`);
    }

    if (existing.isSealed) {
      throw new BusinessRuleException('Cannot modify chain of custody for sealed evidence');
    }

    const validActions = ['collected', 'transferred', 'stored', 'retrieved', 'returned', 'disposed'];
    if (!validActions.includes(event.action)) {
      throw new BadRequestException(
        `Invalid custody action. Must be one of: ${validActions.join(', ')}`,
      );
    }

    const evidence = await this.evidenceRepository.addCustodyEvent(id, event);

    await this.logAudit(officerId, 'add_custody_event', id, {
      qrCode: existing.qrCode,
      custodyAction: event.action,
    });

    return evidence;
  }

  async seal(id: string, officerId: string) {
    const existing = await this.evidenceRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Evidence not found: ${id}`);
    }

    if (existing.isSealed) {
      throw new BadRequestException('Evidence is already sealed');
    }

    const evidence = await this.evidenceRepository.seal(id, officerId);

    await this.logAudit(officerId, 'seal', id, {
      qrCode: existing.qrCode,
    });

    return evidence;
  }

  async linkToCase(evidenceId: string, caseId: string, officerId: string) {
    const existing = await this.evidenceRepository.findById(evidenceId);
    if (!existing) {
      throw new NotFoundException(`Evidence not found: ${evidenceId}`);
    }

    const result = await this.evidenceRepository.linkToCase(evidenceId, caseId, officerId);

    await this.logAudit(officerId, 'link_case', evidenceId, {
      qrCode: existing.qrCode,
      caseId,
    });

    return result;
  }

  async findByCase(caseId: string) {
    return this.evidenceRepository.findByCase(caseId);
  }

  async delete(id: string, officerId: string) {
    const existing = await this.evidenceRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Evidence not found: ${id}`);
    }

    if (existing.isSealed) {
      throw new BusinessRuleException('Cannot delete sealed evidence');
    }

    await this.evidenceRepository.delete(id);

    await this.logAudit(officerId, 'delete', id, {
      qrCode: existing.qrCode,
      type: existing.type,
    });

    return { deleted: true };
  }

  async getStats(stationId?: string) {
    const where = stationId ? { stationId } : {};

    const [total, byType, byStatus, sealed] = await Promise.all([
      this.prisma.evidence.count({ where }),
      this.prisma.evidence.groupBy({
        by: ['type'],
        where,
        _count: { id: true },
      }),
      this.prisma.evidence.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      this.prisma.evidence.count({ where: { ...where, isSealed: true } }),
    ]);

    return {
      total,
      sealed,
      byType: byType.map((r) => ({ type: r.type, count: r._count.id })),
      byStatus: byStatus.map((r) => ({ status: r.status, count: r._count.id })),
    };
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
          entityType: 'evidence',
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
