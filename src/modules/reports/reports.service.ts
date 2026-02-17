import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ReportsRepository } from './reports.repository';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getCaseReport(caseId: string, officerId: string) {
    const report = await this.reportsRepository.getCaseReport(caseId);
    if (!report) {
      throw new NotFoundException(`Case not found: ${caseId}`);
    }

    await this.auditService.createAuditLog({
      entityType: 'report',
      entityId: caseId,
      officerId,
      action: 'generate_case_report',
      details: { caseNumber: report.caseNumber },
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

    await this.auditService.createAuditLog({
      entityType: 'report',
      entityId: stationId,
      officerId,
      action: 'generate_station_report',
      details: { stationName: report.station.name },
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

    await this.auditService.createAuditLog({
      entityType: 'report',
      entityId: 'system',
      officerId,
      action: 'generate_compliance_report',
      details: { startDate, endDate },
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

    await this.auditService.createAuditLog({
      entityType: 'report',
      entityId: 'system',
      officerId,
      action: 'generate_custom_report',
      details: { entityType: filters.entityType },
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

    await this.auditService.createAuditLog({
      entityType: 'report',
      entityId: 'system',
      officerId,
      action: 'export_report',
      details: {
        entityType: filters.entityType,
        rowCount: data.length,
      },
    });

    return { csv: csvRows.join('\n'), count: data.length };
  }

  async generateCustodyCertificate(evidenceId: string, officerId: string): Promise<Buffer> {
    const evidence = await this.prisma.evidence.findUnique({
      where: { id: evidenceId },
      include: {
        collectedBy: { select: { id: true, badge: true, name: true } },
        station: { select: { id: true, name: true, code: true } },
        custodyEvents: {
          orderBy: { createdAt: 'asc' },
          include: {
            officer: { select: { id: true, badge: true, name: true } },
          },
        },
      },
    });

    if (!evidence) {
      throw new NotFoundException(`Evidence not found: ${evidenceId}`);
    }

    const officer = await this.prisma.officer.findUnique({
      where: { id: officerId },
      select: { name: true, badge: true },
    });

    const certData = {
      evidenceId: evidence.id,
      qrCode: evidence.qrCode,
      type: evidence.type,
      description: evidence.description || '',
      status: evidence.status,
      isSealed: evidence.isSealed,
      collectedBy: evidence.collectedBy?.name || 'Unknown',
      collectedDate: evidence.collectedDate.toISOString(),
      station: evidence.station?.name || 'Unknown',
      events: evidence.custodyEvents.map((e: any) => ({
        action: e.action,
        officerName: e.officer?.name || 'Unknown',
        officerBadge: e.officer?.badge || 'N/A',
        fromLocation: e.fromLocation,
        toLocation: e.toLocation,
        signature: e.signature,
        createdAt: e.createdAt.toISOString(),
      })),
      generatedAt: new Date().toISOString(),
      generatedBy: officer ? `${officer.name} (${officer.badge})` : officerId,
    };

    const React = await import('react');
    const { renderToBuffer } = await import('@react-pdf/renderer');
    const { ChainOfCustodyCertificate } = await import(
      './templates/chain-of-custody.template.js'
    );

    const element = React.createElement(ChainOfCustodyCertificate, {
      data: certData,
    });
    const pdfBuffer = await (renderToBuffer as any)(element);

    await this.auditService.createAuditLog({
      entityType: 'evidence',
      entityId: evidenceId,
      officerId,
      action: 'generate_custody_certificate',
      details: {
        qrCode: evidence.qrCode,
        eventCount: evidence.custodyEvents.length,
      },
    });

    return Buffer.from(pdfBuffer);
  }
}
