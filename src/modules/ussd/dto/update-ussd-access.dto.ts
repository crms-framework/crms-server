import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

/**
 * DTO for enabling/disabling USSD access for an officer
 */
export class UpdateUssdAccessDto {
  @ApiProperty({
    description: 'Enable or disable USSD access',
    example: true,
  })
  @IsBoolean()
  ussdEnabled: boolean;
}

/**
 * Response DTO for USSD access update
 */
export class UpdateUssdAccessResponseDto {
  @ApiProperty({ description: 'Officer ID' })
  id: string;

  @ApiProperty({ description: 'USSD enabled status' })
  ussdEnabled: boolean;

  @ApiProperty({ description: 'Success message' })
  message: string;
}
