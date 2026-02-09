import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StationResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'Headquarters Station' })
  name: string;

  @ApiProperty({ example: 'HQ' })
  code: string;

  @ApiProperty({ example: 'Freetown, Western Area' })
  location: string;

  @ApiPropertyOptional({ example: 'Western Area Urban' })
  district: string | null;

  @ApiPropertyOptional({ example: 'Western Area' })
  region: string | null;

  @ApiProperty({ example: 'SLE' })
  countryCode: string;

  @ApiPropertyOptional({ example: '+23222000000' })
  phone: string | null;

  @ApiPropertyOptional({ example: 'hq@police.gov.sl' })
  email: string | null;

  @ApiPropertyOptional({ example: 8.484 })
  latitude: number | null;

  @ApiPropertyOptional({ example: -13.2344 })
  longitude: number | null;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Number of officers assigned to this station' })
  officerCount?: number;
}
