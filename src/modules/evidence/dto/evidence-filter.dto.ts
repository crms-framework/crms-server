import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsUUID, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class EvidenceFilterDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by case ID' })
  @IsOptional()
  @IsUUID()
  caseId?: string;

  @ApiPropertyOptional({
    description: 'Filter by evidence type',
    enum: ['physical', 'document', 'photo', 'video', 'audio', 'digital', 'biological', 'other'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['physical', 'document', 'photo', 'video', 'audio', 'digital', 'biological', 'other'])
  type?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ['collected', 'stored', 'analyzed', 'court', 'returned', 'destroyed', 'disposed'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['collected', 'stored', 'analyzed', 'court', 'returned', 'destroyed', 'disposed'])
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by station ID' })
  @IsOptional()
  @IsUUID()
  stationId?: string;

  @ApiPropertyOptional({ description: 'Filter by sealed status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isSealed?: boolean;

  @ApiPropertyOptional({ description: 'Free-text search across description and QR code' })
  @IsOptional()
  @IsString()
  search?: string;
}
