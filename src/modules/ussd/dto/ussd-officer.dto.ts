import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for filtering USSD officers list
 */
export class UssdOfficerFilterDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by station ID',
    example: 'cm3x1y2z3a4b5c6d7e8f9g0h',
  })
  @IsOptional()
  @IsString()
  stationId?: string;

  @ApiPropertyOptional({
    description: 'Filter by USSD enabled status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  ussdEnabled?: boolean;
}

/**
 * Response DTO for USSD officer list item
 */
export class UssdOfficerListItemDto {
  @ApiProperty({ description: 'Officer ID' })
  id: string;

  @ApiProperty({ description: 'Badge number' })
  badge: string;

  @ApiProperty({ description: 'Officer name' })
  name: string;

  @ApiProperty({ description: 'Police rank' })
  rank: string;

  @ApiProperty({ description: 'Station ID' })
  stationId: string;

  @ApiProperty({ description: 'Station name' })
  stationName: string;

  @ApiProperty({ description: 'USSD access enabled' })
  ussdEnabled: boolean;

  @ApiProperty({ description: 'Quick PIN has been set' })
  quickPinSet: boolean;

  @ApiPropertyOptional({ description: 'Registered phone number' })
  phoneNumber: string | null;

  @ApiPropertyOptional({ description: 'Last USSD query timestamp' })
  lastUssdQuery: Date | null;

  @ApiProperty({ description: 'Total USSD queries made' })
  queryCount: number;
}

/**
 * Response DTO for USSD officer details
 */
export class UssdOfficerDetailDto {
  @ApiProperty({ description: 'Officer ID' })
  id: string;

  @ApiProperty({ description: 'Badge number' })
  badge: string;

  @ApiProperty({ description: 'Officer name' })
  name: string;

  @ApiProperty({ description: 'Police rank' })
  rank: string;

  @ApiProperty({ description: 'Station details' })
  station: {
    id: string;
    name: string;
    code: string;
  };

  @ApiProperty({ description: 'USSD access enabled' })
  ussdEnabled: boolean;

  @ApiProperty({ description: 'Quick PIN has been set' })
  quickPinSet: boolean;

  @ApiPropertyOptional({ description: 'Registered phone number' })
  phoneNumber: string | null;

  @ApiPropertyOptional({ description: 'USSD registration timestamp' })
  registeredAt: Date | null;

  @ApiPropertyOptional({ description: 'Last USSD query timestamp' })
  lastUssdQuery: Date | null;

  @ApiProperty({ description: 'Total USSD queries made' })
  queryCount: number;

  @ApiProperty({ description: 'Recent USSD queries', type: [Object] })
  recentQueries: Array<{
    id: string;
    queryType: string;
    queryData: any;
    createdAt: Date;
  }>;
}

/**
 * Paginated response for USSD officers
 */
export class PaginatedUssdOfficersDto {
  @ApiProperty({ type: [UssdOfficerListItemDto] })
  data: UssdOfficerListItemDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: { page: 1, limit: 20, total: 50, totalPages: 3 },
  })
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
