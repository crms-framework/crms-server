import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class VehicleFilterDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['active', 'stolen', 'recovered', 'impounded'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerNIN?: string;
}
