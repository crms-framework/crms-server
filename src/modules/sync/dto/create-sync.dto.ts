import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class CreateSyncDto {
  @ApiProperty({ description: 'Entity type (e.g. case, person, evidence)' })
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiProperty({ description: 'Entity ID' })
  @IsString()
  @IsNotEmpty()
  entityId: string;

  @ApiProperty({ description: 'Operation type (create, update, delete)' })
  @IsString()
  @IsNotEmpty()
  operation: string;

  @ApiProperty({ description: 'Operation payload' })
  @IsObject()
  payload: Record<string, any>;
}

export class SyncFilterDto {
  @ApiPropertyOptional({ description: 'Filter by status (pending, processing, completed, failed)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by entity type' })
  @IsOptional()
  @IsString()
  entityType?: string;
}
