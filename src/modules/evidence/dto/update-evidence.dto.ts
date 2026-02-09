import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsIn,
  IsInt,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * DTO for updating evidence.
 * caseId is intentionally excluded -- evidence-case linkage is managed
 * through the CaseEvidence join table, not by direct field update.
 */
export class UpdateEvidenceDto {
  @ApiPropertyOptional({
    description: 'Type of evidence',
    enum: ['physical', 'document', 'photo', 'video', 'audio', 'digital', 'biological', 'other'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['physical', 'document', 'photo', 'video', 'audio', 'digital', 'biological', 'other'])
  type?: string;

  @ApiPropertyOptional({ description: 'Description of the evidence' })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: 'Location where evidence was collected' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  collectedLocation?: string;

  @ApiPropertyOptional({ description: 'Physical storage location' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  storageLocation?: string;

  @ApiPropertyOptional({ description: 'Tags for categorization', type: [String] })
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Public URL of the uploaded file' })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional({ description: 'S3 object key for the file' })
  @IsOptional()
  @IsString()
  fileKey?: string;

  @ApiPropertyOptional({ description: 'SHA-256 hash of the file' })
  @IsOptional()
  @IsString()
  fileHash?: string;

  @ApiPropertyOptional({ description: 'File size in bytes' })
  @IsOptional()
  @IsInt()
  @Min(0)
  fileSize?: number;

  @ApiPropertyOptional({ description: 'MIME type of the file' })
  @IsOptional()
  @IsString()
  fileMimeType?: string;
}
