import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'SA-00001', description: 'Officer badge number' })
  @IsString()
  @IsNotEmpty()
  badge: string;

  @ApiProperty({ example: '12345678', description: 'Officer PIN (min 8 digits)' })
  @IsString()
  @IsNotEmpty()
  pin: string;
}
