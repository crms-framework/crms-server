import { ApiProperty } from '@nestjs/swagger';

export class HeatmapPointDto {
  @ApiProperty()
  region: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  period: string;

  @ApiProperty()
  caseCount: number;

  @ApiProperty()
  latitude: number;

  @ApiProperty()
  longitude: number;
}

export class ClusterDto {
  @ApiProperty()
  region: string;

  @ApiProperty()
  latitude: number;

  @ApiProperty()
  longitude: number;

  @ApiProperty()
  totalCases: number;
}

export class AggregateResultDto {
  @ApiProperty()
  aggregatesCreated: number;
}
