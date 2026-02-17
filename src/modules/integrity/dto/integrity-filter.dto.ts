import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class IntegrityFilterDto {
  @ApiPropertyOptional({ description: 'Filter by status (OPEN, UNDER_REVIEW, CLOSED_ACTIONED, CLOSED_UNFOUNDED)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by category' })
  @IsOptional()
  @IsString()
  category?: string;
}
