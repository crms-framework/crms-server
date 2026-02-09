import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

export interface AlertFilters {
  status?: string;
  search?: string;
}

@Injectable()
export class AlertsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== Amber Alerts ====================

  async findAllAmberAlerts(filters: AlertFilters = {}, skip = 0, take = 20) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { personName: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.amberAlert.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, badge: true, name: true } },
      },
    });
  }

  async countAmberAlerts(filters: AlertFilters = {}) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { personName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.amberAlert.count({ where });
  }

  async findAmberAlertById(id: string) {
    return this.prisma.amberAlert.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, badge: true, name: true } },
      },
    });
  }

  async createAmberAlert(data: {
    personName: string;
    age?: number;
    gender?: string;
    description: string;
    lastSeenLocation?: string;
    lastSeenDate?: Date;
    contactPhone: string;
    photoUrl?: string;
    createdById: string;
  }) {
    return this.prisma.amberAlert.create({
      data: {
        ...data,
        status: 'active',
      },
      include: {
        createdBy: { select: { id: true, badge: true, name: true } },
      },
    });
  }

  async updateAmberAlert(id: string, data: Record<string, any>) {
    return this.prisma.amberAlert.update({
      where: { id },
      data,
      include: {
        createdBy: { select: { id: true, badge: true, name: true } },
      },
    });
  }

  // ==================== Wanted Persons ====================

  async findAllWantedPersons(filters: AlertFilters = {}, skip = 0, take = 20) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { warrantNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.wantedPerson.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        person: { select: { id: true, firstName: true, lastName: true, nationalId: true } },
        createdBy: { select: { id: true, badge: true, name: true } },
      },
    });
  }

  async countWantedPersons(filters: AlertFilters = {}) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.wantedPerson.count({ where });
  }

  async findWantedPersonById(id: string) {
    return this.prisma.wantedPerson.findUnique({
      where: { id },
      include: {
        person: { select: { id: true, firstName: true, lastName: true, nationalId: true } },
        createdBy: { select: { id: true, badge: true, name: true } },
      },
    });
  }

  async findWantedPersonByWarrantNumber(warrantNumber: string) {
    return this.prisma.wantedPerson.findUnique({
      where: { warrantNumber },
    });
  }

  async createWantedPerson(data: {
    personId?: string;
    name: string;
    aliases?: string[];
    charges: string[];
    description?: string;
    reward?: number;
    dangerLevel?: string;
    warrantNumber?: string;
    lastSeenLocation?: string;
    lastSeenDate?: Date;
    photoUrl?: string;
    createdById: string;
  }) {
    return this.prisma.wantedPerson.create({
      data: {
        ...data,
        reward: data.reward ? data.reward : undefined,
        status: 'active',
      },
      include: {
        person: { select: { id: true, firstName: true, lastName: true, nationalId: true } },
        createdBy: { select: { id: true, badge: true, name: true } },
      },
    });
  }

  async updateWantedPerson(id: string, data: Record<string, any>) {
    return this.prisma.wantedPerson.update({
      where: { id },
      data,
      include: {
        person: { select: { id: true, firstName: true, lastName: true, nationalId: true } },
        createdBy: { select: { id: true, badge: true, name: true } },
      },
    });
  }
}
