import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { LookupCache } from '../interfaces/import-processor.interface';

@Injectable()
export class FieldResolverUtil {
  private readonly logger = new Logger(FieldResolverUtil.name);

  constructor(private readonly prisma: PrismaService) {}

  async buildLookupCache(keys: {
    stationCodes?: string[];
    badges?: string[];
    caseNumbers?: string[];
    nationalIds?: string[];
  }): Promise<LookupCache> {
    const cache: LookupCache = {
      stations: new Map(),
      officers: new Map(),
      cases: new Map(),
      persons: new Map(),
    };

    const tasks: Promise<void>[] = [];

    if (keys.stationCodes?.length) {
      tasks.push(this.resolveStations(keys.stationCodes, cache));
    }
    if (keys.badges?.length) {
      tasks.push(this.resolveOfficers(keys.badges, cache));
    }
    if (keys.caseNumbers?.length) {
      tasks.push(this.resolveCases(keys.caseNumbers, cache));
    }
    if (keys.nationalIds?.length) {
      tasks.push(this.resolvePersons(keys.nationalIds, cache));
    }

    await Promise.all(tasks);
    return cache;
  }

  private async resolveStations(
    codes: string[],
    cache: LookupCache,
  ): Promise<void> {
    const unique = [...new Set(codes)];
    const stations = await this.prisma.station.findMany({
      where: { code: { in: unique } },
      select: { id: true, code: true },
    });

    for (const s of stations) {
      cache.stations.set(s.code, s.id);
    }

    this.logger.log(
      `Resolved ${stations.length}/${unique.length} station codes`,
    );
  }

  private async resolveOfficers(
    badges: string[],
    cache: LookupCache,
  ): Promise<void> {
    const unique = [...new Set(badges)];
    const officers = await this.prisma.officer.findMany({
      where: { badge: { in: unique } },
      select: { id: true, badge: true },
    });

    for (const o of officers) {
      cache.officers.set(o.badge, o.id);
    }

    this.logger.log(
      `Resolved ${officers.length}/${unique.length} officer badges`,
    );
  }

  private async resolveCases(
    caseNumbers: string[],
    cache: LookupCache,
  ): Promise<void> {
    const unique = [...new Set(caseNumbers)];
    const cases = await this.prisma.case.findMany({
      where: { caseNumber: { in: unique } },
      select: { id: true, caseNumber: true },
    });

    for (const c of cases) {
      cache.cases.set(c.caseNumber, c.id);
    }

    this.logger.log(
      `Resolved ${cases.length}/${unique.length} case numbers`,
    );
  }

  private async resolvePersons(
    nationalIds: string[],
    cache: LookupCache,
  ): Promise<void> {
    const unique = [...new Set(nationalIds)];
    const persons = await this.prisma.person.findMany({
      where: { nationalId: { in: unique } },
      select: { id: true, nationalId: true },
    });

    for (const p of persons) {
      if (p.nationalId) {
        cache.persons.set(p.nationalId, p.id);
      }
    }

    this.logger.log(
      `Resolved ${persons.length}/${unique.length} national IDs`,
    );
  }
}
