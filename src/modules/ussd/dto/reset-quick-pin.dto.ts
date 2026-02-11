import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

/**
 * DTO for resetting an officer's Quick PIN for USSD access
 */
export class ResetQuickPinDto {
  @ApiProperty({
    description: 'New Quick PIN (4-6 digits)',
    example: '1234',
    minLength: 4,
    maxLength: 6,
  })
  @IsString()
  @MinLength(4, { message: 'Quick PIN must be at least 4 digits' })
  @MaxLength(6, { message: 'Quick PIN must be at most 6 digits' })
  @Matches(/^\d+$/, { message: 'Quick PIN must contain only digits' })
  newQuickPin: string;
}

/**
 * Response DTO for Quick PIN reset
 */
export class ResetQuickPinResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Success message' })
  message: string;

  @ApiProperty({ description: 'Officer ID' })
  officerId: string;
}
