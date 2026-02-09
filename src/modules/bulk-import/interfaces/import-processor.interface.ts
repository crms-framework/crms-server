export interface ImportError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

export interface RowResult {
  success: boolean;
  action?: 'created' | 'updated' | 'skipped';
  error?: ImportError;
}

export interface LookupCache {
  stations: Map<string, string>; // stationCode → stationId
  officers: Map<string, string>; // badge → officerId
  cases: Map<string, string>; // caseNumber → caseId
  persons: Map<string, string>; // nationalId → personId
}

export interface ImportContext {
  officerId: string;
  stationId?: string;
  duplicateStrategy: 'skip' | 'update' | 'fail';
  lookups: LookupCache;
}

export interface IImportProcessor {
  getTemplateHeaders(): string[];
  getTemplateExamples(): string[][];
  getRequiredHeaders(): string[];
  extractLookupKeys(rows: Record<string, string>[]): {
    stationCodes?: string[];
    badges?: string[];
    caseNumbers?: string[];
    nationalIds?: string[];
  };
  validateRow(
    row: Record<string, string>,
    rowIndex: number,
    context: ImportContext,
  ): ImportError[];
  processRow(
    row: Record<string, string>,
    rowIndex: number,
    context: ImportContext,
  ): Promise<RowResult>;
}
