import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { IntegrityRepository, IntegrityFilters } from './integrity.repository';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class IntegrityService {
  private readonly logger = new Logger(IntegrityService.name);

  constructor(
    private readonly repository: IntegrityRepository,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Submit an anonymous integrity report.
   * The officer is authenticated but their ID is NOT stored in the report.
   * Returns the anonymousToken for future status checks.
   */
  async createReport(data: {
    category: string;
    description: string;
    evidenceLog?: string;
  }) {
    const report = await this.repository.create(data);

    // Audit the submission without linking to the reporting officer
    await this.auditService.createAuditLog({
      entityType: 'integrity_report',
      entityId: report.id,
      action: 'anonymous_submission',
      details: { category: data.category },
    });

    return {
      anonymousToken: report.anonymousToken,
      message: 'Report submitted anonymously. Use the token to check status.',
    };
  }

  /**
   * Create a system-generated integrity report from anomaly detection.
   */
  async createSystemReport(data: {
    category: string;
    description: string;
    evidenceLog?: string;
  }) {
    return this.repository.create({
      ...data,
      isSystemGenerated: true,
    });
  }

  /**
   * Check report status by anonymous token (minimal info returned).
   */
  async findByToken(token: string) {
    const report = await this.repository.findByToken(token);
    if (!report) {
      throw new NotFoundException('Report not found for the provided token');
    }
    return report;
  }

  async findAll(filters: IntegrityFilters) {
    return this.repository.findAll(filters);
  }

  async findById(id: string) {
    const report = await this.repository.findById(id);
    if (!report) {
      throw new NotFoundException(`Integrity report not found: ${id}`);
    }
    return report;
  }

  async update(
    id: string,
    data: { status?: string; assignedToId?: string; resolution?: string },
    officerId: string,
  ) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Integrity report not found: ${id}`);
    }

    const report = await this.repository.update(id, data);

    await this.auditService.createAuditLog({
      entityType: 'integrity_report',
      entityId: id,
      officerId,
      action: 'update_integrity_report',
      details: {
        changes: Object.keys(data),
        newStatus: data.status,
      },
    });

    return report;
  }
}
