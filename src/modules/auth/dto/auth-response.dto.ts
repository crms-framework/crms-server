import { ApiProperty } from '@nestjs/swagger';

export class OfficerResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() badge: string;
  @ApiProperty() name: string;
  @ApiProperty() email: string | null;
  @ApiProperty() phone: string | null;
  @ApiProperty() roleId: string;
  @ApiProperty() roleName: string;
  @ApiProperty() roleLevel: number;
  @ApiProperty() stationId: string;
  @ApiProperty() stationName: string;
  @ApiProperty() stationCode: string;
  @ApiProperty() stationRegion: string;
  @ApiProperty() stationDistrict: string;
  @ApiProperty() active: boolean;
  @ApiProperty() mfaEnabled: boolean;
  @ApiProperty() permissions: PermissionDto[];
}

export class PermissionDto {
  @ApiProperty() resource: string;
  @ApiProperty() action: string;
  @ApiProperty() scope: string;
}

export class AuthResponseDto {
  @ApiProperty() accessToken: string;
  @ApiProperty() officer: OfficerResponseDto;
}
