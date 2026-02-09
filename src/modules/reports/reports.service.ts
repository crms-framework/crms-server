import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { ReportsRepository } from './reports.repository';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getCaseReport(caseId: string, officerId: string) {
    const report = await this.reportsRepository.getCaseReport(caseId);
    if (!report) {
      throw new NotFoundException(`Case not found: ${caseId}`);
    }

    await this.logAudit(officerId, 'generate_case_report', caseId, {
      caseNumber: report.caseNumber,
    });

    return {
      reportType: 'case',
      generatedAt: new Date().toISOString(),
      data: report,
    };
  }

  async getStationReport(
    stationId: string,
    officerId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const report = await this.reportsRepository.getStationReport(
      stationId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    if (!report.station) {
      throw new NotFoundException(`Station not found: ${stationId}`);
    }

    await this.logAudit(officerId, 'generate_station_report', stationId, {
      stationName: report.station.name,
    });

    return {
      reportType: 'station',
      generatedAt: new Date().toISOString(),
      data: report,
    };
  }

  async getComplianceReport(
    officerId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const report = await this.reportsRepository.getComplianceReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    await this.logAudit(officerId, 'generate_compliance_report', 'system', {
      startDate,
      endDate,
    });

    return {
      reportType: 'compliance',
      generatedAt: new Date().toISOString(),
      data: report,
    };
  }

  async getCustomReport(
    filters: {
      entityType?: string;
      stationId?: string;
      startDate?: string;
      endDate?: string;
    },
    officerId: string,
  ) {
    const report = await this.reportsRepository.getCustomReport({
      entityType: filters.entityType,
      stationId: filters.stationId,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    });

    await this.logAudit(officerId, 'generate_custom_report', 'system', {
      entityType: filters.entityType,
    });

    return {
      reportType: 'custom',
      generatedAt: new Date().toISOString(),
      data: report,
    };
  }

  async exportReport(
    filters: {
      entityType?: string;
      stationId?: string;
      startDate?: string;
      endDate?: string;
    },
    officerId: string,
  ) {
    const report = await this.getCustomReport(filters, officerId);

    // Generate CSV
    const data = report.data.data as any[];
    if (!data || data.length === 0) {
      return { csv: '', count: 0 };
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            if (val === null || val === undefined) return '';
            const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
            return `"${str.replace(/"/g, '""')}"`;
          })
          .join(','),
      ),
    ];

    await this.logAudit(officerId, 'export_report', 'system', {
      entityType: filters.entityType,
      rowCount: data.length,
    });

    return { csv: csvRows.join('\n'), count: data.length };
  }

  private async logAudit(
    officerId: string,
    action: string,
    entityId: string,
    details: Record<string, any>,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          entityType: 'report',
          entityId,
          officerId,
          action,
          success: true,
          details,
        },
      });
    } catch (err) {
      this.logger.error('Audit log write failed', err);
    }
  }
}
