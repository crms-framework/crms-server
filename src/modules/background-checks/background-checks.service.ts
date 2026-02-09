import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { BackgroundChecksRepository, BgCheckFilters } from './background-checks.repository';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { BusinessRuleException } from '../../common/errors/business-rule.exception';

@Injectable()
export class BackgroundChecksService {
  private readonly logger = new Logger(BackgroundChecksService.name);

  constructor(
    private readonly bgCheckRepository: BackgroundChecksRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(filters: BgCheckFilters, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.bgCheckRepository.findAll(filters, skip, limit),
      this.bgCheckRepository.count(filters),
    ]);
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findById(id: string) {
    const check = await this.bgCheckRepository.findById(id);
    if (!check) {
      throw new NotFoundException(`Background check not found: ${id}`);
    }
    return check;
  }

  async perform(
    data: {
      nin: string;
      requestType: string;
      phoneNumber?: string;
      ipAddress?: string;
    },
    officerId?: string,
  ) {
    const validTypes = ['officer', 'citizen', 'employer', 'visa'];
    if (!validTypes.includes(data.requestType)) {
      throw new BadRequestException(
        `Invalid request type. Must be one of: ${validTypes.join(', ')}`,
      );
    }

    if (!data.nin || data.nin.trim().length < 3) {
      throw new BadRequestException('Valid NIN is required');
    }

    // Rate limiting: non-officer requests limited to 5 per 24 hours per NIN
    if (data.requestType !== 'officer') {
      const since = new Date();
      since.setHours(since.getHours() - 24);
      const recentCount = await this.bgCheckRepository.countRecentByNin(data.nin, since);
      if (recentCount >= 5) {
        throw new BusinessRuleException(
          'Rate limit exceeded. Maximum 5 background checks per NIN per 24 hours.',
        );
      }
    }

    // Lookup criminal records
    const person = await this.prisma.person.findUnique({
      where: { nationalId: data.nin },
      include: {
        cases: {
          include: {
            case: {
              select: {
                id: true,
                caseNumber: true,
                title: true,
                category: true,
                status: true,
                severity: true,
              },
            },
          },
        },
        wantedPerson: true,
      },
    });

    let result: Record<string, any>;
    let status: string;

    if (!person) {
      result = {
        found: false,
        summary: 'No records found for this NIN',
        clearanceStatus: 'clear',
      };
      status = 'completed';
    } else if (data.requestType === 'officer') {
      // Officers get full details
      result = {
        found: true,
        person: {
          id: person.id,
          firstName: person.firstName,
          lastName: person.lastName,
          nationalId: person.nationalId,
          isWanted: person.isWanted,
          riskLevel: person.riskLevel,
        },
        cases: person.cases.map((cp) => ({
          caseNumber: cp.case.caseNumber,
          title: cp.case.title,
          category: cp.case.category,
          status: cp.case.status,
          severity: cp.case.severity,
          role: cp.role,
        })),
        wantedStatus: person.wantedPerson
          ? { active: person.wantedPerson.status === 'active', charges: person.wantedPerson.charges }
          : null,
        clearanceStatus: person.isWanted ? 'flagged' : person.cases.length > 0 ? 'record_exists' : 'clear',
      };
      status = 'completed';
    } else {
      // Citizen / employer / visa: redacted results
      const hasRecord = person.cases.length > 0 || person.isWanted;
      result = {
        found: true,
        clearanceStatus: hasRecord ? 'record_exists' : 'clear',
        summary: hasRecord
          ? 'Record exists — visit nearest police station for details'
          : 'No criminal records found',
      };
      status = 'completed';
    }

    const check = await this.bgCheckRepository.create({
      nin: data.nin,
      requestedById: officerId || undefined,
      requestType: data.requestType,
      result,
      status,
      phoneNumber: data.phoneNumber,
      ipAddress: data.ipAddress,
    });

    await this.logAudit(officerId || 'system', 'perform_background_check', check.id, {
      nin: data.nin,
      requestType: data.requestType,
      clearanceStatus: result.clearanceStatus,
    });

    return check;
  }

  async getResult(id: string) {
    const check = await this.bgCheckRepository.findById(id);
    if (!check) {
      throw new NotFoundException(`Background check not found: ${id}`);
    }
    return check.result;
  }

  async getHistory(nin: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.bgCheckRepository.findByNin(nin, skip, limit),
      this.bgCheckRepository.countByNin(nin),
    ]);
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async issueCertificate(id: string, officerId: string) {
    const check = await this.bgCheckRepository.findById(id);
    if (!check) {
      throw new NotFoundException(`Background check not found: ${id}`);
    }

    if (check.status !== 'completed') {
      throw new BusinessRuleException('Can only issue certificate for completed checks');
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 6);

    const updated = await this.bgCheckRepository.update(id, {
      issuedAt: new Date(),
      expiresAt,
      certificateUrl: `certificates/${id}.pdf`,
    });

    await this.logAudit(officerId, 'issue_certificate', id, {
      nin: check.nin,
      expiresAt,
    });

    return updated;
  }

  async delete(id: string, officerId: string) {
    const check = await this.bgCheckRepository.findById(id);
    if (!check) {
      throw new NotFoundException(`Background check not found: ${id}`);
    }

    await this.bgCheckRepository.delete(id);

    await this.logAudit(officerId, 'delete_background_check', id, {
      nin: check.nin,
    });

    return { deleted: true };
  }

  async getStats() {
    const [total, byType, byStatus] = await Promise.all([
      this.prisma.backgroundCheck.count(),
      this.prisma.backgroundCheck.groupBy({
        by: ['requestType'],
        _count: { id: true },
      }),
      this.prisma.backgroundCheck.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    return {
      total,
      byType: byType.map((r) => ({ type: r.requestType, count: r._count.id })),
      byStatus: byStatus.map((r) => ({ status: r.status, count: r._count.id })),
    };
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
          entityType: 'background_check',
          entityId,
          officerId: officerId === 'system' ? undefined : officerId,
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
