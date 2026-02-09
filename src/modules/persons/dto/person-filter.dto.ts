import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsUUID, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class PersonFilterDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by name, NIN, or alias' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by station ID' })
  @IsOptional()
  @IsUUID()
  stationId?: string;

  @ApiPropertyOptional({ description: 'Filter by wanted status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isWanted?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by gender',
    enum: ['male', 'female', 'other', 'unknown'],
  })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({
    description: 'Filter by risk level',
    enum: ['low', 'medium', 'high'],
  })
  @IsOptional()
  @IsString()
  riskLevel?: string;

  @ApiPropertyOptional({ description: 'Filter by whether person has a photo' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasPhoto?: boolean;
}
