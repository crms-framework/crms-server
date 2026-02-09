import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { randomBytes } from 'crypto';

export interface EvidenceFilters {
  caseId?: string;
  type?: string;
  status?: string;
  stationId?: string;
  isSealed?: boolean;
  search?: string;
}

@Injectable()
export class EvidenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(filters: EvidenceFilters) {
    const where: any = {};
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.stationId) where.stationId = filters.stationId;
    if (filters.isSealed !== undefined) where.isSealed = filters.isSealed;
    if (filters.caseId) {
      where.cases = { some: { caseId: filters.caseId } };
    }
    if (filters.search) {
      where.OR = [
        { description: { contains: filters.search, mode: 'insensitive' } },
        { qrCode: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  private readonly defaultInclude = {
    collectedBy: { select: { id: true, badge: true, name: true } },
    station: { select: { id: true, name: true, code: true } },
    cases: {
      include: {
        case: { select: { id: true, caseNumber: true, title: true, status: true } },
      },
    },
  };

  async findAll(
    filters: EvidenceFilters,
    skip: number,
    take: number,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    const where = this.buildWhere(filters);
    return this.prisma.evidence.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      include: this.defaultInclude,
    });
  }

  async findById(id: string) {
    return this.prisma.evidence.findUnique({
      where: { id },
      include: this.defaultInclude,
    });
  }

  async findByQrCode(qrCode: string) {
    return this.prisma.evidence.findUnique({
      where: { qrCode },
      include: this.defaultInclude,
    });
  }

  async create(data: {
    type: string;
    description: string;
    location?: string;
    collectedById: string;
    collectedDate: Date;
    stationId: string;
    qrCode?: string;
    fileUrl?: string;
    fileKey?: string;
    fileHash?: string;
    fileSize?: number;
    fileMimeType?: string;
  }) {
    const qrCode = data.qrCode || `EV-${randomBytes(8).toString('hex').toUpperCase()}`;

    return this.prisma.evidence.create({
      data: {
        type: data.type,
        description: data.description,
        qrCode,
        collectedDate: data.collectedDate,
        collectedById: data.collectedById,
        collectedLocation: data.location,
        stationId: data.stationId,
        storageUrl: data.fileUrl,
        fileKey: data.fileKey,
        fileHash: data.fileHash,
        fileSize: data.fileSize,
        mimeType: data.fileMimeType,
        status: 'collected',
        chainOfCustody: [
          {
            officerId: data.collectedById,
            action: 'collected',
            timestamp: new Date().toISOString(),
            location: data.location || null,
          },
        ],
      },
      include: this.defaultInclude,
    });
  }

  async update(
    id: string,
    data: Partial<{
      type: string;
      description: string;
      collectedLocation: string;
      storageLocation: string;
      tags: string[];
      notes: string;
      storageUrl: string;
      fileKey: string;
      fileHash: string;
      fileSize: number;
      mimeType: string;
    }>,
  ) {
    return this.prisma.evidence.update({
      where: { id },
      data,
      include: this.defaultInclude,
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.evidence.update({
      where: { id },
      data: { status },
      include: this.defaultInclude,
    });
  }

  async addCustodyEvent(id: string, event: Record<string, any>) {
    const evidence = await this.prisma.evidence.findUnique({
      where: { id },
      select: { chainOfCustody: true },
    });

    const chain = (evidence?.chainOfCustody as any[]) || [];
    chain.push({
      ...event,
      timestamp: new Date().toISOString(),
    });

    return this.prisma.evidence.update({
      where: { id },
      data: { chainOfCustody: chain },
      include: this.defaultInclude,
    });
  }

  async seal(id: string, officerId: string) {
    return this.prisma.evidence.update({
      where: { id },
      data: {
        isSealed: true,
        sealedAt: new Date(),
        sealedBy: officerId,
      },
      include: this.defaultInclude,
    });
  }

  async linkToCase(evidenceId: string, caseId: string, addedById: string, notes?: string) {
    return this.prisma.caseEvidence.create({
      data: {
        evidenceId,
        caseId,
        addedById,
        notes,
      },
      include: {
        evidence: true,
        case: { select: { id: true, caseNumber: true, title: true } },
      },
    });
  }

  async findByCase(caseId: string) {
    return this.prisma.caseEvidence.findMany({
      where: { caseId },
      include: {
        evidence: {
          include: {
            collectedBy: { select: { id: true, badge: true, name: true } },
            station: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });
  }

  async count(filters: EvidenceFilters) {
    const where = this.buildWhere(filters);
    return this.prisma.evidence.count({ where });
  }

  async delete(id: string) {
    return this.prisma.evidence.delete({ where: { id } });
  }
}
