import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, ArrayMinSize } from 'class-validator';

export class AddPermissionsDto {
  @ApiProperty({
    example: ['uuid-1', 'uuid-2'],
    description: 'Array of permission IDs to add to the role',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  permissionIds: string[];
}

export class RemovePermissionsDto {
  @ApiProperty({
    example: ['uuid-1', 'uuid-2'],
    description: 'Array of permission IDs to remove from the role',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  permissionIds: string[];
}

export class CreatePermissionDto {
  @ApiProperty({
    example: 'cases',
    description: 'Resource name (e.g. cases, persons, evidence, officers, stations, alerts, bgcheck, reports)',
  })
  @IsString()
  @IsNotEmpty()
  resource: string;

  @ApiProperty({
    example: 'read',
    description: 'Action (e.g. create, read, update, delete, export)',
  })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty({
    example: 'station',
    description: 'Scope (e.g. own, station, region, national)',
  })
  @IsString()
  @IsNotEmpty()
  scope: string;
}
