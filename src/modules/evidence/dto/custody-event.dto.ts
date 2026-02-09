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
    enum: ['collected', 'transferred', 'stored', 'retrieved', 'returned', 'disposed'],
    example: 'transferred',
  })
  @IsString()
  @IsIn(['collected', 'transferred', 'stored', 'retrieved', 'returned', 'disposed'])
  action: 'collected' | 'transferred' | 'stored' | 'retrieved' | 'returned' | 'disposed';

  @ApiPropertyOptional({ description: 'Location where the custody event occurred' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @ApiPropertyOptional({ description: 'Additional notes about the custody event' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
