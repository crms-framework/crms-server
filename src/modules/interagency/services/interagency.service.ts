import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { AgencyRepository } from '../agency.repository';
import { WebhookService } from './webhook.service';
import { PaginatedResponseDto } from '../../../common/dto/pagination.dto';
import type { WarrantRequestDto, FlagRequestDto, InteragencyRequestFilterDto } from '../dto/interagency-request.dto';

@Injectable()
export class InteragencyService {
  private readonly logger = new Logger(InteragencyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly agencyRepo: AgencyRepository,
    private readonly webhookService: WebhookService,
  ) {}

  // ==================== External API Methods ====================

  async getCaseStatus(caseNumber: string, agency: any) {
    this.checkAgencyPermission(agency, 'cases', 'read');

    const caseRecord = await this.prisma.case.findUnique({
      where: { caseNumber },
      include: {
        station: { select: { name: true, district: true } },
        officer: { select: { name: true, badge: true } },
        persons: {
          include: { person: { select: { firstName: true, lastName: true, nationalId: true } } },
        },
      },
    });

    if (!caseRecord) {
      throw new NotFoundException(`Case not found: ${caseNumber}`);
    }

    return this.redactForAgencyType(caseRecord, agency.type, 'case');
  }

  async lookupPerson(nationalId: string, agency: any) {
    this.checkAgencyPermission(agency, 'persons', 'read');

    const person = await this.prisma.person.findFirst({
      where: { nationalId },
      include: {
        cases: {
          include: { case: { select: { caseNumber: true, status: true, severity: true, category: true } } },
        },
      },
    });

    if (!person) {
      throw new NotFoundException(`Person not found with national ID: ${nationalId}`);
    }

    return this.redactForAgencyType(person, agency.type, 'person');
  }

  async issueWarrant(dto: WarrantRequestDto, agency: any) {
    this.checkAgencyPermission(agency, 'warrants', 'create');

    const person = await this.prisma.person.findFirst({
      where: { nationalId: dto.nationalId },
    });

    if (!person) {
      throw new NotFoundException(`Person not found with national ID: ${dto.nationalId}`);
    }

    if (dto.action === 'revoke') {
      // Revoke: find and update existing wanted person
      const existing = await this.prisma.wantedPerson.findFirst({
        where: { warrantNumber: dto.warrantNumber },
      });
      if (!existing) {
        throw new NotFoundException(`Warrant not found: ${dto.warrantNumber}`);
      }

      await this.prisma.wantedPerson.update({
        where: { id: existing.id },
        data: { status: 'revoked' },
      });

      await this.prisma.person.update({
        where: { id: person.id },
        data: { isWanted: false },
      });

      await this.webhookService.fireEvent('warrant.issued', {
        action: 'revoke',
        warrantNumber: dto.warrantNumber,
        nationalId: dto.nationalId,
      }).catch((err) => this.logger.warn('Webhook fire failed', err));

      return { status: 'revoked', warrantNumber: dto.warrantNumber };
    }

    // Issue or update
    const wantedData: any = {
      name: `${person.firstName} ${person.lastName}`,
      charges: dto.charges,
      warrantNumber: dto.warrantNumber,
      status: 'active',
      personId: person.id,
    };

    let result: any;
    const existing = await this.prisma.wantedPerson.findFirst({
      where: { warrantNumber: dto.warrantNumber },
    });

    if (existing && dto.action === 'update') {
      result = await this.prisma.wantedPerson.update({
        where: { id: existing.id },
        data: wantedData,
      });
    } else {
      // Find a system officer to attribute the creation to,
      // since createdById references Officer (not Agency)
      const systemOfficer = await this.prisma.officer.findFirst({
        where: { role: { name: 'SuperAdmin' } },
        select: { id: true },
      });
      result = await this.prisma.wantedPerson.create({
        data: {
          ...wantedData,
          createdById: systemOfficer?.id ?? agency.id,
        },
      });
    }

    await this.prisma.person.update({
      where: { id: person.id },
      data: { isWanted: true, wantedSince: new Date() },
    });

    await this.webhookService.fireEvent('warrant.issued', {
      action: dto.action,
      warrantNumber: dto.warrantNumber,
      nationalId: dto.nationalId,
      charges: dto.charges,
    }).catch((err) => this.logger.warn('Webhook fire failed', err));

    return {
      status: dto.action === 'update' ? 'updated' : 'issued',
      warrantNumber: dto.warrantNumber,
      wantedPersonId: result.id,
    };
  }

  async getInmateStatus(nationalId: string, agency: any) {
    this.checkAgencyPermission(agency, 'persons', 'read');

    const person = await this.prisma.person.findFirst({
      where: { nationalId },
      include: {
        cases: {
          include: {
            case: { select: { caseNumber: true, status: true, severity: true } },
          },
        },
      },
    });

    if (!person) {
      throw new NotFoundException(`Person not found with national ID: ${nationalId}`);
    }

    // Minimal response for prison/inmate queries
    return {
      nationalId: person.nationalId,
      name: `${person.firstName} ${person.lastName}`,
      isWanted: person.isWanted,
      activeCases: person.cases
        .filter((cp: any) => cp.case.status !== 'closed')
        .map((cp: any) => ({
          caseNumber: cp.case.caseNumber,
          status: cp.case.status,
          severity: cp.case.severity,
        })),
    };
  }

  async flagPerson(dto: FlagRequestDto, agency: any) {
    this.checkAgencyPermission(agency, 'persons', 'update');

    const person = await this.prisma.person.findFirst({
      where: { nationalId: dto.nationalId },
    });

    if (!person) {
      throw new NotFoundException(`Person not found with national ID: ${dto.nationalId}`);
    }

    // Update person risk level based on flag type
    const riskLevel = dto.flagType === 'travel_ban' ? 'high' : 'medium';
    await this.prisma.person.update({
      where: { id: person.id },
      data: { riskLevel },
    });

    await this.webhookService.fireEvent('person.flagged', {
      nationalId: dto.nationalId,
      flagType: dto.flagType,
      reason: dto.reason,
      expiresAt: dto.expiresAt,
    }).catch((err) => this.logger.warn('Webhook fire failed', err));

    return {
      status: 'flagged',
      nationalId: dto.nationalId,
      flagType: dto.flagType,
      riskLevel,
    };
  }

  // ==================== Internal Admin ====================

  async getRequestAuditLog(filters: InteragencyRequestFilterDto) {
    const skip = filters.skip;
    const take = filters.take;
    const [data, total] = await Promise.all([
      this.agencyRepo.findRequests(filters, skip, take),
      this.agencyRepo.countRequests(filters),
    ]);
    return new PaginatedResponseDto(data, total, filters.page || 1, filters.limit || 20);
  }

  // ==================== Helpers ====================

  private checkAgencyPermission(
    agency: any,
    resource: string,
    action: string,
  ) {
    const permissions = agency.permissions as Record<string, string[]>;
    if (!permissions) {
      throw new ForbiddenException('Agency has no permissions configured');
    }

    const allowedActions = permissions[resource];
    if (!allowedActions || !allowedActions.includes(action)) {
      throw new ForbiddenException(
        `Agency does not have ${action} permission on ${resource}`,
      );
    }
  }

  private redactForAgencyType(data: any, agencyType: string, entity: string) {
    switch (agencyType) {
      case 'court':
        return this.redactForCourt(data, entity);
      case 'prison':
        return this.redactForPrison(data, entity);
      case 'immigration':
        return this.redactForImmigration(data, entity);
      default:
        return this.redactDefault(data, entity);
    }
  }

  private redactForCourt(data: any, entity: string) {
    if (entity === 'case') {
      return {
        caseNumber: data.caseNumber,
        title: data.title,
        category: data.category,
        severity: data.severity,
        status: data.status,
        incidentDate: data.incidentDate,
        station: data.station,
        officer: data.officer,
        persons: data.persons?.map((cp: any) => ({
          role: cp.role,
          name: cp.person
            ? `${cp.person.firstName} ${cp.person.lastName}`
            : undefined,
        })),
      };
    }
    if (entity === 'person') {
      return {
        name: `${data.firstName} ${data.lastName}`,
        nationalId: data.nationalId,
        isWanted: data.isWanted,
        cases: data.cases?.map((cp: any) => cp.case),
      };
    }
    return data;
  }

  private redactForPrison(data: any, entity: string) {
    if (entity === 'case') {
      return {
        caseNumber: data.caseNumber,
        status: data.status,
        severity: data.severity,
      };
    }
    if (entity === 'person') {
      return {
        name: `${data.firstName} ${data.lastName}`,
        isWanted: data.isWanted,
        caseCount: data.cases?.length || 0,
      };
    }
    return data;
  }

  private redactForImmigration(data: any, entity: string) {
    if (entity === 'case') {
      return {
        caseNumber: data.caseNumber,
        status: data.status,
        severity: data.severity,
        category: data.category,
      };
    }
    if (entity === 'person') {
      return {
        name: `${data.firstName} ${data.lastName}`,
        nationalId: data.nationalId,
        isWanted: data.isWanted,
        riskLevel: data.riskLevel,
      };
    }
    return data;
  }

  private redactDefault(data: any, entity: string) {
    if (entity === 'case') {
      return {
        caseNumber: data.caseNumber,
        status: data.status,
        category: data.category,
      };
    }
    if (entity === 'person') {
      return {
        nationalId: data.nationalId,
        isWanted: data.isWanted,
      };
    }
    return data;
  }
}
