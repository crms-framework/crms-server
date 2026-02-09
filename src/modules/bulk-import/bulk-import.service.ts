import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BulkImportRepository } from './bulk-import.repository';
import { ProcessorRegistry } from './processors/processor.registry';
import { StartImportDto } from './dto/start-import.dto';
import { ImportFilterDto } from './dto/import-filter.dto';
import { ImportJobResponseDto } from './dto/import-job-response.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { generateCsvTemplate } from './utils/csv-parser.util';

@Injectable()
export class BulkImportService {
  private readonly logger = new Logger(BulkImportService.name);

  constructor(
    private readonly repository: BulkImportRepository,
    private readonly processorRegistry: ProcessorRegistry,
    @InjectQueue('bulk-import') private readonly importQueue: Queue,
  ) {}

  async startImport(
    entityType: string,
    dto: StartImportDto,
    officerId: string,
    stationId?: string,
  ) {
    if (!this.processorRegistry.isValid(entityType)) {
      throw new BadRequestException(
        `Invalid entity type "${entityType}". Must be one of: ${this.processorRegistry.getValidTypes().join(', ')}`,
      );
    }

    const job = await this.repository.create({
      entityType,
      fileKey: dto.fileKey,
      fileName: dto.fileName,
      duplicateStrategy: dto.duplicateStrategy || 'skip',
      officerId,
      stationId,
    });

    await this.importQueue.add('process-import', {
      jobId: job.id,
      entityType,
      fileKey: dto.fileKey,
      officerId,
      stationId,
      duplicateStrategy: dto.duplicateStrategy || 'skip',
    });

    this.logger.log(
      `Import job ${job.id} queued for ${entityType} (file: ${dto.fileKey})`,
    );

    return ImportJobResponseDto.fromEntity(job);
  }

  async getJob(jobId: string) {
    const job = await this.repository.findById(jobId);
    if (!job) {
      throw new NotFoundException(`Import job not found: ${jobId}`);
    }
    return ImportJobResponseDto.fromEntity(job);
  }

  async listJobs(filters: ImportFilterDto) {
    const skip = ((filters.page || 1) - 1) * (filters.limit || 20);
    const take = filters.limit || 20;

    const { data, total } = await this.repository.findAll(
      {
        entityType: filters.entityType,
        status: filters.status,
      },
      skip,
      take,
    );

    return new PaginatedResponseDto(
      data.map((job) => ImportJobResponseDto.fromEntity(job)),
      total,
      filters.page || 1,
      filters.limit || 20,
    );
  }

  async cancelJob(jobId: string) {
    const job = await this.repository.findById(jobId);
    if (!job) {
      throw new NotFoundException(`Import job not found: ${jobId}`);
    }

    if (job.status === 'completed' || job.status === 'failed') {
      throw new BadRequestException(
        `Cannot cancel a job with status "${job.status}"`,
      );
    }

    await this.repository.updateStatus(jobId, 'failed');

    this.logger.log(`Import job ${jobId} cancelled`);

    return { cancelled: true, jobId };
  }

  getTemplate(entityType: string): { csv: string; fileName: string } {
    if (!this.processorRegistry.isValid(entityType)) {
      throw new BadRequestException(
        `Invalid entity type "${entityType}". Must be one of: ${this.processorRegistry.getValidTypes().join(', ')}`,
      );
    }

    const processor = this.processorRegistry.get(entityType)!;
    const headers = processor.getTemplateHeaders();
    const examples = processor.getTemplateExamples();
    const csv = generateCsvTemplate(headers, examples);

    return { csv, fileName: `${entityType}-import-template.csv` };
  }
}
