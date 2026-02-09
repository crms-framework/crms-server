import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsIn,
  IsDateString,
  IsArray,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class WarrantRequestDto {
  @ApiProperty()
  @IsString()
  nationalId: string;

  @ApiProperty()
  @IsString()
  warrantNumber: string;

  @ApiProperty({ enum: ['issue', 'update', 'revoke'] })
  @IsIn(['issue', 'update', 'revoke'])
  action: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  charges: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courtCaseNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;
}

export class FlagRequestDto {
  @ApiProperty()
  @IsString()
  nationalId: string;

  @ApiProperty({ enum: ['travel_ban', 'watchlist', 'hold'] })
  @IsIn(['travel_ban', 'watchlist', 'hold'])
  flagType: string;

  @ApiProperty()
  @IsString()
  reason: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class InteragencyRequestFilterDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agencyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requestType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
