import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsService } from './notifications.service';
import { NotificationsProcessor } from './notifications.processor';

const redisEnabled = process.env.REDIS_ENABLED !== 'false';

@Module({
  imports: [
    ...(redisEnabled
      ? [BullModule.registerQueue({ name: 'notifications' })]
      : []),
  ],
  providers: [
    NotificationsService,
    ...(redisEnabled ? [NotificationsProcessor] : []),
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
