import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsDateString,
  IsEnum,
  IsUUID,
  MinLength,
  MaxLength,
  IsEmail,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  UNKNOWN = 'unknown',
}

export class AddressDto {
  @ApiPropertyOptional({ example: '123 Main Street' })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional({ example: 'Freetown' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Western Area' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ example: 'Western' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ example: 'SLE' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'current' })
  @IsOptional()
  @IsString()
  type?: string;
}

export class CreatePersonDto {
  @ApiPropertyOptional({
    example: 'NIN-123456789',
    description: 'National Identification Number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nin?: string;

  @ApiProperty({ example: 'John', description: 'First name' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Kamara', description: 'Last name' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiPropertyOptional({ example: 'Olu', description: 'Middle name' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  middleName?: string;

  @ApiPropertyOptional({
    example: ['JK', 'Big John'],
    description: 'Known aliases',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aliases?: string[];

  @ApiPropertyOptional({
    example: '1990-05-15',
    description: 'Date of birth (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({
    enum: Gender,
    example: Gender.MALE,
    description: 'Gender',
  })
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional({
    example: 'SLE',
    description: 'Nationality (country code)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  nationality?: string;

  @ApiPropertyOptional({ example: 'Freetown' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  placeOfBirth?: string;

  @ApiPropertyOptional({ example: 'Trader' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  occupation?: string;

  @ApiPropertyOptional({ example: 'single' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  maritalStatus?: string;

  @ApiPropertyOptional({ example: 'secondary' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  educationLevel?: string;

  @ApiPropertyOptional({ example: 'Temne' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  tribe?: string;

  @ApiPropertyOptional({ example: 'Islam' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  religion?: string;

  @ApiPropertyOptional({
    example: ['English', 'Krio'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languagesSpoken?: string[];

  @ApiPropertyOptional({
    example: 'Tall, dark complexion, scar on left cheek',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  physicalDescription?: string;

  @ApiPropertyOptional({
    description: 'Addresses (encrypted at rest)',
    type: [AddressDto],
  })
  @IsOptional()
  @IsArray()
  @Type(() => AddressDto)
  addresses?: AddressDto[];

  @ApiPropertyOptional({
    example: ['+23276000000'],
    description: 'Phone numbers (encrypted at rest)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  phoneNumbers?: string[];

  @ApiPropertyOptional({
    example: ['john@example.com'],
    description: 'Email addresses (encrypted at rest)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  emails?: string[];

  @ApiPropertyOptional({ description: 'SHA-256 fingerprint hash' })
  @IsOptional()
  @IsString()
  fingerprintHash?: string;

  @ApiPropertyOptional({ description: 'Biometric data hash' })
  @IsOptional()
  @IsString()
  biometricHash?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;

  @ApiProperty({ description: 'Station ID where record is created' })
  @IsUUID()
  stationId: string;
}
