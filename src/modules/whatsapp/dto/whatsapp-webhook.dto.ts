import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class WhatsappWebhookDto {
  @ApiPropertyOptional({ description: 'Raw webhook event payload from Whapi' })
  @IsOptional()
  @IsObject()
  messages?: any[];
}

export class CreateNewsletterDto {
  @ApiProperty({ description: 'WhatsApp channel ID' })
  @IsString()
  @IsNotEmpty()
  channelId: string;

  @ApiProperty({ description: 'Newsletter name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Newsletter description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Picture URL for the newsletter' })
  @IsOptional()
  @IsString()
  pictureUrl?: string;
}

export class UpdateNewsletterDto {
  @ApiPropertyOptional({ description: 'Newsletter name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Newsletter description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Picture URL for the newsletter' })
  @IsOptional()
  @IsString()
  pictureUrl?: string;

  @ApiPropertyOptional({ description: 'Newsletter status (active, paused, archived)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Whether reactions are enabled' })
  @IsOptional()
  reactionsEnabled?: boolean;
}
