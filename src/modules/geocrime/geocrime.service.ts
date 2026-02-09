import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { GeoCrimeRepository } from './geocrime.repository';
import type { GeoCrimeQueryDto, GeoCrimeTrendQueryDto, GeoCrimeHotspotQueryDto } from './dto/geocrime-query.dto';
import type { ClusterDto } from './dto/geocrime-response.dto';

@Injectable()
export class GeoCrimeService {
  private readonly logger = new Logger(GeoCrimeService.name);

  constructor(
    private readonly geoCrimeRepository: GeoCrimeRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getHeatmap(query: GeoCrimeQueryDto) {
    this.validateBoundingBox(query);
    return this.geoCrimeRepository.getHeatmapData(query);
  }

  async getClusters(query: GeoCrimeQueryDto): Promise<ClusterDto[]> {
    this.validateBoundingBox(query);
    const results = await this.geoCrimeRepository.getClusters({
      startDate: query.startDate,
      endDate: query.endDate,
      category: query.category,
    });

    return results.map((r: any) => ({
      region: r.region,
      latitude: r.latitude,
      longitude: r.longitude,
      totalCases: r._sum?.caseCount || 0,
    }));
  }

  async getTrends(query: GeoCrimeTrendQueryDto) {
    return this.geoCrimeRepository.getTrends({
      region: query.region,
      category: query.category,
      granularity: query.granularity,
      months: query.months,
    });
  }

  async getHotspots(query: GeoCrimeHotspotQueryDto): Promise<ClusterDto[]> {
    const results = await this.geoCrimeRepository.getHotspots(query.limit);

    return results.map((r: any) => ({
      region: r.region,
      latitude: r.latitude,
      longitude: r.longitude,
      totalCases: r._sum?.caseCount || 0,
    }));
  }

  async triggerAggregation(officerId: string) {
    const result = await this.geoCrimeRepository.rebuildAggregates();

    await this.logAudit(officerId, 'trigger_aggregation', 'geocrime', {
      aggregatesCreated: result.aggregatesCreated,
    });

    return result;
  }

  private validateBoundingBox(query: GeoCrimeQueryDto) {
    const { swLat, swLng, neLat, neLng } = query;
    const provided = [swLat, swLng, neLat, neLng].filter(
      (v) => v !== undefined && v !== null,
    );

    if (provided.length > 0 && provided.length < 4) {
      throw new BadRequestException(
        'All bounding box coordinates (swLat, swLng, neLat, neLng) must be provided together',
      );
    }
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
          entityType: 'geocrime',
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
