import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';
import { CaseStatus } from './update-case-status.dto.js';
import { CaseSeverity } from './create-case.dto.js';

export class CaseFilterDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by case number or title' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: CaseStatus, description: 'Filter by case status' })
  @IsOptional()
  @IsEnum(CaseStatus)
  status?: CaseStatus;

  @ApiPropertyOptional({ description: 'Filter by case category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: CaseSeverity, description: 'Filter by severity' })
  @IsOptional()
  @IsEnum(CaseSeverity)
  severity?: CaseSeverity;

  @ApiPropertyOptional({ description: 'Filter by station ID' })
  @IsOptional()
  @IsUUID()
  stationId?: string;

  @ApiPropertyOptional({ description: 'Filter by assigned officer ID' })
  @IsOptional()
  @IsUUID()
  officerId?: string;

  @ApiPropertyOptional({ example: '2025-01-01', description: 'Start date filter (incident date)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-12-31', description: 'End date filter (incident date)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
