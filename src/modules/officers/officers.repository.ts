import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { hashPin } from '../../common/utils/hash.util';

export interface OfficerFilters {
  search?: string;
  stationId?: string;
  roleId?: string;
  active?: boolean;
}

@Injectable()
export class OfficersRepository {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(filters: OfficerFilters = {}) {
    const where: any = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { badge: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.stationId) {
      where.stationId = filters.stationId;
    }

    if (filters.roleId) {
      where.roleId = filters.roleId;
    }

    if (filters.active !== undefined) {
      where.active = filters.active;
    }

    return where;
  }

  async findAll(filters: OfficerFilters = {}, skip = 0, take = 20) {
    const where = this.buildWhere(filters);

    return this.prisma.officer.findMany({
      where,
      skip,
      take,
      include: {
        role: true,
        station: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.officer.findUnique({
      where: { id },
      include: {
        role: { include: { permissions: true } },
        station: true,
      },
    });
  }

  async findByBadge(badge: string) {
    return this.prisma.officer.findUnique({
      where: { badge },
      include: {
        role: true,
        station: true,
      },
    });
  }

  async create(data: {
    badge: string;
    name: string;
    nationalId?: string;
    email?: string;
    phone?: string;
    pin: string;
    roleId: string;
    stationId: string;
  }) {
    const pinHash = await hashPin(data.pin);

    return this.prisma.officer.create({
      data: {
        badge: data.badge,
        name: data.name,
        nationalId: data.nationalId,
        email: data.email,
        phone: data.phone,
        pinHash,
        roleId: data.roleId,
        stationId: data.stationId,
      },
      include: {
        role: true,
        station: true,
      },
    });
  }

  async update(id: string, data: {
    name?: string;
    nationalId?: string;
    email?: string;
    phone?: string;
    roleId?: string;
    stationId?: string;
  }) {
    return this.prisma.officer.update({
      where: { id },
      data,
      include: {
        role: true,
        station: true,
      },
    });
  }

  async deactivate(id: string) {
    return this.prisma.officer.update({
      where: { id },
      data: { active: false },
      include: {
        role: true,
        station: true,
      },
    });
  }

  async activate(id: string) {
    return this.prisma.officer.update({
      where: { id },
      data: { active: true, failedAttempts: 0, lockedUntil: null },
      include: {
        role: true,
        station: true,
      },
    });
  }

  async getPinHash(id: string): Promise<string | null> {
    const officer = await this.prisma.officer.findUnique({
      where: { id },
      select: { pinHash: true },
    });
    return officer?.pinHash ?? null;
  }

  async updatePinHash(id: string, pinHash: string) {
    return this.prisma.officer.update({
      where: { id },
      data: { pinHash, pinChangedAt: new Date() },
    });
  }

  async resetFailedAttempts(id: string) {
    return this.prisma.officer.update({
      where: { id },
      data: { failedAttempts: 0, lockedUntil: null },
    });
  }

  async incrementFailedAttempts(id: string) {
    return this.prisma.officer.update({
      where: { id },
      data: { failedAttempts: { increment: 1 } },
    });
  }

  async lockAccount(id: string, lockedUntil: Date) {
    return this.prisma.officer.update({
      where: { id },
      data: { lockedUntil },
    });
  }

  async updateLastLogin(id: string) {
    return this.prisma.officer.update({
      where: { id },
      data: { lastLogin: new Date() },
    });
  }

  async count(filters: OfficerFilters = {}): Promise<number> {
    const where = this.buildWhere(filters);
    return this.prisma.officer.count({ where });
  }
}
