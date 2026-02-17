import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class RejectApprovalDto {
  @ApiProperty({ description: 'Reason for rejecting the approval' })
  @IsString()
  @MaxLength(1000)
  reason: string;
}
