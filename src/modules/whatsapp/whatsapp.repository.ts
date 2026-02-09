import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class WhatsappRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== WhatsApp Sessions ====================

  async findSession(phoneNumber: string) {
    return this.prisma.whatsAppSession.findUnique({
      where: { phoneNumber },
      include: {
        officer: {
          select: { id: true, badge: true, name: true, stationId: true },
        },
      },
    });
  }

  async createSession(data: {
    phoneNumber: string;
    officerId?: string;
    state?: string;
    expiresAt: Date;
  }) {
    return this.prisma.whatsAppSession.create({
      data: {
        phoneNumber: data.phoneNumber,
        officerId: data.officerId,
        state: data.state || 'MAIN_MENU',
        expiresAt: data.expiresAt,
      },
    });
  }

  async updateSession(
    id: string,
    data: Partial<{
      state: string;
      selectedQueryType: string | null;
      searchTerm: string | null;
      queryData: any;
      officerId: string;
      pinAttempts: number;
      expiresAt: Date;
      lastActivityAt: Date;
    }>,
  ) {
    return this.prisma.whatsAppSession.update({
      where: { id },
      data: {
        ...data,
        lastActivityAt: new Date(),
      },
    });
  }

  async deleteSession(id: string) {
    return this.prisma.whatsAppSession.delete({ where: { id } });
  }

  async deleteExpiredSessions() {
    return this.prisma.whatsAppSession.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }

  // ==================== WhatsApp Newsletters ====================

  async findAllNewsletters(skip = 0, take = 20) {
    return this.prisma.whatsAppNewsletter.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, badge: true, name: true },
        },
      },
    });
  }

  async countNewsletters(): Promise<number> {
    return this.prisma.whatsAppNewsletter.count();
  }

  async findNewsletterById(id: string) {
    return this.prisma.whatsAppNewsletter.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, badge: true, name: true },
        },
      },
    });
  }

  async createNewsletter(data: {
    channelId: string;
    name: string;
    description?: string;
    pictureUrl?: string;
    createdById: string;
  }) {
    return this.prisma.whatsAppNewsletter.create({
      data,
      include: {
        createdBy: {
          select: { id: true, badge: true, name: true },
        },
      },
    });
  }

  async updateNewsletter(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      pictureUrl: string;
      status: string;
      subscriberCount: number;
      reactionsEnabled: boolean;
    }>,
  ) {
    return this.prisma.whatsAppNewsletter.update({
      where: { id },
      data,
      include: {
        createdBy: {
          select: { id: true, badge: true, name: true },
        },
      },
    });
  }
}
