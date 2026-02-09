import Papa from 'papaparse';

export interface CsvParseResult {
  headers: string[];
  rows: Record<string, string>[];
  errors: string[];
}

export function parseCsv(buffer: Buffer): CsvParseResult {
  const content = buffer.toString('utf-8');

  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
    transform: (value: string) => value.trim(),
  });

  const headers = result.meta.fields || [];
  const rows = result.data;
  const errors: string[] = [];

  if (result.errors.length > 0) {
    for (const err of result.errors) {
      errors.push(`Row ${(err.row ?? 0) + 2}: ${err.message}`);
    }
  }

  return { headers, rows, errors };
}

export function validateHeaders(
  actual: string[],
  required: string[],
  allowed: string[],
): { valid: boolean; missing: string[]; unknown: string[] } {
  const actualSet = new Set(actual);
  const allowedSet = new Set(allowed);

  const missing = required.filter((h) => !actualSet.has(h));
  const unknown = actual.filter((h) => !allowedSet.has(h));

  return {
    valid: missing.length === 0 && unknown.length === 0,
    missing,
    unknown,
  };
}

export function generateCsvTemplate(
  headers: string[],
  examples: string[][],
): string {
  const rows = [headers, ...examples];
  return Papa.unparse(rows);
}
