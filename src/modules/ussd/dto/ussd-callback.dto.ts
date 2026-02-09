import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UssdCallbackDto {
  @ApiProperty({ description: 'USSD session ID from the telecom gateway' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ description: 'Phone number of the caller' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'USSD input text from the user' })
  @IsOptional()
  @IsString()
  text?: string;
}
