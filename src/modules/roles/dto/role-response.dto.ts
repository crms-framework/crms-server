import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PermissionResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'cases' })
  resource: string;

  @ApiProperty({ example: 'read' })
  action: string;

  @ApiProperty({ example: 'station' })
  scope: string;
}

export class RoleResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Officer' })
  name: string;

  @ApiPropertyOptional({ example: 'Standard field officer' })
  description?: string;

  @ApiProperty({ example: 4 })
  level: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class RoleWithPermissionsResponseDto extends RoleResponseDto {
  @ApiProperty({ type: [PermissionResponseDto] })
  permissions: PermissionResponseDto[];
}
