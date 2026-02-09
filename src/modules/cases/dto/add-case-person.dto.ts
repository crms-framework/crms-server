import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export enum CasePersonRole {
  SUSPECT = 'suspect',
  VICTIM = 'victim',
  WITNESS = 'witness',
  INFORMANT = 'informant',
}

export class AddCasePersonDto {
  @ApiProperty({ description: 'Person ID to link to the case' })
  @IsUUID()
  personId: string;

  @ApiProperty({
    enum: CasePersonRole,
    example: 'suspect',
    description: 'Role of the person in the case',
  })
  @IsEnum(CasePersonRole, {
    message: 'Role must be one of: suspect, victim, witness, informant',
  })
  role: CasePersonRole;

  @ApiPropertyOptional({ description: 'Optional statement from the person' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  statement?: string;
}
