import { Injectable, NotFoundException, Logger, Optional } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AuditRepository, AuditLogFilters } from './audit.repository';
import { PrismaService } from '../../common/database/prisma.service';
import { PaginationQueryDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { computeAuditEntryHash } from '../../common/utils/crypto.util';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly auditRepository: AuditRepository,
    private readonly prisma: PrismaService,
    @Optional() @InjectQueue('audit-export') private readonly auditExportQueue?: Queue,
  ) {}

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
   * Creates an audit log entry with hash-chain integrity.
   * Uses a Prisma transaction with pg_advisory_xact_lock to serialize writes.
   * Failures are logged but swallowed to prevent audit infrastructure from
   * breaking business operations.
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
      return await this.prisma.$transaction(async (tx) => {
        // Acquire advisory lock to serialize hash chain writes
        await tx.$executeRawUnsafe('SELECT pg_advisory_xact_lock(42)');

        // Get the latest entry hash
        const latest = await tx.auditLog.findFirst({
          where: { entryHash: { not: null } },
          orderBy: { createdAt: 'desc' },
          select: { entryHash: true },
        });
        const previousHash = latest?.entryHash ?? null;

        // Create the audit record with previousHash
        const record = await tx.auditLog.create({
          data: {
            ...data,
            success: data.success ?? true,
            previousHash,
          },
        });

        // Compute and update the entry hash
        const entryHash = computeAuditEntryHash(
          record.id,
          record.action,
          record.officerId,
          record.createdAt,
          previousHash,
        );

        await tx.auditLog.update({
          where: { id: record.id },
          data: { entryHash },
        });

        return { ...record, entryHash };
      });
    } catch (error) {
      this.logger.error(
        `Failed to create audit log: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    }
  }

  /**
   * Verifies the integrity of the audit hash chain.
   * Walks the chain and recomputes hashes to detect tampering.
   * Pre-migration entries (null hashes) are skipped.
   */
  async verifyAuditChain(startDate?: Date, endDate?: Date) {
    const entries = await this.auditRepository.getAuditChainForVerification(
      startDate,
      endDate,
    );

    let breaks: Array<{ id: string; expected: string; actual: string | null; position: number }> = [];
    let verified = 0;
    let skipped = 0;
    let previousHash: string | null = null;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      // Skip pre-migration entries without hashes
      if (!entry.entryHash) {
        skipped++;
        previousHash = null;
        continue;
      }

      // Verify previousHash linkage
      if (previousHash !== null && entry.previousHash !== previousHash) {
        breaks.push({
          id: entry.id,
          expected: previousHash,
          actual: entry.previousHash,
          position: i,
        });
      }

      // Recompute and verify entry hash
      const expectedHash = computeAuditEntryHash(
        entry.id,
        entry.action,
        entry.officerId,
        entry.createdAt,
        entry.previousHash,
      );

      if (expectedHash !== entry.entryHash) {
        breaks.push({
          id: entry.id,
          expected: expectedHash,
          actual: entry.entryHash,
          position: i,
        });
      }

      verified++;
      previousHash = entry.entryHash;
    }

    return {
      valid: breaks.length === 0,
      totalEntries: entries.length,
      verified,
      skipped,
      breaks,
    };
  }

  /**
   * Monthly audit export scheduler.
   * Runs at 2am on the 1st of each month.
   */
  @Cron('0 2 1 * *')
  async scheduleMonthlyExport() {
    if (!this.auditExportQueue) {
      this.logger.debug('Audit export queue not available (Redis disabled), skipping monthly export');
      return;
    }

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    await this.auditExportQueue.add('monthly-export', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      period: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`,
    });

    this.logger.log(`Queued monthly audit export for ${startDate.toISOString()} to ${endDate.toISOString()}`);
  }
}
