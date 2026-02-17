import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';

export class CreateIntegrityReportDto {
  @ApiProperty({
    description: 'Category of the integrity concern',
    enum: ['UNAUTHORIZED_ACCESS', 'DATA_ALTERATION', 'EXCESSIVE_QUERIES', 'IMPERSONATION', 'OTHER'],
  })
  @IsString()
  @IsIn(['UNAUTHORIZED_ACCESS', 'DATA_ALTERATION', 'EXCESSIVE_QUERIES', 'IMPERSONATION', 'OTHER'])
  category: string;

  @ApiProperty({ description: 'Description of the integrity concern' })
  @IsString()
  @MaxLength(5000)
  description: string;

  @ApiPropertyOptional({ description: 'Reference to relevant audit log entries or evidence' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  evidenceLog?: string;
}
