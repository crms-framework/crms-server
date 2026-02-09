import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ example: 'SLE-1234-AB' })
  @IsString()
  licensePlate: string;

  @ApiPropertyOptional({ example: 'NIN-000001' })
  @IsOptional()
  @IsString()
  ownerNIN?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  ownerName?: string;

  @ApiProperty({ example: 'sedan' })
  @IsString()
  vehicleType: string;

  @ApiPropertyOptional({ example: 'Toyota' })
  @IsOptional()
  @IsString()
  make?: string;

  @ApiPropertyOptional({ example: 'Corolla' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 'blue' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 2020 })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number;

  @ApiProperty({ description: 'Station ID where vehicle is registered' })
  @IsString()
  stationId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
