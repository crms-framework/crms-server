import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get case statistics: counts by status, category, and severity.
   * Optionally scoped to a single station.
   */
  async getCaseStats(stationId?: string) {
    const where = stationId ? { stationId } : {};

    const [
      totalCases,
      byStatus,
      byCategory,
      bySeverity,
    ] = await Promise.all([
      this.prisma.case.count({ where }),
      this.prisma.case.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      this.prisma.case.groupBy({
        by: ['category'],
        where,
        _count: { id: true },
      }),
      this.prisma.case.groupBy({
        by: ['severity'],
        where,
        _count: { id: true },
      }),
    ]);

    return {
      totalCases,
      byStatus: byStatus.map((r) => ({ status: r.status, count: r._count.id })),
      byCategory: byCategory.map((r) => ({ category: r.category, count: r._count.id })),
      bySeverity: bySeverity.map((r) => ({ severity: r.severity, count: r._count.id })),
    };
  }

  /**
   * Get officer statistics: total active officers, cases per officer.
   * Optionally scoped to a single station.
   */
  async getOfficerStats(stationId?: string) {
    const officerWhere = stationId
      ? { stationId, active: true }
      : { active: true };

    const caseWhere = stationId ? { stationId } : {};

    const [activeOfficers, totalOfficers, casesPerOfficer] = await Promise.all([
      this.prisma.officer.count({ where: officerWhere }),
      this.prisma.officer.count({
        where: stationId ? { stationId } : {},
      }),
      this.prisma.case.groupBy({
        by: ['officerId'],
        where: caseWhere,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 20,
      }),
    ]);

    // Fetch officer names for the top case holders
    const officerIds = casesPerOfficer.map((r) => r.officerId);
    const officers = await this.prisma.officer.findMany({
      where: { id: { in: officerIds } },
      select: { id: true, badge: true, name: true },
    });

    const officerMap = new Map(officers.map((o) => [o.id, o]));

    return {
      activeOfficers,
      totalOfficers,
      casesPerOfficer: casesPerOfficer.map((r) => ({
        officerId: r.officerId,
        badge: officerMap.get(r.officerId)?.badge || 'Unknown',
        name: officerMap.get(r.officerId)?.name || 'Unknown',
        caseCount: r._count.id,
      })),
    };
  }

  /**
   * Get evidence statistics: counts by type and status.
   * Optionally scoped to a single station.
   */
  async getEvidenceStats(stationId?: string) {
    const where = stationId ? { stationId } : {};

    const [totalEvidence, byType, byStatus] = await Promise.all([
      this.prisma.evidence.count({ where }),
      this.prisma.evidence.groupBy({
        by: ['type'],
        where,
        _count: { id: true },
      }),
      this.prisma.evidence.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
    ]);

    return {
      totalEvidence,
      byType: byType.map((r) => ({ type: r.type, count: r._count.id })),
      byStatus: byStatus.map((r) => ({ status: r.status, count: r._count.id })),
    };
  }

  /**
   * Get alert statistics: active amber alerts and wanted persons.
   */
  async getAlertStats() {
    const [
      activeAmberAlerts,
      totalAmberAlerts,
      activeWantedPersons,
      totalWantedPersons,
    ] = await Promise.all([
      this.prisma.amberAlert.count({ where: { status: 'active' } }),
      this.prisma.amberAlert.count(),
      this.prisma.wantedPerson.count({ where: { status: 'active' } }),
      this.prisma.wantedPerson.count(),
    ]);

    return {
      amberAlerts: {
        active: activeAmberAlerts,
        total: totalAmberAlerts,
      },
      wantedPersons: {
        active: activeWantedPersons,
        total: totalWantedPersons,
      },
    };
  }

  /**
   * Get case trends over time: cases grouped by month for the given number of months.
   * Optionally scoped to a single station.
   */
  async getCaseTrends(months: number, stationId?: string) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const where: Record<string, any> = {
      createdAt: { gte: startDate },
    };

    if (stationId) {
      where.stationId = stationId;
    }

    const cases = await this.prisma.case.findMany({
      where,
      select: {
        createdAt: true,
        status: true,
        category: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by year-month
    const trends = new Map<string, { total: number; byStatus: Record<string, number>; byCategory: Record<string, number> }>();

    for (const c of cases) {
      const key = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, '0')}`;

      if (!trends.has(key)) {
        trends.set(key, { total: 0, byStatus: {}, byCategory: {} });
      }

      const entry = trends.get(key)!;
      entry.total += 1;
      entry.byStatus[c.status] = (entry.byStatus[c.status] || 0) + 1;
      entry.byCategory[c.category] = (entry.byCategory[c.category] || 0) + 1;
    }

    return Array.from(trends.entries()).map(([month, data]) => ({
      month,
      ...data,
    }));
  }

  /**
   * Get recent activity from audit logs.
   */
  async getRecentActivity(limit: number) {
    return this.prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        officer: {
          select: {
            id: true,
            badge: true,
            name: true,
          },
        },
      },
    });
  }
}
