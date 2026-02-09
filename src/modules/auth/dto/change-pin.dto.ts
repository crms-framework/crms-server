import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class ChangePinDto {
  @ApiProperty({ description: 'Current PIN' })
  @IsString()
  @IsNotEmpty()
  currentPin: string;

  @ApiProperty({ description: 'New PIN (min 8 digits)' })
  @IsString()
  @MinLength(8)
  @Matches(/^\d+$/, { message: 'PIN must contain only digits' })
  newPin: string;
}

export class ResetPinDto {
  @ApiProperty({ description: 'Target officer ID' })
  @IsString()
  @IsNotEmpty()
  officerId: string;

  @ApiProperty({ description: 'New PIN (min 8 digits)' })
  @IsString()
  @MinLength(8)
  @Matches(/^\d+$/, { message: 'PIN must contain only digits' })
  newPin: string;
}
