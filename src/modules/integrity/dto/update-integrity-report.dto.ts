import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn, MaxLength } from 'class-validator';

export class UpdateIntegrityReportDto {
  @ApiPropertyOptional({
    description: 'Updated status',
    enum: ['OPEN', 'UNDER_REVIEW', 'CLOSED_ACTIONED', 'CLOSED_UNFOUNDED'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['OPEN', 'UNDER_REVIEW', 'CLOSED_ACTIONED', 'CLOSED_UNFOUNDED'])
  status?: string;

  @ApiPropertyOptional({ description: 'Officer ID to assign for investigation' })
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'Resolution notes' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  resolution?: string;
}
