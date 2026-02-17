import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  async process(job: Job): Promise<void> {
    const { type, subject, body, contactEmail, contactPhone } = job.data;

    this.logger.log(
      `Processing notification: type=${type}, subject="${subject}"`,
    );

    // Placeholder: In production, integrate with email/SMS providers
    if (contactEmail) {
      this.logger.log(`[EMAIL] To: ${contactEmail} | Subject: ${subject} | Body: ${body}`);
    }

    if (contactPhone) {
      this.logger.log(`[SMS] To: ${contactPhone} | Message: ${subject}`);
    }

    if (!contactEmail && !contactPhone) {
      this.logger.warn('No oversight contacts configured. Notification logged only.');
    }
  }
}
