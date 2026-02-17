import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../common/database/prisma.service';
import { IntegrityService } from './integrity.service';

@Processor('anomaly-detection')
export class AnomalyDetectionProcessor extends WorkerHost {
  private readonly logger = new Logger(AnomalyDetectionProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly integrityService: IntegrityService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log('Running anomaly detection scan...');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await Promise.all([
      this.detectExcessiveBackgroundChecks(yesterday, today),
      this.detectOffHoursAccess(yesterday, today),
      this.detectExcessiveNINQueries(yesterday, today),
    ]);

    this.logger.log('Anomaly detection scan complete');
  }

  /**
   * Detect officers performing > 20 background checks in a day
   */
  private async detectExcessiveBackgroundChecks(from: Date, to: Date) {
    const results = await this.prisma.auditLog.groupBy({
      by: ['officerId'],
      where: {
        action: { in: ['create', 'bgcheck_create'] },
        entityType: { in: ['bgcheck', 'background_check'] },
        createdAt: { gte: from, lt: to },
        officerId: { not: null },
      },
      _count: { id: true },
      having: { id: { _count: { gt: 20 } } },
    });

    for (const result of results) {
      if (!result.officerId) continue;

      const officer = await this.prisma.officer.findUnique({
        where: { id: result.officerId },
        select: { badge: true, name: true },
      });

      await this.integrityService.createSystemReport({
        category: 'EXCESSIVE_QUERIES',
        description: `Officer ${officer?.name || result.officerId} (${officer?.badge || 'N/A'}) performed ${result._count.id} background checks on ${from.toISOString().split('T')[0]}, exceeding the threshold of 20.`,
        evidenceLog: `auditLog.officerId=${result.officerId}, date=${from.toISOString().split('T')[0]}, count=${result._count.id}`,
      });

      this.logger.warn(
        `Anomaly: Officer ${result.officerId} performed ${result._count.id} background checks`,
      );
    }
  }

  /**
   * Detect off-hours access (midnight-5am) occurring > 3 days in a week
   */
  private async detectOffHoursAccess(from: Date, to: Date) {
    // Look at the past 7 days
    const weekAgo = new Date(to);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const offHoursLogs = await this.prisma.auditLog.findMany({
      where: {
        createdAt: { gte: weekAgo, lt: to },
        officerId: { not: null },
      },
      select: { officerId: true, createdAt: true },
    });

    // Group by officer, count distinct off-hours days
    const officerOffHoursDays = new Map<string, Set<string>>();
    for (const log of offHoursLogs) {
      if (!log.officerId) continue;
      const hour = log.createdAt.getHours();
      if (hour >= 0 && hour < 5) {
        const dayKey = log.createdAt.toISOString().split('T')[0];
        if (!officerOffHoursDays.has(log.officerId)) {
          officerOffHoursDays.set(log.officerId, new Set());
        }
        officerOffHoursDays.get(log.officerId)!.add(dayKey);
      }
    }

    for (const [officerId, days] of officerOffHoursDays) {
      if (days.size > 3) {
        const officer = await this.prisma.officer.findUnique({
          where: { id: officerId },
          select: { badge: true, name: true },
        });

        await this.integrityService.createSystemReport({
          category: 'UNAUTHORIZED_ACCESS',
          description: `Officer ${officer?.name || officerId} (${officer?.badge || 'N/A'}) accessed the system during off-hours (midnight-5am) on ${days.size} days in the past week, exceeding the threshold of 3.`,
          evidenceLog: `officerId=${officerId}, offHourDays=${Array.from(days).join(',')}`,
        });

        this.logger.warn(
          `Anomaly: Officer ${officerId} had off-hours access on ${days.size} days`,
        );
      }
    }
  }

  /**
   * Detect same NIN queried by > 3 different officers in a day
   */
  private async detectExcessiveNINQueries(from: Date, to: Date) {
    const bgChecks = await this.prisma.backgroundCheck.findMany({
      where: {
        createdAt: { gte: from, lt: to },
        requestedById: { not: null },
      },
      select: { nin: true, requestedById: true },
    });

    // Group by NIN, count distinct officers
    const ninOfficers = new Map<string, Set<string>>();
    for (const check of bgChecks) {
      if (!check.requestedById) continue;
      if (!ninOfficers.has(check.nin)) {
        ninOfficers.set(check.nin, new Set());
      }
      ninOfficers.get(check.nin)!.add(check.requestedById);
    }

    for (const [nin, officers] of ninOfficers) {
      if (officers.size > 3) {
        await this.integrityService.createSystemReport({
          category: 'EXCESSIVE_QUERIES',
          description: `NIN ${nin} was queried by ${officers.size} different officers on ${from.toISOString().split('T')[0]}, exceeding the threshold of 3.`,
          evidenceLog: `nin=${nin}, officerIds=${Array.from(officers).join(',')}`,
        });

        this.logger.warn(
          `Anomaly: NIN ${nin} queried by ${officers.size} officers`,
        );
      }
    }
  }
}
