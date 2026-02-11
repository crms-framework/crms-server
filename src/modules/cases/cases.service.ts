import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CasesRepository, CaseFilters } from './cases.repository';
import { PaginationQueryDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { BusinessRuleException } from '../../common/errors/business-rule.exception';

/**
 * Valid status transitions for case lifecycle.
 * open -> investigating -> charged -> court -> closed
 * Any state (except closed) can transition directly to closed.
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  open: ['investigating', 'closed'],
  investigating: ['charged', 'closed'],
  charged: ['court', 'closed'],
  court: ['closed'],
  closed: [],
};

@Injectable()
export class CasesService {
  private readonly logger = new Logger(CasesService.name);

  constructor(
    private readonly casesRepository: CasesRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(filters: CaseFilters, pagination: PaginationQueryDto) {
    const [data, total] = await Promise.all([
      this.casesRepository.findAll(
        filters,
        pagination.skip,
        pagination.take,
        pagination.sortBy || 'createdAt',
        pagination.sortOrder || 'desc',
      ),
      this.casesRepository.count(filters),
    ]);

    return new PaginatedResponseDto(
      data.map((item) => this.mapCaseResponse(item)),
      total,
      pagination.page || 1,
      pagination.limit || 20,
    );
  }

  async findById(id: string, officerId: string) {
    const caseRecord = await this.casesRepository.findById(id);
    if (!caseRecord) {
      throw new NotFoundException(`Case not found: ${id}`);
    }

    await this.logAudit(officerId, 'read', id, { caseNumber: caseRecord.caseNumber });

    return this.mapCaseResponse(caseRecord);
  }

  async create(
    data: {
      title: string;
      description?: string;
      category: string;
      severity: string;
      incidentDate: Date;
      location?: string;
      latitude?: number;
      longitude?: number;
      ward?: string;
      district?: string;
      stationId: string;
    },
    officerId: string,
  ) {
    const validSeverities = ['minor', 'major', 'critical'];
    if (!validSeverities.includes(data.severity)) {
      throw new BadRequestException(
        `Invalid severity. Must be one of: ${validSeverities.join(', ')}`,
      );
    }

    const caseRecord = await this.casesRepository.create({
      ...data,
      officerId,
    });

    await this.logAudit(officerId, 'create', caseRecord.id, {
      caseNumber: caseRecord.caseNumber,
      category: data.category,
      severity: data.severity,
    });

    return caseRecord;
  }

  async update(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      category: string;
      severity: string;
      incidentDate: Date;
      location: string;
      latitude: number;
      longitude: number;
      ward: string;
      district: string;
    }>,
    officerId: string,
  ) {
    const existing = await this.casesRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Case not found: ${id}`);
    }

    if (existing.status === 'closed') {
      throw new BusinessRuleException('Cannot update a closed case');
    }

    if (data.severity) {
      const validSeverities = ['minor', 'major', 'critical'];
      if (!validSeverities.includes(data.severity)) {
        throw new BadRequestException(
          `Invalid severity. Must be one of: ${validSeverities.join(', ')}`,
        );
      }
    }

    const updated = await this.casesRepository.update(id, data);

    await this.logAudit(officerId, 'update', id, {
      caseNumber: existing.caseNumber,
      changes: Object.keys(data),
    });

    return updated;
  }

  async updateStatus(id: string, newStatus: string, officerId: string) {
    const existing = await this.casesRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Case not found: ${id}`);
    }

    const currentStatus = existing.status;
    const allowed = VALID_TRANSITIONS[currentStatus];

    if (!allowed) {
      throw new BusinessRuleException(
        `Unknown current status: ${currentStatus}`,
      );
    }

    if (!allowed.includes(newStatus)) {
      throw new BusinessRuleException(
        `Cannot transition case from "${currentStatus}" to "${newStatus}". Allowed transitions: ${allowed.join(', ') || 'none'}`,
      );
    }

    const updated = await this.casesRepository.updateStatus(id, newStatus);

    await this.logAudit(officerId, 'status_change', id, {
      caseNumber: existing.caseNumber,
      fromStatus: currentStatus,
      toStatus: newStatus,
    });

    return updated;
  }

  async addPerson(
    caseId: string,
    personId: string,
    role: string,
    officerId: string,
    statement?: string,
  ) {
    const existing = await this.casesRepository.findById(caseId);
    if (!existing) {
      throw new NotFoundException(`Case not found: ${caseId}`);
    }

    const validRoles = ['suspect', 'victim', 'witness', 'informant'];
    if (!validRoles.includes(role)) {
      throw new BadRequestException(
        `Invalid person role. Must be one of: ${validRoles.join(', ')}`,
      );
    }

    const result = await this.casesRepository.addPerson(
      caseId,
      personId,
      role,
      statement,
    );

    await this.logAudit(officerId, 'add_person', caseId, {
      caseNumber: existing.caseNumber,
      personId,
      role,
    });

    return result;
  }

  async removePerson(
    caseId: string,
    personId: string,
    role: string,
    officerId: string,
  ) {
    const existing = await this.casesRepository.findById(caseId);
    if (!existing) {
      throw new NotFoundException(`Case not found: ${caseId}`);
    }

    const result = await this.casesRepository.removePerson(
      caseId,
      personId,
      role,
    );

    await this.logAudit(officerId, 'remove_person', caseId, {
      caseNumber: existing.caseNumber,
      personId,
      role,
    });

    return result;
  }

  async addNote(
    caseId: string,
    officerId: string,
    content: string,
  ) {
    const existing = await this.casesRepository.findById(caseId);
    if (!existing) {
      throw new NotFoundException(`Case not found: ${caseId}`);
    }

    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Note content cannot be empty');
    }

    const note = await this.casesRepository.addNote(caseId, officerId, content);

    await this.logAudit(officerId, 'add_note', caseId, {
      caseNumber: existing.caseNumber,
      noteId: note.id,
    });

    return note;
  }

  private mapCaseResponse(caseRecord: any) {
    const { reportedDate, incidentDate, officer, officerId, notes, evidence, ...rest } = caseRecord;
    const mapped: any = {
      ...rest,
      reportedAt: reportedDate,
      occurredAt: incidentDate,
      assignedTo: officer,
      assignedToId: officerId,
    };
    if (notes) {
      mapped.notes = notes.map((note: any) => {
        const { officer: noteOfficer, ...noteRest } = note;
        return { ...noteRest, createdBy: noteOfficer };
      });
    }
    if (evidence) {
      mapped.evidenceItems = evidence.map((e: any) => {
        const { collectedDate, ...evRest } = e.evidence;
        return { ...evRest, collectedAt: collectedDate };
      });
    }
    return mapped;
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
          entityType: 'case',
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
