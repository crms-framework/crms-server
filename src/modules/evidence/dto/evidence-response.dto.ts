import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustodyEventResponse {
  @ApiProperty() officerId: string;
  @ApiPropertyOptional() officerName?: string;
  @ApiPropertyOptional() officerBadge?: string;
  @ApiProperty() action: string;
  @ApiProperty() timestamp: string;
  @ApiPropertyOptional() location?: string;
  @ApiPropertyOptional() notes?: string;
}

export class EvidenceResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() type: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() qrCode: string;
  @ApiProperty() status: string;

  @ApiPropertyOptional() storageUrl?: string;
  @ApiPropertyOptional() fileKey?: string;
  @ApiPropertyOptional() fileHash?: string;
  @ApiPropertyOptional() fileName?: string;
  @ApiPropertyOptional() fileSize?: number;
  @ApiPropertyOptional() mimeType?: string;

  @ApiProperty() collectedDate: Date;
  @ApiProperty() collectedById: string;
  @ApiPropertyOptional() collectedLocation?: string;

  @ApiProperty() stationId: string;
  @ApiPropertyOptional() storageLocation?: string;
  @ApiProperty() isSealed: boolean;
  @ApiPropertyOptional() sealedAt?: Date;
  @ApiPropertyOptional() sealedBy?: string;

  @ApiProperty({ type: [String] }) tags: string[];
  @ApiPropertyOptional() notes?: string;
  @ApiProperty({ type: [CustodyEventResponse] }) chainOfCustody: CustodyEventResponse[];

  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  // Included when evidence is fetched with case relations
  @ApiPropertyOptional({ type: 'array', description: 'Linked cases (via CaseEvidence)' })
  cases?: any[];
}
