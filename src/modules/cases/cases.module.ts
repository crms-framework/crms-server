import { Module } from '@nestjs/common';
import { CasesRepository } from './cases.repository';
import { CasesService } from './cases.service';
import { CasesController } from './cases.controller';

@Module({
  controllers: [CasesController],
  providers: [CasesRepository, CasesService],
  exports: [CasesRepository],
})
export class CasesModule {}
