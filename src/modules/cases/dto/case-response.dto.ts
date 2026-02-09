import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CaseStationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;
}

export class CaseOfficerResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  badge: string;
}

export class CasePersonResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  personId: string;

  @ApiProperty()
  role: string;

  @ApiPropertyOptional()
  statement?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  person?: {
    id: string;
    firstName: string;
    lastName: string;
    nationalId?: string;
  };
}

export class CaseNoteResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  caseId: string;

  @ApiPropertyOptional()
  officerId?: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  redaction?: {
    id: string;
    redactedById: string;
    redactionReason: string;
    redactedAt: Date;
  };
}

export class CaseResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'HQ-2025-000001' })
  caseNumber: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  severity: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  incidentDate: Date;

  @ApiProperty()
  reportedDate: Date;

  @ApiPropertyOptional()
  location?: string;

  @ApiPropertyOptional()
  latitude?: number;

  @ApiPropertyOptional()
  longitude?: number;

  @ApiPropertyOptional()
  ward?: string;

  @ApiPropertyOptional()
  district?: string;

  @ApiProperty()
  stationId: string;

  @ApiProperty()
  officerId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: CaseStationResponseDto })
  station?: CaseStationResponseDto;

  @ApiPropertyOptional({ type: CaseOfficerResponseDto })
  officer?: CaseOfficerResponseDto;

  @ApiPropertyOptional({ type: [CasePersonResponseDto] })
  persons?: CasePersonResponseDto[];

  @ApiPropertyOptional({ type: [CaseNoteResponseDto] })
  notes?: CaseNoteResponseDto[];
}
