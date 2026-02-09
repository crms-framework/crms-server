import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumber,
  IsDateString,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export enum CaseSeverity {
  MINOR = 'minor',
  MAJOR = 'major',
  CRITICAL = 'critical',
}

export class CreateCaseDto {
  @ApiProperty({ example: 'Theft at Market Street', description: 'Case title (5-200 chars)' })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Suspect was seen breaking into the premises at approximately 2am' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({ example: 'theft', description: 'Case category' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  category: string;

  @ApiProperty({ enum: CaseSeverity, example: 'major' })
  @IsEnum(CaseSeverity, { message: 'Severity must be one of: minor, major, critical' })
  severity: CaseSeverity;

  @ApiProperty({ description: 'Station ID where case is registered' })
  @IsUUID()
  stationId: string;

  @ApiPropertyOptional({ example: '2025-06-15T10:30:00Z', description: 'Incident date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  incidentDate?: string;

  @ApiPropertyOptional({ example: 'Market Street, Freetown' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @ApiPropertyOptional({ example: 8.484, description: 'Latitude for GeoCrime mapping' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: -13.2299, description: 'Longitude for GeoCrime mapping' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ example: 'Ward 1', description: 'Ward for GeoCrime aggregation' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  ward?: string;

  @ApiPropertyOptional({ example: 'Western Area Urban', description: 'District for GeoCrime aggregation' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  district?: string;
}
