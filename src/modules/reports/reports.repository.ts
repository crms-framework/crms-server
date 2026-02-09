import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getCaseReport(caseId: string) {
    return this.prisma.case.findUnique({
      where: { id: caseId },
      include: {
        station: { select: { id: true, name: true, code: true, location: true } },
        officer: { select: { id: true, badge: true, name: true } },
        persons: {
          include: {
            person: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                nationalId: true,
                gender: true,
              },
            },
          },
        },
        evidence: {
          include: {
            evidence: {
              select: {
                id: true,
                type: true,
                description: true,
                qrCode: true,
                status: true,
              },
            },
          },
        },
        notes: {
          include: {
            officer: { select: { id: true, badge: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async getStationReport(stationId: string, startDate?: Date, endDate?: Date) {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;
    const caseWhere: any = { stationId };
    if (startDate || endDate) caseWhere.createdAt = dateFilter;

    const [
      station,
      totalCases,
      byStatus,
      byCategory,
      bySeverity,
      totalOfficers,
      activeOfficers,
      totalEvidence,
    ] = await Promise.all([
      this.prisma.station.findUnique({
        where: { id: stationId },
        select: { id: true, name: true, code: true, location: true, region: true, district: true },
      }),
      this.prisma.case.count({ where: caseWhere }),
      this.prisma.case.groupBy({ by: ['status'], where: caseWhere, _count: { id: true } }),
      this.prisma.case.groupBy({ by: ['category'], where: caseWhere, _count: { id: true } }),
      this.prisma.case.groupBy({ by: ['severity'], where: caseWhere, _count: { id: true } }),
      this.prisma.officer.count({ where: { stationId } }),
      this.prisma.officer.count({ where: { stationId, active: true } }),
      this.prisma.evidence.count({ where: { stationId } }),
    ]);

    return {
      station,
      period: { startDate, endDate },
      cases: {
        total: totalCases,
        byStatus: byStatus.map((r) => ({ status: r.status, count: r._count.id })),
        byCategory: byCategory.map((r) => ({ category: r.category, count: r._count.id })),
        bySeverity: bySeverity.map((r) => ({ severity: r.severity, count: r._count.id })),
      },
      officers: { total: totalOfficers, active: activeOfficers },
      evidence: { total: totalEvidence },
    };
  }

  async getComplianceReport(startDate?: Date, endDate?: Date) {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;
    const auditWhere: any = {};
    if (startDate || endDate) auditWhere.createdAt = dateFilter;

    const [
      totalAuditLogs,
      byEntityType,
      byAction,
      failedOps,
      bgChecks,
    ] = await Promise.all([
      this.prisma.auditLog.count({ where: auditWhere }),
      this.prisma.auditLog.groupBy({ by: ['entityType'], where: auditWhere, _count: { id: true } }),
      this.prisma.auditLog.groupBy({ by: ['action'], where: auditWhere, _count: { id: true } }),
      this.prisma.auditLog.count({ where: { ...auditWhere, success: false } }),
      this.prisma.backgroundCheck.count({
        where: startDate || endDate ? { createdAt: dateFilter } : {},
      }),
    ]);

    return {
      period: { startDate, endDate },
      auditLogs: {
        total: totalAuditLogs,
        failed: failedOps,
        byEntityType: byEntityType.map((r) => ({ entityType: r.entityType, count: r._count.id })),
        byAction: byAction.map((r) => ({ action: r.action, count: r._count.id })),
      },
      backgroundChecks: { total: bgChecks },
    };
  }

  async getCustomReport(filters: {
    entityType?: string;
    stationId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};
    if (filters.stationId) where.stationId = filters.stationId;

    const dateFilter: any = {};
    if (filters.startDate) dateFilter.gte = filters.startDate;
    if (filters.endDate) dateFilter.lte = filters.endDate;
    if (filters.startDate || filters.endDate) where.createdAt = dateFilter;

    if (filters.entityType === 'cases' || !filters.entityType) {
      const cases = await this.prisma.case.findMany({
        where,
        select: {
          id: true,
          caseNumber: true,
          title: true,
          category: true,
          severity: true,
          status: true,
          incidentDate: true,
          createdAt: true,
          station: { select: { name: true, code: true } },
          officer: { select: { badge: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      });
      return { entityType: 'cases', count: cases.length, data: cases };
    }

    if (filters.entityType === 'persons') {
      const personsWhere: any = {};
      if (filters.startDate || filters.endDate) personsWhere.createdAt = dateFilter;
      const persons = await this.prisma.person.findMany({
        where: personsWhere,
        select: {
          id: true,
          nationalId: true,
          firstName: true,
          lastName: true,
          gender: true,
          isWanted: true,
          riskLevel: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      });
      return { entityType: 'persons', count: persons.length, data: persons };
    }

    return { entityType: filters.entityType, count: 0, data: [] };
  }
}
