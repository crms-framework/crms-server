import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { randomBytes } from 'crypto';

export interface IntegrityFilters {
  status?: string;
  category?: string;
}

@Injectable()
export class IntegrityRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly defaultInclude = {
    assignedTo: { select: { id: true, badge: true, name: true } },
  };

  async create(data: {
    category: string;
    description: string;
    evidenceLog?: string;
    isSystemGenerated?: boolean;
  }) {
    const anonymousToken = randomBytes(24).toString('hex');

    return this.prisma.integrityReport.create({
      data: {
        anonymousToken,
        category: data.category,
        description: data.description,
        evidenceLog: data.evidenceLog,
        isSystemGenerated: data.isSystemGenerated ?? false,
      },
    });
  }

  async findAll(filters: IntegrityFilters) {
    const where: Record<string, any> = {};
    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;

    return this.prisma.integrityReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: this.defaultInclude,
    });
  }

  async findById(id: string) {
    return this.prisma.integrityReport.findUnique({
      where: { id },
      include: this.defaultInclude,
    });
  }

  async findByToken(token: string) {
    return this.prisma.integrityReport.findUnique({
      where: { anonymousToken: token },
      select: {
        id: true,
        status: true,
        category: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(
    id: string,
    data: {
      status?: string;
      assignedToId?: string;
      resolution?: string;
    },
  ) {
    return this.prisma.integrityReport.update({
      where: { id },
      data,
      include: this.defaultInclude,
    });
  }
}
