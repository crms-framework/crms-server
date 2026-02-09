import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class GeoCrimeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getHeatmapData(filters: {
    startDate?: string;
    endDate?: string;
    category?: string;
    region?: string;
    granularity?: string;
    swLat?: number;
    swLng?: number;
    neLat?: number;
    neLng?: number;
  }) {
    const where: any = {};
    if (filters.startDate) where.period = { gte: filters.startDate };
    if (filters.endDate) where.period = { ...where.period, lte: filters.endDate };
    if (filters.category) where.category = filters.category;
    if (filters.region) where.region = filters.region;
    if (filters.granularity) where.periodType = filters.granularity;

    if (filters.swLat && filters.swLng && filters.neLat && filters.neLng) {
      where.latitude = { gte: filters.swLat, lte: filters.neLat };
      where.longitude = { gte: filters.swLng, lte: filters.neLng };
    }

    return this.prisma.geoCrimeAggregate.findMany({
      where,
      orderBy: { caseCount: 'desc' },
    });
  }

  async getClusters(filters: { startDate?: string; endDate?: string; category?: string }) {
    const where: any = {};
    if (filters.category) where.category = filters.category;
    if (filters.startDate || filters.endDate) {
      where.period = {};
      if (filters.startDate) where.period.gte = filters.startDate;
      if (filters.endDate) where.period.lte = filters.endDate;
    }

    return this.prisma.geoCrimeAggregate.groupBy({
      by: ['region', 'latitude', 'longitude'],
      where,
      _sum: { caseCount: true },
      orderBy: { _sum: { caseCount: 'desc' } },
    });
  }

  async getTrends(filters: {
    region?: string;
    category?: string;
    granularity?: string;
    months?: number;
  }) {
    const where: any = { periodType: filters.granularity || 'monthly' };
    if (filters.region) where.region = filters.region;
    if (filters.category) where.category = filters.category;

    return this.prisma.geoCrimeAggregate.findMany({
      where,
      orderBy: { period: 'asc' },
      take: (filters.months || 12) * 10,
    });
  }

  async getHotspots(limit: number = 10) {
    return this.prisma.geoCrimeAggregate.groupBy({
      by: ['region', 'latitude', 'longitude'],
      _sum: { caseCount: true },
      orderBy: { _sum: { caseCount: 'desc' } },
      take: limit,
    });
  }

  async rebuildAggregates() {
    // Delete existing aggregates
    await this.prisma.geoCrimeAggregate.deleteMany();

    // Rebuild monthly aggregates from cases with geo data
    const cases = await this.prisma.case.findMany({
      where: { latitude: { not: null }, longitude: { not: null } },
      select: {
        category: true,
        latitude: true,
        longitude: true,
        district: true,
        ward: true,
        incidentDate: true,
        station: { select: { district: true, region: true } },
      },
    });

    const aggregates = new Map<string, any>();

    for (const c of cases) {
      const region = c.district || c.ward || c.station?.district || 'Unknown';
      const date = new Date(c.incidentDate);
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const key = `${region}|${c.category}|${period}|monthly`;

      if (!aggregates.has(key)) {
        aggregates.set(key, {
          region,
          category: c.category,
          period,
          periodType: 'monthly',
          caseCount: 0,
          latitude: c.latitude || 0,
          longitude: c.longitude || 0,
        });
      }
      aggregates.get(key).caseCount++;
    }

    // Batch insert
    const data = Array.from(aggregates.values());
    if (data.length > 0) {
      await this.prisma.geoCrimeAggregate.createMany({ data });
    }

    return { aggregatesCreated: data.length };
  }
}
