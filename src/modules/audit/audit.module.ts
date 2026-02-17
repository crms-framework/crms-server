import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuditRepository } from './audit.repository';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditExportProcessor } from './audit-export.processor';

const redisEnabled = process.env.REDIS_ENABLED !== 'false';

@Global()
@Module({
  imports: [
    ...(redisEnabled
      ? [BullModule.registerQueue({ name: 'audit-export' })]
      : []),
  ],
  controllers: [AuditController],
  providers: [
    AuditRepository,
    AuditService,
    ...(redisEnabled ? [AuditExportProcessor] : []),
  ],
  exports: [AuditService, AuditRepository],
})
export class AuditModule {}
