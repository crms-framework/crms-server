import { Injectable } from '@nestjs/common';
import { IImportProcessor } from '../interfaces/import-processor.interface';
import { PersonImportProcessor } from './person-import.processor';
import { CaseImportProcessor } from './case-import.processor';
import { EvidenceImportProcessor } from './evidence-import.processor';

const VALID_ENTITIES = ['persons', 'cases', 'evidence'] as const;
export type EntityType = (typeof VALID_ENTITIES)[number];

@Injectable()
export class ProcessorRegistry {
  private readonly processors: Map<string, IImportProcessor>;

  constructor(
    private readonly personProcessor: PersonImportProcessor,
    private readonly caseProcessor: CaseImportProcessor,
    private readonly evidenceProcessor: EvidenceImportProcessor,
  ) {
    this.processors = new Map<string, IImportProcessor>([
      ['persons', this.personProcessor],
      ['cases', this.caseProcessor],
      ['evidence', this.evidenceProcessor],
    ]);
  }

  get(entityType: string): IImportProcessor | undefined {
    return this.processors.get(entityType);
  }

  isValid(entityType: string): entityType is EntityType {
    return VALID_ENTITIES.includes(entityType as EntityType);
  }

  getValidTypes(): string[] {
    return [...VALID_ENTITIES];
  }
}
