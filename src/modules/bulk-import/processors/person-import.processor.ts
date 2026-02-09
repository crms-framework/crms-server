import { Injectable, Logger } from '@nestjs/common';
import { PersonsService } from '../../persons/persons.service';
import {
  IImportProcessor,
  ImportContext,
  ImportError,
  RowResult,
} from '../interfaces/import-processor.interface';

const VALID_GENDERS = ['male', 'female', 'other', 'unknown'];

@Injectable()
export class PersonImportProcessor implements IImportProcessor {
  private readonly logger = new Logger(PersonImportProcessor.name);

  constructor(private readonly personsService: PersonsService) {}

  getTemplateHeaders(): string[] {
    return [
      'firstName',
      'lastName',
      'gender',
      'stationCode',
      'nin',
      'middleName',
      'aliases',
      'dateOfBirth',
      'nationality',
      'phoneNumbers',
      'emails',
      'physicalDescription',
    ];
  }

  getRequiredHeaders(): string[] {
    return ['firstName', 'lastName', 'gender', 'stationCode'];
  }

  getTemplateExamples(): string[][] {
    return [
      [
        'John',
        'Kamara',
        'male',
        'FT-CID',
        'NIN-123456789',
        'Olu',
        'JK|Big John',
        '1990-05-15',
        'SLE',
        '+23276000000|+23277000000',
        'john@example.com',
        'Tall, dark complexion',
      ],
      [
        'Fatima',
        'Sesay',
        'female',
        'BO-HQ',
        '',
        '',
        '',
        '1985-03-22',
        'SLE',
        '',
        '',
        '',
      ],
    ];
  }

  extractLookupKeys(rows: Record<string, string>[]) {
    const stationCodes: string[] = [];
    const nationalIds: string[] = [];

    for (const row of rows) {
      if (row.stationCode) stationCodes.push(row.stationCode);
      if (row.nin) nationalIds.push(row.nin);
    }

    return { stationCodes, nationalIds };
  }

  validateRow(
    row: Record<string, string>,
    rowIndex: number,
    context: ImportContext,
  ): ImportError[] {
    const errors: ImportError[] = [];
    const rowNum = rowIndex + 2; // 1-based, skip header

    if (!row.firstName || row.firstName.length < 2) {
      errors.push({
        row: rowNum,
        field: 'firstName',
        message: 'firstName is required and must be at least 2 characters',
        value: row.firstName,
      });
    }

    if (!row.lastName || row.lastName.length < 2) {
      errors.push({
        row: rowNum,
        field: 'lastName',
        message: 'lastName is required and must be at least 2 characters',
        value: row.lastName,
      });
    }

    if (!row.gender || !VALID_GENDERS.includes(row.gender.toLowerCase())) {
      errors.push({
        row: rowNum,
        field: 'gender',
        message: `Must be one of: ${VALID_GENDERS.join(', ')}`,
        value: row.gender,
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

    if (row.dateOfBirth && isNaN(Date.parse(row.dateOfBirth))) {
      errors.push({
        row: rowNum,
        field: 'dateOfBirth',
        message: 'Invalid date format. Use YYYY-MM-DD',
        value: row.dateOfBirth,
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

    // Check for duplicate by NIN
    if (row.nin) {
      const existingId = context.lookups.persons.get(row.nin);
      if (existingId) {
        if (context.duplicateStrategy === 'skip') {
          return { success: true, action: 'skipped' };
        }
        if (context.duplicateStrategy === 'fail') {
          return {
            success: false,
            error: {
              row: rowNum,
              field: 'nin',
              message: `Duplicate NIN "${row.nin}" already exists`,
              value: row.nin,
            },
          };
        }
        // update strategy
        try {
          await this.personsService.update(
            existingId,
            this.buildUpdateData(row),
            context.officerId,
          );
          return { success: true, action: 'updated' };
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

    // Create new person
    try {
      const person = await this.personsService.create(
        {
          nationalId: row.nin || undefined,
          firstName: row.firstName,
          lastName: row.lastName,
          middleName: row.middleName || undefined,
          gender: row.gender.toLowerCase(),
          aliases: row.aliases
            ? row.aliases.split('|').map((a) => a.trim()).filter(Boolean)
            : undefined,
          dob: row.dateOfBirth ? new Date(row.dateOfBirth) : undefined,
          nationality: row.nationality || 'SLE',
          phone: row.phoneNumbers
            ? row.phoneNumbers.split('|').map((p) => p.trim()).filter(Boolean).join(', ')
            : undefined,
          email: row.emails
            ? row.emails.split('|').map((e) => e.trim()).filter(Boolean).join(', ')
            : undefined,
        },
        context.officerId,
      );

      // If nin was created, add it to the cache to catch duplicates within the same file
      if (row.nin && person.id) {
        context.lookups.persons.set(row.nin, person.id);
      }

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

  private buildUpdateData(row: Record<string, string>) {
    const data: Record<string, any> = {};
    if (row.firstName) data.firstName = row.firstName;
    if (row.lastName) data.lastName = row.lastName;
    if (row.middleName) data.middleName = row.middleName;
    if (row.gender) data.gender = row.gender.toLowerCase();
    if (row.dateOfBirth) data.dob = new Date(row.dateOfBirth);
    if (row.nationality) data.nationality = row.nationality;
    if (row.aliases) {
      data.aliases = row.aliases.split('|').map((a) => a.trim()).filter(Boolean);
    }
    if (row.phoneNumbers) {
      data.phone = row.phoneNumbers.split('|').map((p) => p.trim()).filter(Boolean).join(', ');
    }
    if (row.emails) {
      data.email = row.emails.split('|').map((e) => e.trim()).filter(Boolean).join(', ');
    }
    return data;
  }
}
