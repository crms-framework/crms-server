import { Injectable, Optional, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../common/database/prisma.service';

export interface NotificationPayload {
  type: 'approval_request' | 'approval_resolved' | 'integrity_report' | 'anomaly_detected';
  subject: string;
  body: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() @InjectQueue('notifications') private readonly notificationsQueue?: Queue,
  ) {}

  async queueNotification(payload: NotificationPayload) {
    if (!this.notificationsQueue) {
      this.logger.debug(
        `Notifications queue unavailable (Redis disabled). Would have sent: ${payload.type} - ${payload.subject}`,
      );
      return;
    }

    // Read oversight contacts from FrameworkConfig
    let contactEmail: string | null = null;
    let contactPhone: string | null = null;

    try {
      const emailConfig = await this.prisma.frameworkConfig.findUnique({
        where: { key: 'oversight.contactEmail' },
      });
      if (emailConfig?.value) {
        contactEmail = typeof emailConfig.value === 'string'
          ? emailConfig.value
          : JSON.stringify(emailConfig.value);
      }

      const phoneConfig = await this.prisma.frameworkConfig.findUnique({
        where: { key: 'oversight.contactPhone' },
      });
      if (phoneConfig?.value) {
        contactPhone = typeof phoneConfig.value === 'string'
          ? phoneConfig.value
          : JSON.stringify(phoneConfig.value);
      }
    } catch {
      this.logger.warn('Failed to read oversight contact config');
    }

    await this.notificationsQueue.add('send-notification', {
      ...payload,
      contactEmail,
      contactPhone,
      queuedAt: new Date().toISOString(),
    });

    this.logger.log(`Queued notification: ${payload.type} - ${payload.subject}`);
  }
}
