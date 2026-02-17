import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IntegrityController } from './integrity.controller';
import { IntegrityService } from './integrity.service';
import { IntegrityRepository } from './integrity.repository';
import { AnomalyDetectionProcessor } from './anomaly-detection.processor';
import { AnomalyDetectionScheduler } from './anomaly-detection.scheduler';

const redisEnabled = process.env.REDIS_ENABLED !== 'false';

@Module({
  imports: [
    ...(redisEnabled
      ? [BullModule.registerQueue({ name: 'anomaly-detection' })]
      : []),
  ],
  controllers: [IntegrityController],
  providers: [
    IntegrityService,
    IntegrityRepository,
    AnomalyDetectionScheduler,
    ...(redisEnabled ? [AnomalyDetectionProcessor] : []),
  ],
  exports: [IntegrityService],
})
export class IntegrityModule {}
