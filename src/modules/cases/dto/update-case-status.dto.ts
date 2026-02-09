import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum CaseStatus {
  OPEN = 'open',
  INVESTIGATING = 'investigating',
  CHARGED = 'charged',
  COURT = 'court',
  CLOSED = 'closed',
}

export class UpdateCaseStatusDto {
  @ApiProperty({
    enum: CaseStatus,
    example: 'investigating',
    description: 'New case status. Flow: open -> investigating -> charged -> court -> closed (can close from any non-closed state)',
  })
  @IsEnum(CaseStatus, {
    message: 'Status must be one of: open, investigating, charged, court, closed',
  })
  status: CaseStatus;

  @ApiPropertyOptional({ example: 'Sufficient evidence collected to proceed with charges' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
