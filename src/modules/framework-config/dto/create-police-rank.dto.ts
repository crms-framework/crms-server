import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsInt } from 'class-validator';

export class CreatePoliceRankDto {
  @ApiProperty({ example: 'Inspector General' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'IG' })
  @IsString()
  @IsNotEmpty()
  abbreviation: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  level: number;
}

export class UpdatePoliceRankDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() abbreviation?: string;
  @IsOptional() @IsInt() level?: number;
}
