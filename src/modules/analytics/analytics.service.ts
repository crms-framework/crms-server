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

  async getDashboardStats(stationId?: string) {
    // Execute ALL queries in parallel (not just 4, but all 6)
    const [
      caseStats,
      personStats,
      evidenceStats,
      recentActivity,
      staleCases,
      digitalEvidenceCount,
    ] = await Promise.all([
      this.analyticsRepository.getCaseStats(stationId),
      this.analyticsRepository.getPersonStats(stationId),
      this.analyticsRepository.getEvidenceStats(stationId),
      this.analyticsRepository.getRecentActivity(10),
      this.analyticsRepository.getStaleCases(stationId),
      this.analyticsRepository.getDigitalEvidenceCount(stationId),
    ]);

    // Transform to match dashboard component expectations
    return {
      overview: {
        totalCases: caseStats.totalCases,
        totalPersons: personStats.total,
        totalEvidence: evidenceStats.totalEvidence,
        staleCases, // No longer awaited here
      },
      cases: {
        byStatus: caseStats.byStatus.reduce(
          (acc, { status, count }) => {
            acc[status] = count;
            return acc;
          },
          {} as Record<string, number>,
        ),
        bySeverity: caseStats.bySeverity.reduce(
          (acc, { severity, count }) => {
            acc[severity] = count;
            return acc;
          },
          {} as Record<string, number>,
        ),
        recent: [],
      },
      persons: {
        total: personStats.total,
        wanted: personStats.wanted,
        highRisk: personStats.highRisk,
        withBiometrics: personStats.withBiometrics,
      },
      evidence: {
        total: evidenceStats.totalEvidence,
        byStatus: evidenceStats.byStatus.reduce(
          (acc, { status, count }) => {
            acc[status] = count;
            return acc;
          },
          {} as Record<string, number>,
        ),
        sealed: 0, // TODO: Add sealed count to repository
        digital: digitalEvidenceCount, // Use pre-fetched value
        inCourt: 0, // TODO: Add inCourt count to repository
      },
      activity: {
        recentActions: recentActivity.map((log) => ({
          id: log.id,
          entityType: log.entityType,
          action: log.action,
          officerName: log.officerName,
          officerBadge: log.officerBadge,
          timestamp: log.timestamp,
        })),
      },
    };
  }
}
