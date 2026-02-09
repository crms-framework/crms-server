import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpsertConfigDto {
  @ApiProperty({ example: 'general' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: { code: 'SLE', name: 'Sierra Leone' } })
  @IsNotEmpty()
  value: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;
}
