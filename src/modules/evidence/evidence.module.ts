import { Module } from '@nestjs/common';
import { EvidenceController } from './evidence.controller';
import { EvidenceService } from './evidence.service';
import { EvidenceRepository } from './evidence.repository';

@Module({
  controllers: [EvidenceController],
  providers: [EvidenceService, EvidenceRepository],
  exports: [EvidenceService, EvidenceRepository],
})
export class EvidenceModule {}
