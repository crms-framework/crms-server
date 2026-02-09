import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { GeoCrimeRepository } from './geocrime.repository';

@Injectable()
export class GeoCrimeScheduler {
  private readonly logger = new Logger(GeoCrimeScheduler.name);

  constructor(private readonly geoCrimeRepository: GeoCrimeRepository) {}

  @Cron('0 2 * * *')
  async handleDailyAggregation() {
    this.logger.log('Starting daily GeoCrime aggregate rebuild...');
    try {
      const result = await this.geoCrimeRepository.rebuildAggregates();
      this.logger.log(
        `GeoCrime aggregate rebuild complete: ${result.aggregatesCreated} aggregates created`,
      );
    } catch (err) {
      this.logger.error('GeoCrime aggregate rebuild failed', err);
    }
  }
}
