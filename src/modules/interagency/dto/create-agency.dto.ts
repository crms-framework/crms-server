import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  IsInt,
  IsIn,
  IsObject,
  Min,
  Max,
} from 'class-validator';

export class CreateAgencyDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ['court', 'prison', 'immigration', 'interpol', 'other'] })
  @IsIn(['court', 'prison', 'immigration', 'interpol', 'other'])
  type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ipWhitelist?: string[];

  @ApiPropertyOptional({ default: 100, minimum: 1, maximum: 10000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  rateLimit?: number;

  @ApiProperty({ description: 'Permission map e.g. { "cases": ["read"], "persons": ["read"] }' })
  @IsObject()
  permissions: Record<string, string[]>;
}

export class UpdateAgencyDto extends PartialType(CreateAgencyDto) {}
