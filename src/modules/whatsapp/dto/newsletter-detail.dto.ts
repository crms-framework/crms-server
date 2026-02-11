import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for newsletter detail response with nested relations
 */
export class NewsletterDetailDto {
  @ApiProperty({ description: 'Newsletter ID' })
  id: string;

  @ApiProperty({ description: 'Newsletter name' })
  name: string;

  @ApiPropertyOptional({ description: 'Description' })
  description: string | null;

  @ApiProperty({ description: 'WhatsApp channel ID' })
  channelId: string;

  @ApiProperty({ description: 'Active status' })
  isActive: boolean;

  @ApiProperty({ description: 'Number of subscribers' })
  subscriberCount: number;

  @ApiProperty({ description: 'Number of broadcasts sent' })
  broadcastCount: number;

  @ApiProperty({ description: 'Created by officer' })
  createdBy: {
    id: string;
    badge: string;
    name: string;
  };

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'List of subscribers', type: [Object] })
  subscribers: Array<{
    phoneNumber: string;
    name: string | null;
    subscribedAt: Date;
    isActive: boolean;
  }>;

  @ApiProperty({ description: 'Recent broadcasts', type: [Object] })
  recentBroadcasts: Array<{
    id: string;
    message: string;
    sentAt: Date;
    deliveredCount: number;
    readCount: number;
    failedCount: number;
    status: string;
  }>;
}

/**
 * DTO for subscriber list query params
 */
export class SubscriberFilterDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

/**
 * Response DTO for subscriber list
 */
export class SubscriberDto {
  @ApiProperty({ description: 'Phone number' })
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Subscriber name' })
  name: string | null;

  @ApiProperty({ description: 'Subscription timestamp' })
  subscribedAt: Date;

  @ApiProperty({ description: 'Active status' })
  isActive: boolean;
}

export class PaginatedSubscribersDto {
  @ApiProperty({ type: [SubscriberDto] })
  data: SubscriberDto[];

  @ApiProperty({ description: 'Pagination metadata' })
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Response DTO for broadcast history
 */
export class BroadcastDto {
  @ApiProperty({ description: 'Broadcast ID' })
  id: string;

  @ApiProperty({ description: 'Message content' })
  message: string;

  @ApiProperty({ description: 'Sent timestamp' })
  sentAt: Date;

  @ApiProperty({ description: 'Number of messages delivered' })
  deliveredCount: number;

  @ApiProperty({ description: 'Number of messages read' })
  readCount: number;

  @ApiProperty({ description: 'Number of failed messages' })
  failedCount: number;

  @ApiProperty({ description: 'Overall status', enum: ['sent', 'delivered', 'failed'] })
  status: string;
}

export class PaginatedBroadcastsDto {
  @ApiProperty({ type: [BroadcastDto] })
  data: BroadcastDto[];

  @ApiProperty({ description: 'Pagination metadata' })
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
