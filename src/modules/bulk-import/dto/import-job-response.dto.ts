import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImportJobResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  entityType: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  fileName?: string;

  @ApiProperty()
  fileKey: string;

  @ApiProperty()
  duplicateStrategy: string;

  @ApiProperty()
  totalRows: number;

  @ApiProperty()
  processedRows: number;

  @ApiProperty()
  successCount: number;

  @ApiProperty()
  errorCount: number;

  @ApiProperty()
  skippedCount: number;

  @ApiProperty()
  percentComplete: number;

  @ApiProperty()
  errors: any[];

  @ApiPropertyOptional()
  summary?: any;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  startedAt?: Date;

  @ApiPropertyOptional()
  completedAt?: Date;

  static fromEntity(job: any): ImportJobResponseDto {
    const dto = new ImportJobResponseDto();
    dto.id = job.id;
    dto.entityType = job.entityType;
    dto.status = job.status;
    dto.fileName = job.fileName;
    dto.fileKey = job.fileKey;
    dto.duplicateStrategy = job.duplicateStrategy;
    dto.totalRows = job.totalRows;
    dto.processedRows = job.processedRows;
    dto.successCount = job.successCount;
    dto.errorCount = job.errorCount;
    dto.skippedCount = job.skippedCount;
    dto.percentComplete =
      job.totalRows > 0
        ? Math.round((job.processedRows / job.totalRows) * 100)
        : 0;
    dto.errors = job.errors as any[];
    dto.summary = job.summary;
    dto.createdAt = job.createdAt;
    dto.startedAt = job.startedAt;
    dto.completedAt = job.completedAt;
    return dto;
  }
}
