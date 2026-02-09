import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BulkImportController } from './bulk-import.controller';
import { BulkImportService } from './bulk-import.service';
import { BulkImportRepository } from './bulk-import.repository';
import { BulkImportProcessor } from './bulk-import.processor';
import { ProcessorRegistry } from './processors/processor.registry';
import { PersonImportProcessor } from './processors/person-import.processor';
import { CaseImportProcessor } from './processors/case-import.processor';
import { EvidenceImportProcessor } from './processors/evidence-import.processor';
import { FieldResolverUtil } from './utils/field-resolver.util';
import { UploadModule } from '../upload/upload.module';
import { PersonsModule } from '../persons/persons.module';
import { CasesModule } from '../cases/cases.module';
import { EvidenceModule } from '../evidence/evidence.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'bulk-import' }),
    UploadModule,
    PersonsModule,
    CasesModule,
    EvidenceModule,
  ],
  controllers: [BulkImportController],
  providers: [
    BulkImportService,
    BulkImportRepository,
    BulkImportProcessor,
    ProcessorRegistry,
    PersonImportProcessor,
    CaseImportProcessor,
    EvidenceImportProcessor,
    FieldResolverUtil,
  ],
})
export class BulkImportModule {}
