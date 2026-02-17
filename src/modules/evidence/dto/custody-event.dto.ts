import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';

export class CustodyEventDto {
  @ApiProperty({
    description: 'Officer ID performing the custody action',
  })
  @IsString()
  officerId: string;

  @ApiProperty({
    description: 'Custody action being performed',
    enum: ['COLLECTED', 'TRANSFERRED', 'EXAMINED', 'SEALED', 'SUBMITTED_TO_COURT', 'RETURNED'],
    example: 'TRANSFERRED',
  })
  @IsString()
  @IsIn(['COLLECTED', 'TRANSFERRED', 'EXAMINED', 'SEALED', 'SUBMITTED_TO_COURT', 'RETURNED'])
  action: string;

  @ApiPropertyOptional({ description: 'Location evidence is being transferred from' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  fromLocation?: string;

  @ApiPropertyOptional({ description: 'Location evidence is being transferred to' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  toLocation?: string;

  @ApiPropertyOptional({ description: 'Additional notes about the custody event' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
