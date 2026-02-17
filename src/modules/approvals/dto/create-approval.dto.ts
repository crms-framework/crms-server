import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, MaxLength } from 'class-validator';

export class CreateApprovalDto {
  @ApiProperty({ description: 'Action requiring approval', example: 'bulk_delete_persons' })
  @IsString()
  @MaxLength(200)
  action: string;

  @ApiProperty({ description: 'Type of resource affected', example: 'persons' })
  @IsString()
  @MaxLength(100)
  resourceType: string;

  @ApiPropertyOptional({ description: 'ID of the specific resource affected' })
  @IsOptional()
  @IsString()
  resourceId?: string;

  @ApiProperty({ description: 'Payload/context for the action' })
  @IsObject()
  payload: Record<string, any>;
}
