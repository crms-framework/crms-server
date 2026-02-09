import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PersonResponseDto {
  @ApiProperty({ example: 'uuid-string', description: 'Person ID' })
  id: string;

  @ApiPropertyOptional({
    example: 'NIN-123456789',
    description: 'National Identification Number',
  })
  nationalId?: string | null;

  @ApiPropertyOptional({ example: 'NIN', description: 'ID type' })
  idType?: string | null;

  @ApiProperty({ example: 'SLE', description: 'Country code' })
  countryCode: string;

  @ApiProperty({ example: 'John', description: 'First name' })
  firstName: string;

  @ApiProperty({ example: 'Kamara', description: 'Last name' })
  lastName: string;

  @ApiPropertyOptional({ example: 'Olu', description: 'Middle name' })
  middleName?: string | null;

  @ApiPropertyOptional({ example: 'John Olu Kamara', description: 'Computed full name' })
  fullName?: string | null;

  @ApiPropertyOptional({
    example: ['JK', 'Big John'],
    description: 'Known aliases',
    type: [String],
  })
  aliases: string[];

  @ApiPropertyOptional({
    example: '1990-05-15T00:00:00.000Z',
    description: 'Date of birth',
  })
  dob?: string | null;

  @ApiPropertyOptional({
    example: 'male',
    description: 'Gender',
    enum: ['male', 'female', 'other', 'unknown'],
  })
  gender?: string | null;

  @ApiProperty({ example: 'SLE', description: 'Nationality' })
  nationality: string;

  @ApiPropertyOptional({ description: 'Photo URL' })
  photoUrl?: string | null;

  @ApiPropertyOptional({ description: 'Thumbnail photo URL' })
  photoThumbnailUrl?: string | null;

  @ApiPropertyOptional({ description: 'Small photo URL' })
  photoSmallUrl?: string | null;

  @ApiPropertyOptional({ description: 'Medium photo URL' })
  photoMediumUrl?: string | null;

  @ApiPropertyOptional({ description: 'Whether fingerprint data exists' })
  hasFingerprintData: boolean;

  @ApiPropertyOptional({ description: 'Whether biometric data exists' })
  hasBiometricData: boolean;

  @ApiProperty({ example: false, description: 'Whether person is wanted' })
  isWanted: boolean;

  @ApiPropertyOptional({ description: 'Date when marked as wanted' })
  wantedSince?: string | null;

  @ApiProperty({ example: false, description: 'Deceased or missing status' })
  isDeceasedOrMissing: boolean;

  @ApiPropertyOptional({
    example: 'low',
    description: 'Risk level',
    enum: ['low', 'medium', 'high'],
  })
  riskLevel?: string | null;

  @ApiProperty({ description: 'ID of the officer who created this record' })
  createdById: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: string;

  // Decrypted PII fields (only included for authorized requests)
  @ApiPropertyOptional({ description: 'Decrypted addresses' })
  addresses?: any[];

  @ApiPropertyOptional({ description: 'Decrypted phone numbers', type: [String] })
  phoneNumbers?: string[];

  @ApiPropertyOptional({ description: 'Decrypted email addresses', type: [String] })
  emails?: string[];
}

export class RedactedPersonResponseDto {
  @ApiProperty({ description: 'Person ID' })
  id: string;

  @ApiProperty({ description: 'First name' })
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  lastName: string;

  @ApiPropertyOptional({ description: 'Gender' })
  gender?: string | null;

  @ApiProperty({ description: 'Whether person is wanted' })
  isWanted: boolean;

  @ApiPropertyOptional({ description: 'Risk level' })
  riskLevel?: string | null;

  @ApiPropertyOptional({ description: 'Photo URL' })
  photoThumbnailUrl?: string | null;

  @ApiProperty({ description: 'Record status summary' })
  status: string;
}
