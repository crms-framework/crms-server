import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { AlertsRepository } from './alerts.repository';
import { PosterService } from './poster/poster.service';

@Module({
  controllers: [AlertsController],
  providers: [AlertsService, AlertsRepository, PosterService],
  exports: [AlertsService, AlertsRepository],
})
export class AlertsModule {}
