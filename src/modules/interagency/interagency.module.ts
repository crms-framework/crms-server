import { Module } from '@nestjs/common';
import { InteragencyAdminController } from './controllers/interagency-admin.controller';
import { AgencyAdminController } from './controllers/agency-admin.controller';
import { InteragencyController } from './controllers/interagency.controller';
import { AgencyService } from './services/agency.service';
import { InteragencyService } from './services/interagency.service';
import { WebhookService } from './services/webhook.service';
import { AgencyRepository } from './agency.repository';
import { ApiKeyAuthGuard } from './guards/api-key-auth.guard';
import { InteragencyAuditInterceptor } from './interceptors/interagency-audit.interceptor';

@Module({
  controllers: [
    InteragencyAdminController,
    AgencyAdminController,
    InteragencyController,
  ],
  providers: [
    AgencyService,
    InteragencyService,
    WebhookService,
    AgencyRepository,
    ApiKeyAuthGuard,
    InteragencyAuditInterceptor,
  ],
  exports: [AgencyService, InteragencyService, WebhookService],
})
export class InteragencyModule {}
