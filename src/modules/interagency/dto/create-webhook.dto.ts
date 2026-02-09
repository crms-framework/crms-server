import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn, IsUrl } from 'class-validator';

export class CreateWebhookDto {
  @ApiProperty({
    enum: ['case.status_changed', 'warrant.issued', 'person.flagged', 'alert.created'],
  })
  @IsIn(['case.status_changed', 'warrant.issued', 'person.flagged', 'alert.created'])
  event: string;

  @ApiProperty()
  @IsUrl()
  url: string;
}
