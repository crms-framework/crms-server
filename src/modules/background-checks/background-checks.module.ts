import { Module } from '@nestjs/common';
import { BackgroundChecksController } from './background-checks.controller';
import { BackgroundChecksService } from './background-checks.service';
import { BackgroundChecksRepository } from './background-checks.repository';

@Module({
  controllers: [BackgroundChecksController],
  providers: [BackgroundChecksService, BackgroundChecksRepository],
  exports: [BackgroundChecksService, BackgroundChecksRepository],
})
export class BackgroundChecksModule {}
