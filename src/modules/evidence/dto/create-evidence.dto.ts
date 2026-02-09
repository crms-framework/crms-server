import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsIn,
  IsInt,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateEvidenceDto {
  @ApiProperty({ description: 'Case ID to link evidence to' })
  @IsUUID()
  caseId: string;

  @ApiProperty({
    description: 'Type of evidence',
    enum: ['physical', 'document', 'photo', 'video', 'audio', 'digital', 'biological', 'other'],
    example: 'physical',
  })
  @IsString()
  @IsIn(['physical', 'document', 'photo', 'video', 'audio', 'digital', 'biological', 'other'])
  type: string;

  @ApiProperty({ description: 'Description of the evidence', example: 'Knife found at the scene' })
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  description: string;

  @ApiPropertyOptional({ description: 'Location where evidence was collected' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @ApiProperty({ description: 'Officer ID who collected the evidence' })
  @IsUUID()
  collectedBy: string;

  @ApiPropertyOptional({ description: 'Date/time evidence was collected (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  collectedAt?: string;

  @ApiPropertyOptional({ description: 'QR code for evidence tracking (auto-generated if omitted)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  qrCode?: string;

  @ApiPropertyOptional({ description: 'Public URL of the uploaded file' })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional({ description: 'S3 object key for the file' })
  @IsOptional()
  @IsString()
  fileKey?: string;

  @ApiPropertyOptional({ description: 'SHA-256 hash of the file for integrity verification' })
  @IsOptional()
  @IsString()
  fileHash?: string;

  @ApiPropertyOptional({ description: 'File size in bytes' })
  @IsOptional()
  @IsInt()
  @Min(0)
  fileSize?: number;

  @ApiPropertyOptional({ description: 'MIME type of the file', example: 'image/jpeg' })
  @IsOptional()
  @IsString()
  fileMimeType?: string;
}
