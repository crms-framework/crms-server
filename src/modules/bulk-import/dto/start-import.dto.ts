import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MinLength } from 'class-validator';

export enum DuplicateStrategy {
  SKIP = 'skip',
  UPDATE = 'update',
  FAIL = 'fail',
}

export class StartImportDto {
  @ApiProperty({
    example: 'bulk-imports/persons/abc123.csv',
    description: 'S3 file key for the uploaded CSV',
  })
  @IsString()
  @MinLength(1)
  fileKey: string;

  @ApiPropertyOptional({
    example: 'freetown-persons-2026.csv',
    description: 'Original file name',
  })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({
    enum: DuplicateStrategy,
    default: DuplicateStrategy.SKIP,
    description: 'How to handle duplicate records',
  })
  @IsOptional()
  @IsEnum(DuplicateStrategy, {
    message: 'duplicateStrategy must be one of: skip, update, fail',
  })
  duplicateStrategy?: DuplicateStrategy = DuplicateStrategy.SKIP;
}
