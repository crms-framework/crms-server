import { Injectable, Logger } from '@nestjs/common';
import { CasesService } from '../../cases/cases.service';
import {
  IImportProcessor,
  ImportContext,
  ImportError,
  RowResult,
} from '../interfaces/import-processor.interface';

const VALID_SEVERITIES = ['minor', 'major', 'critical'];

@Injectable()
export class CaseImportProcessor implements IImportProcessor {
  private readonly logger = new Logger(CaseImportProcessor.name);

  constructor(private readonly casesService: CasesService) {}

  getTemplateHeaders(): string[] {
    return [
      'title',
      'category',
      'severity',
      'stationCode',
      'officerBadge',
      'incidentDate',
      'description',
      'location',
      'latitude',
      'longitude',
      'ward',
      'district',
    ];
  }

  getRequiredHeaders(): string[] {
    return ['title', 'category', 'severity', 'stationCode'];
  }

  getTemplateExamples(): string[][] {
    return [
      [
        'Theft at Market Street',
        'theft',
        'major',
        'FT-CID',
        'B-1234',
        '2026-01-15',
        'Suspect was seen breaking into a shop',
        'Market Street, Freetown',
        '8.484',
        '-13.2299',
        'Ward 1',
        'Western Area Urban',
      ],
      [
        'Assault near Stadium',
        'assault',
        'minor',
        'BO-HQ',
        '',
        '2026-02-01',
        '',
        'Bo Stadium area',
        '',
        '',
        '',
        'Bo',
      ],
    ];
  }

  extractLookupKeys(rows: Record<string, string>[]) {
    const stationCodes: string[] = [];
    const badges: string[] = [];

    for (const row of rows) {
      if (row.stationCode) stationCodes.push(row.stationCode);
      if (row.officerBadge) badges.push(row.officerBadge);
    }

    return { stationCodes, badges };
  }

  validateRow(
    row: Record<string, string>,
    rowIndex: number,
    context: ImportContext,
  ): ImportError[] {
    const errors: ImportError[] = [];
    const rowNum = rowIndex + 2;

    if (!row.title || row.title.length < 5) {
      errors.push({
        row: rowNum,
        field: 'title',
        message: 'title is required and must be at least 5 characters',
        value: row.title,
      });
    } else if (row.title.length > 200) {
      errors.push({
        row: rowNum,
        field: 'title',
        message: 'title must be 200 characters or less',
        value: row.title,
      });
    }

    if (!row.category || row.category.length < 2) {
      errors.push({
        row: rowNum,
        field: 'category',
        message: 'category is required',
        value: row.category,
      });
    }

    if (
      !row.severity ||
      !VALID_SEVERITIES.includes(row.severity.toLowerCase())
    ) {
      errors.push({
        row: rowNum,
        field: 'severity',
        message: `Must be one of: ${VALID_SEVERITIES.join(', ')}`,
        value: row.severity,
      });
    }

    if (!row.stationCode) {
      errors.push({
        row: rowNum,
        field: 'stationCode',
        message: 'stationCode is required',
      });
    } else if (!context.lookups.stations.has(row.stationCode)) {
      errors.push({
        row: rowNum,
        field: 'stationCode',
        message: `Station code "${row.stationCode}" not found`,
        value: row.stationCode,
      });
    }

    if (
      row.officerBadge &&
      !context.lookups.officers.has(row.officerBadge)
    ) {
      errors.push({
        row: rowNum,
        field: 'officerBadge',
        message: `Officer badge "${row.officerBadge}" not found`,
        value: row.officerBadge,
      });
    }

    if (row.incidentDate && isNaN(Date.parse(row.incidentDate))) {
      errors.push({
        row: rowNum,
        field: 'incidentDate',
        message: 'Invalid date format. Use YYYY-MM-DD',
        value: row.incidentDate,
      });
    }

    if (row.latitude && isNaN(parseFloat(row.latitude))) {
      errors.push({
        row: rowNum,
        field: 'latitude',
        message: 'latitude must be a valid number',
        value: row.latitude,
      });
    }

    if (row.longitude && isNaN(parseFloat(row.longitude))) {
      errors.push({
        row: rowNum,
        field: 'longitude',
        message: 'longitude must be a valid number',
        value: row.longitude,
      });
    }

    return errors;
  }

  async processRow(
    row: Record<string, string>,
    rowIndex: number,
    context: ImportContext,
  ): Promise<RowResult> {
    const rowNum = rowIndex + 2;
    const stationId = context.lookups.stations.get(row.stationCode)!;

    // Resolve officer: use badge from CSV or fall back to importing officer
    const officerId = row.officerBadge
      ? context.lookups.officers.get(row.officerBadge) || context.officerId
      : context.officerId;

    try {
      await this.casesService.create(
        {
          title: row.title,
          category: row.category.toLowerCase(),
          severity: row.severity.toLowerCase(),
          stationId,
          incidentDate: row.incidentDate
            ? new Date(row.incidentDate)
            : new Date(),
          description: row.description || undefined,
          location: row.location || undefined,
          latitude: row.latitude ? parseFloat(row.latitude) : undefined,
          longitude: row.longitude ? parseFloat(row.longitude) : undefined,
          ward: row.ward || undefined,
          district: row.district || undefined,
        },
        officerId,
      );

      return { success: true, action: 'created' };
    } catch (err: any) {
      return {
        success: false,
        error: {
          row: rowNum,
          field: 'general',
          message: err.message,
        },
      };
    }
  }
}
