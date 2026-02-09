import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsNumber,
  MinLength,
  MaxLength,
  Matches,
  Min,
  Max,
} from 'class-validator';

export class CreateStationDto {
  @ApiProperty({ example: 'Headquarters Station', description: 'Station name' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiProperty({
    example: 'HQ',
    description: 'Unique station code (2-10 uppercase alphanumeric characters)',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(10)
  @Matches(/^[A-Z0-9\-]+$/, {
    message: 'Station code must contain only uppercase letters, digits, and hyphens',
  })
  code: string;

  @ApiProperty({ example: 'Freetown, Western Area', description: 'Station location' })
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  location: string;

  @ApiPropertyOptional({ example: 'Western Area Urban' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  district?: string;

  @ApiPropertyOptional({ example: 'Western Area' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  region?: string;

  @ApiPropertyOptional({
    example: 'SLE',
    description: 'ISO 3166-1 alpha-3 country code (defaults to deployment country)',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(5)
  countryCode?: string;

  @ApiPropertyOptional({ example: '+23222000000' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[\d\s\-()]{8,20}$/, { message: 'Invalid phone number format' })
  phone?: string;

  @ApiPropertyOptional({ example: 'hq@police.gov.sl' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 8.484, description: 'Latitude (-90 to 90)' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: -13.2344, description: 'Longitude (-180 to 180)' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}
