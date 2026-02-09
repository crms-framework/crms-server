import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class UssdRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    officerId: string;
    phoneNumber: string;
    queryType: string;
    searchTerm: string;
    resultSummary?: string;
    success: boolean;
    errorMessage?: string;
    sessionId?: string;
  }) {
    return this.prisma.uSSDQueryLog.create({ data });
  }

  async findByOfficer(officerId: string, skip = 0, take = 20) {
    return this.prisma.uSSDQueryLog.findMany({
      where: { officerId },
      skip,
      take,
      orderBy: { timestamp: 'desc' },
    });
  }

  async countByOfficer(officerId: string): Promise<number> {
    return this.prisma.uSSDQueryLog.count({ where: { officerId } });
  }

  async getDailyCount(officerId: string, date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.uSSDQueryLog.count({
      where: {
        officerId,
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });
  }

  async findAll(skip = 0, take = 20) {
    return this.prisma.uSSDQueryLog.findMany({
      skip,
      take,
      orderBy: { timestamp: 'desc' },
      include: {
        officer: {
          select: { id: true, badge: true, name: true },
        },
      },
    });
  }

  async countAll(): Promise<number> {
    return this.prisma.uSSDQueryLog.count();
  }
}
