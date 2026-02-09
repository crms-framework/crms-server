import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsInt, Min, Max, MinLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'Officer', description: 'Unique role name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'Standard field officer', description: 'Role description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 4, description: 'Role level (1=SuperAdmin to 6=Viewer)', minimum: 1, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  level: number;
}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}
