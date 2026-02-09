import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

export interface CaseFilters {
  status?: string;
  category?: string;
  severity?: string;
  stationId?: string;
  officerId?: string;
  search?: string;
}

@Injectable()
export class CasesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    filters: CaseFilters,
    skip: number,
    take: number,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    const where = this.buildWhere(filters);

    return this.prisma.case.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      include: {
        station: { select: { id: true, name: true, code: true } },
        officer: { select: { id: true, badge: true, name: true } },
        persons: {
          include: {
            person: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                nationalId: true,
              },
            },
          },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.case.findUnique({
      where: { id },
      include: {
        station: { select: { id: true, name: true, code: true } },
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
                dob: true,
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

  async findByCaseNumber(caseNumber: string) {
    return this.prisma.case.findUnique({
      where: { caseNumber },
      include: {
        station: { select: { id: true, name: true, code: true } },
        officer: { select: { id: true, badge: true, name: true } },
        persons: {
          include: {
            person: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                nationalId: true,
              },
            },
          },
        },
      },
    });
  }

  async create(data: {
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
    officerId: string;
  }) {
    const caseNumber = await this.generateCaseNumber(data.stationId);

    return this.prisma.case.create({
      data: {
        ...data,
        caseNumber,
        status: 'open',
      },
      include: {
        station: { select: { id: true, name: true, code: true } },
        officer: { select: { id: true, badge: true, name: true } },
      },
    });
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
  ) {
    return this.prisma.case.update({
      where: { id },
      data,
      include: {
        station: { select: { id: true, name: true, code: true } },
        officer: { select: { id: true, badge: true, name: true } },
      },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.case.update({
      where: { id },
      data: { status },
    });
  }

  async addPerson(
    caseId: string,
    personId: string,
    role: string,
    statement?: string,
  ) {
    return this.prisma.casePerson.create({
      data: { caseId, personId, role, statement },
      include: {
        person: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            nationalId: true,
          },
        },
      },
    });
  }

  async removePerson(caseId: string, personId: string, role: string) {
    return this.prisma.casePerson.delete({
      where: {
        caseId_personId_role: { caseId, personId, role },
      },
    });
  }

  async addNote(caseId: string, officerId: string, content: string) {
    return this.prisma.caseNote.create({
      data: { caseId, officerId, content },
      include: {
        officer: { select: { id: true, badge: true, name: true } },
      },
    });
  }

  async count(filters: CaseFilters) {
    const where = this.buildWhere(filters);
    return this.prisma.case.count({ where });
  }

  private buildWhere(filters: CaseFilters) {
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;
    if (filters.severity) where.severity = filters.severity;
    if (filters.stationId) where.stationId = filters.stationId;
    if (filters.officerId) where.officerId = filters.officerId;

    if (filters.search) {
      where.OR = [
        { caseNumber: { contains: filters.search, mode: 'insensitive' } },
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private async generateCaseNumber(stationId: string): Promise<string> {
    const station = await this.prisma.station.findUnique({
      where: { id: stationId },
      select: { code: true },
    });

    if (!station) {
      throw new Error(`Station not found: ${stationId}`);
    }

    const year = new Date().getFullYear();
    const prefix = `${station.code}-${year}-`;

    // Find the latest case number for this station and year
    const latestCase = await this.prisma.case.findFirst({
      where: { caseNumber: { startsWith: prefix } },
      orderBy: { caseNumber: 'desc' },
      select: { caseNumber: true },
    });

    let nextSeq = 1;
    if (latestCase) {
      const parts = latestCase.caseNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      nextSeq = lastSeq + 1;
    }

    return `${prefix}${nextSeq.toString().padStart(6, '0')}`;
  }
}
