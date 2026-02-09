import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import { StationFilterDto } from './dto/station-filter.dto';

@Injectable()
export class StationsRepository {
  private readonly logger = new Logger(StationsRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.station.findUnique({
      where: { id },
      include: { _count: { select: { officers: true } } },
    });
  }

  async findByCode(code: string) {
    return this.prisma.station.findUnique({
      where: { code },
      include: { _count: { select: { officers: true } } },
    });
  }

  async findByRegion(region: string) {
    return this.prisma.station.findMany({
      where: { region },
      include: { _count: { select: { officers: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findByCountryCode(countryCode: string) {
    return this.prisma.station.findMany({
      where: { countryCode },
      include: { _count: { select: { officers: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findAll(filters?: StationFilterDto) {
    const where = this.buildWhereClause(filters);
    const orderBy = this.buildOrderBy(filters);

    return this.prisma.station.findMany({
      where,
      include: { _count: { select: { officers: true } } },
      orderBy,
      skip: filters?.skip ?? 0,
      take: filters?.take ?? 20,
    });
  }

  async count(filters?: StationFilterDto): Promise<number> {
    const where = this.buildWhereClause(filters);
    return this.prisma.station.count({ where });
  }

  async create(data: {
    name: string;
    code: string;
    location: string;
    district?: string;
    region?: string;
    countryCode?: string;
    phone?: string;
    email?: string;
    latitude?: number;
    longitude?: number;
  }) {
    return this.prisma.station.create({
      data: {
        name: data.name,
        code: data.code,
        location: data.location,
        district: data.district,
        region: data.region,
        countryCode: data.countryCode || 'SLE',
        phone: data.phone,
        email: data.email,
        latitude: data.latitude,
        longitude: data.longitude,
        active: true,
      },
      include: { _count: { select: { officers: true } } },
    });
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      code: string;
      location: string;
      district: string;
      region: string;
      countryCode: string;
      phone: string;
      email: string;
      latitude: number;
      longitude: number;
      active: boolean;
    }>,
  ) {
    return this.prisma.station.update({
      where: { id },
      data,
      include: { _count: { select: { officers: true } } },
    });
  }

  async delete(id: string) {
    return this.prisma.station.delete({ where: { id } });
  }

  async activate(id: string) {
    return this.prisma.station.update({
      where: { id },
      data: { active: true },
      include: { _count: { select: { officers: true } } },
    });
  }

  async deactivate(id: string) {
    return this.prisma.station.update({
      where: { id },
      data: { active: false },
      include: { _count: { select: { officers: true } } },
    });
  }

  /**
   * Count officers assigned to a station.
   * Used for pre-delete validation.
   */
  async countOfficers(stationId: string): Promise<number> {
    return this.prisma.officer.count({
      where: { stationId, active: true },
    });
  }

  private buildWhereClause(
    filters?: StationFilterDto,
  ): Prisma.StationWhereInput {
    if (!filters) return {};

    const where: Prisma.StationWhereInput = {};

    if (filters.active !== undefined) {
      where.active = filters.active;
    }

    if (filters.region) {
      where.region = filters.region;
    }

    if (filters.district) {
      where.district = filters.district;
    }

    if (filters.countryCode) {
      where.countryCode = filters.countryCode;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private buildOrderBy(
    filters?: StationFilterDto,
  ): Prisma.StationOrderByWithRelationInput {
    if (!filters?.sortBy) {
      return { name: 'asc' };
    }

    const allowedSortFields = [
      'name',
      'code',
      'location',
      'region',
      'district',
      'countryCode',
      'active',
      'createdAt',
      'updatedAt',
    ];

    if (!allowedSortFields.includes(filters.sortBy)) {
      return { name: 'asc' };
    }

    return { [filters.sortBy]: filters.sortOrder || 'asc' };
  }
}
