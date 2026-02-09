import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ReportStolenDto {
  @ApiPropertyOptional({ description: 'Additional notes about the theft' })
  @IsOptional()
  @IsString()
  notes?: string;
}
