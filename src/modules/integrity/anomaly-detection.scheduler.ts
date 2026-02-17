import { Injectable, Optional, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class AnomalyDetectionScheduler {
  private readonly logger = new Logger(AnomalyDetectionScheduler.name);

  constructor(
    @Optional() @InjectQueue('anomaly-detection') private readonly anomalyQueue?: Queue,
  ) {}

  @Cron('0 2 * * *')
  async runDailyAnomalyDetection() {
    if (!this.anomalyQueue) {
      this.logger.debug('Anomaly detection queue not available (Redis disabled), skipping');
      return;
    }

    await this.anomalyQueue.add('daily-scan', {
      triggeredAt: new Date().toISOString(),
    });

    this.logger.log('Queued daily anomaly detection scan');
  }
}
