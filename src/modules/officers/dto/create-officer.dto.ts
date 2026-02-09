import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateOfficerDto {
  @ApiProperty({
    example: 'SA-00001',
    description: 'Unique officer badge number (format: XX-XXXX or XXX-XXXXX)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(20)
  @Matches(/^[A-Za-z]{2,4}-\d{4,6}$/, {
    message: 'Badge must follow format: XX-XXXX or XXX-XXXXX (e.g., SA-00001)',
  })
  badge: string;

  @ApiProperty({ example: 'John', description: 'Officer first name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Officer last name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({
    example: '12345678',
    description: 'Officer PIN (exactly 8 digits)',
  })
  @IsString()
  @IsNotEmpty()
  @Length(8, 8, { message: 'PIN must be exactly 8 digits' })
  @Matches(/^\d{8}$/, { message: 'PIN must contain only digits' })
  pin: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the role to assign',
  })
  @IsUUID()
  @IsNotEmpty()
  roleId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'ID of the station to assign',
  })
  @IsUUID()
  @IsNotEmpty()
  stationId: string;

  @ApiPropertyOptional({
    example: '+23276000000',
    description: 'Officer phone number',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[\d\s\-()]{8,20}$/, { message: 'Invalid phone number format' })
  phone?: string;

  @ApiPropertyOptional({
    example: 'john.doe@police.gov.sl',
    description: 'Officer email address',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ApiPropertyOptional({
    example: 'Inspector',
    description: 'Officer rank / title',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  rank?: string;

  @ApiPropertyOptional({
    example: 'NIN-123456789',
    description: 'National identification number',
  })
  @IsOptional()
  @IsString()
  @MinLength(5, { message: 'National ID must be at least 5 characters' })
  nationalId?: string;

  @ApiPropertyOptional({
    example: '2024-01-15',
    description: 'Enrollment date (ISO format, must not be in the future)',
  })
  @IsOptional()
  @IsString()
  enrollmentDate?: string;
}
