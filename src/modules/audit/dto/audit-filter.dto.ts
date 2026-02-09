import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class AuditFilterDto {
  @ApiPropertyOptional({ description: 'Filter by entity type (e.g. case, officer, evidence)' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ description: 'Filter by officer ID' })
  @IsOptional()
  @IsString()
  officerId?: string;

  @ApiPropertyOptional({ description: 'Filter by action (e.g. create, update, delete, login)' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ description: 'Filter by station ID' })
  @IsOptional()
  @IsString()
  stationId?: string;

  @ApiPropertyOptional({ description: 'Filter by success status' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  success?: boolean;

  @ApiPropertyOptional({ description: 'Start date (ISO 8601)', example: '2025-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO 8601)', example: '2025-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
