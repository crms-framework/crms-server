import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCaseNoteDto {
  @ApiProperty({
    example: 'Witness confirmed suspect was at the scene between 10pm and midnight.',
    description: 'Note content (1-5000 chars). HTML tags are not allowed.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Mark note as confidential (restricted visibility)',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isConfidential?: boolean;
}

export class RedactCaseNoteDto {
  @ApiProperty({
    example: 'Contains information that could compromise an ongoing investigation',
    description: 'Reason for redacting this note (10-500 chars)',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason: string;
}
