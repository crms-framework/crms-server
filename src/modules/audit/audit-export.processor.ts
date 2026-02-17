import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AuditRepository } from './audit.repository';

interface AuditExportJobData {
  startDate: string;
  endDate: string;
  period: string;
}

@Processor('audit-export')
export class AuditExportProcessor extends WorkerHost {
  private readonly logger = new Logger(AuditExportProcessor.name);

  constructor(private readonly auditRepository: AuditRepository) {
    super();
  }

  async process(job: Job<AuditExportJobData>): Promise<void> {
    const { startDate, endDate, period } = job.data;

    this.logger.log(`Processing audit export for period ${period}`);

    const logs = await this.auditRepository.getAuditLogsForExport(
      new Date(startDate),
      new Date(endDate),
    );

    if (logs.length === 0) {
      this.logger.log(`No audit logs found for period ${period}`);
      return;
    }

    // Generate CSV
    const headers = [
      'id',
      'entityType',
      'entityId',
      'officerId',
      'officerBadge',
      'officerName',
      'action',
      'details',
      'ipAddress',
      'stationId',
      'success',
      'previousHash',
      'entryHash',
      'createdAt',
    ];

    const csvRows = [
      headers.join(','),
      ...logs.map((log) =>
        [
          log.id,
          log.entityType,
          log.entityId || '',
          log.officerId || '',
          log.officer?.badge || '',
          log.officer?.name || '',
          log.action,
          `"${JSON.stringify(log.details).replace(/"/g, '""')}"`,
          log.ipAddress || '',
          log.stationId || '',
          log.success,
          log.previousHash || '',
          log.entryHash || '',
          log.createdAt.toISOString(),
        ].join(','),
      ),
    ];

    const csv = csvRows.join('\n');

    // In production, upload to S3 or equivalent storage
    // For now, log the export completion
    this.logger.log(
      `Audit export for ${period} complete: ${logs.length} entries, ${csv.length} bytes CSV`,
    );
  }
}
