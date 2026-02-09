import { Injectable, Logger } from '@nestjs/common';
import { EvidenceService } from '../../evidence/evidence.service';
import { PrismaService } from '../../../common/database/prisma.service';
import {
  IImportProcessor,
  ImportContext,
  ImportError,
  RowResult,
} from '../interfaces/import-processor.interface';

const VALID_TYPES = [
  'physical',
  'document',
  'photo',
  'video',
  'audio',
  'digital',
  'biological',
  'other',
];

@Injectable()
export class EvidenceImportProcessor implements IImportProcessor {
  private readonly logger = new Logger(EvidenceImportProcessor.name);

  constructor(
    private readonly evidenceService: EvidenceService,
    private readonly prisma: PrismaService,
  ) {}

  getTemplateHeaders(): string[] {
    return [
      'caseNumber',
      'type',
      'description',
      'collectedByBadge',
      'collectedAt',
      'location',
      'tags',
    ];
  }

  getRequiredHeaders(): string[] {
    return ['caseNumber', 'type', 'description', 'collectedByBadge'];
  }

  getTemplateExamples(): string[][] {
    return [
      [
        'FT-CID-2026-000001',
        'physical',
        'Knife found at the scene near the entrance',
        'B-1234',
        '2026-01-15',
        'Market Street, Freetown',
        'weapon|scene-evidence',
      ],
      [
        'BO-HQ-2026-000001',
        'document',
        'Written statement from witness',
        'B-5678',
        '',
        '',
        'statement',
      ],
    ];
  }

  extractLookupKeys(rows: Record<string, string>[]) {
    const caseNumbers: string[] = [];
    const badges: string[] = [];

    for (const row of rows) {
      if (row.caseNumber) caseNumbers.push(row.caseNumber);
      if (row.collectedByBadge) badges.push(row.collectedByBadge);
    }

    return { caseNumbers, badges };
  }

  validateRow(
    row: Record<string, string>,
    rowIndex: number,
    context: ImportContext,
  ): ImportError[] {
    const errors: ImportError[] = [];
    const rowNum = rowIndex + 2;

    if (!row.caseNumber) {
      errors.push({
        row: rowNum,
        field: 'caseNumber',
        message: 'caseNumber is required',
      });
    } else if (!context.lookups.cases.has(row.caseNumber)) {
      errors.push({
        row: rowNum,
        field: 'caseNumber',
        message: `Case number "${row.caseNumber}" not found`,
        value: row.caseNumber,
      });
    }

    if (!row.type || !VALID_TYPES.includes(row.type.toLowerCase())) {
      errors.push({
        row: rowNum,
        field: 'type',
        message: `Must be one of: ${VALID_TYPES.join(', ')}`,
        value: row.type,
      });
    }

    if (!row.description || row.description.length < 5) {
      errors.push({
        row: rowNum,
        field: 'description',
        message: 'description is required and must be at least 5 characters',
        value: row.description,
      });
    } else if (row.description.length > 2000) {
      errors.push({
        row: rowNum,
        field: 'description',
        message: 'description must be 2000 characters or less',
        value: row.description?.substring(0, 50) + '...',
      });
    }

    if (!row.collectedByBadge) {
      errors.push({
        row: rowNum,
        field: 'collectedByBadge',
        message: 'collectedByBadge is required',
      });
    } else if (!context.lookups.officers.has(row.collectedByBadge)) {
      errors.push({
        row: rowNum,
        field: 'collectedByBadge',
        message: `Officer badge "${row.collectedByBadge}" not found`,
        value: row.collectedByBadge,
      });
    }

    if (row.collectedAt && isNaN(Date.parse(row.collectedAt))) {
      errors.push({
        row: rowNum,
        field: 'collectedAt',
        message: 'Invalid date format. Use YYYY-MM-DD',
        value: row.collectedAt,
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
    const caseId = context.lookups.cases.get(row.caseNumber)!;
    const collectedById = context.lookups.officers.get(row.collectedByBadge)!;

    // Look up the case to get the stationId
    const caseRecord = await this.prisma.case.findUnique({
      where: { id: caseId },
      select: { stationId: true },
    });

    if (!caseRecord) {
      return {
        success: false,
        error: {
          row: rowNum,
          field: 'caseNumber',
          message: `Case not found for ID resolved from "${row.caseNumber}"`,
        },
      };
    }

    try {
      await this.evidenceService.create(
        {
          caseId,
          type: row.type.toLowerCase(),
          description: row.description,
          location: row.location || undefined,
          collectedBy: collectedById,
          collectedAt: row.collectedAt || undefined,
        },
        context.officerId,
        caseRecord.stationId,
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
