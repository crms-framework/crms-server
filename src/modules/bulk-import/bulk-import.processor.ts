import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { BulkImportRepository } from './bulk-import.repository';
import { ProcessorRegistry } from './processors/processor.registry';
import { FieldResolverUtil } from './utils/field-resolver.util';
import { UploadService } from '../upload/upload.service';
import { AuditService } from '../audit/audit.service';
import {
  ImportContext,
  ImportError,
} from './interfaces/import-processor.interface';
import { parseCsv, validateHeaders } from './utils/csv-parser.util';

interface ImportJobData {
  jobId: string;
  entityType: string;
  fileKey: string;
  officerId: string;
  stationId?: string;
  duplicateStrategy: 'skip' | 'update' | 'fail';
}

const BATCH_SIZE = 50;

@Processor('bulk-import')
export class BulkImportProcessor extends WorkerHost {
  private readonly logger = new Logger(BulkImportProcessor.name);

  constructor(
    private readonly repository: BulkImportRepository,
    private readonly processorRegistry: ProcessorRegistry,
    private readonly fieldResolver: FieldResolverUtil,
    private readonly uploadService: UploadService,
    private readonly auditService: AuditService,
  ) {
    super();
  }

  async process(job: Job<ImportJobData>): Promise<void> {
    const { jobId, entityType, fileKey, officerId, stationId, duplicateStrategy } =
      job.data;

    this.logger.log(`Processing import job ${jobId} for ${entityType}`);

    try {
      await this.repository.updateStatus(jobId, 'validating');

      const processor = this.processorRegistry.get(entityType);
      if (!processor) {
        throw new Error(`No processor found for entity type: ${entityType}`);
      }

      // 1. Fetch CSV from S3
      const buffer = await this.uploadService.getObjectBuffer(fileKey);
      const { headers, rows, errors: parseErrors } = parseCsv(buffer);

      if (parseErrors.length > 0) {
        await this.repository.updateProgress(jobId, {
          status: 'failed',
          errors: parseErrors.map((msg) => ({
            row: 0,
            field: 'csv',
            message: msg,
          })),
        });
        return;
      }

      if (rows.length === 0) {
        await this.repository.updateProgress(jobId, {
          status: 'failed',
          totalRows: 0,
          errors: [
            { row: 0, field: 'csv', message: 'CSV file contains no data rows' },
          ],
        });
        return;
      }

      // 2. Validate headers
      const requiredHeaders = processor.getRequiredHeaders();
      const allHeaders = processor.getTemplateHeaders();
      const headerValidation = validateHeaders(
        headers,
        requiredHeaders,
        allHeaders,
      );

      if (!headerValidation.valid) {
        const headerErrors: ImportError[] = [];
        for (const h of headerValidation.missing) {
          headerErrors.push({
            row: 0,
            field: h,
            message: `Missing required column: ${h}`,
          });
        }
        for (const h of headerValidation.unknown) {
          headerErrors.push({
            row: 0,
            field: h,
            message: `Unknown column: ${h}. Expected columns: ${allHeaders.join(', ')}`,
          });
        }
        await this.repository.updateProgress(jobId, {
          status: 'failed',
          totalRows: rows.length,
          errors: headerErrors,
        });
        return;
      }

      await this.repository.updateProgress(jobId, {
        totalRows: rows.length,
        status: 'processing',
      });

      // 3. Resolve lookup keys
      const lookupKeys = processor.extractLookupKeys(rows);
      const lookups = await this.fieldResolver.buildLookupCache(lookupKeys);

      const context: ImportContext = {
        officerId,
        stationId,
        duplicateStrategy,
        lookups,
      };

      // 4. Validate all rows
      const allErrors: ImportError[] = [];
      const validRowIndices: number[] = [];

      for (let i = 0; i < rows.length; i++) {
        const rowErrors = processor.validateRow(rows[i], i, context);
        if (rowErrors.length > 0) {
          allErrors.push(...rowErrors);
        } else {
          validRowIndices.push(i);
        }
      }

      // 5. Process valid rows in batches
      let successCount = 0;
      let errorCount = allErrors.length > 0 ? rows.length - validRowIndices.length : 0;
      let skippedCount = 0;
      let processedRows = rows.length - validRowIndices.length; // invalid rows already counted

      for (let batchStart = 0; batchStart < validRowIndices.length; batchStart += BATCH_SIZE) {
        // Check if job was cancelled
        const currentJob = await this.repository.findById(jobId);
        if (currentJob?.status === 'failed') {
          this.logger.log(`Job ${jobId} was cancelled, stopping processing`);
          return;
        }

        const batchEnd = Math.min(
          batchStart + BATCH_SIZE,
          validRowIndices.length,
        );
        const batchIndices = validRowIndices.slice(batchStart, batchEnd);

        for (const idx of batchIndices) {
          try {
            const result = await processor.processRow(rows[idx], idx, context);
            processedRows++;

            if (result.success) {
              if (result.action === 'skipped') {
                skippedCount++;
              } else {
                successCount++;
              }
            } else {
              errorCount++;
              if (result.error) {
                allErrors.push(result.error);
              }
            }
          } catch (err: any) {
            processedRows++;
            errorCount++;
            allErrors.push({
              row: idx + 2,
              field: 'general',
              message: err.message || 'Unexpected error processing row',
            });
          }
        }

        // Update progress after each batch
        await this.repository.updateProgress(jobId, {
          processedRows,
          successCount,
          errorCount,
          skippedCount,
          errors: allErrors.slice(0, 1000), // cap stored errors
        });
      }

      // 6. Complete
      await this.repository.updateProgress(jobId, {
        processedRows: rows.length,
        successCount,
        errorCount,
        skippedCount,
        errors: allErrors.slice(0, 1000),
        status: 'completed',
        summary: {
          totalRows: rows.length,
          successCount,
          errorCount,
          skippedCount,
          duration: Date.now() - (job.processedOn || job.timestamp),
        },
      });

      // 7. Audit log
      await this.logAudit(officerId, entityType, jobId, {
        totalRows: rows.length,
        successCount,
        errorCount,
        skippedCount,
      });

      this.logger.log(
        `Import job ${jobId} completed: ${successCount} created, ${skippedCount} skipped, ${errorCount} errors`,
      );
    } catch (err: any) {
      this.logger.error(`Import job ${jobId} failed: ${err.message}`, err.stack);
      await this.repository.updateProgress(jobId, {
        status: 'failed',
        errors: [
          { row: 0, field: 'system', message: err.message },
        ],
      });
    }
  }

  private async logAudit(
    officerId: string,
    entityType: string,
    jobId: string,
    details: Record<string, any>,
  ) {
    await this.auditService.createAuditLog({
      entityType: 'bulk-import',
      entityId: jobId,
      officerId,
      action: `bulk_import_${entityType}`,
      success: true,
      details,
    });
  }
}
