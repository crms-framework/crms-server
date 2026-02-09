import { Injectable, Logger } from '@nestjs/common';
import { AnalyticsRepository } from './analytics.repository';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  async getOverview(stationId?: string) {
    const [cases, officers, evidence, alerts] = await Promise.all([
      this.analyticsRepository.getCaseStats(stationId),
      this.analyticsRepository.getOfficerStats(stationId),
      this.analyticsRepository.getEvidenceStats(stationId),
      this.analyticsRepository.getAlertStats(),
    ]);

    return { cases, officers, evidence, alerts };
  }

  async getCaseStats(stationId?: string) {
    return this.analyticsRepository.getCaseStats(stationId);
  }

  async getOfficerStats(stationId?: string) {
    return this.analyticsRepository.getOfficerStats(stationId);
  }

  async getEvidenceStats(stationId?: string) {
    return this.analyticsRepository.getEvidenceStats(stationId);
  }

  async getAlertStats() {
    return this.analyticsRepository.getAlertStats();
  }

  async getTrends(months = 12, stationId?: string) {
    return this.analyticsRepository.getCaseTrends(months, stationId);
  }

  async getRecentActivity(limit = 50) {
    return this.analyticsRepository.getRecentActivity(limit);
  }
}
