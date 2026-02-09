import { Module } from '@nestjs/common';
import { GeoCrimeController } from './geocrime.controller';
import { GeoCrimeService } from './geocrime.service';
import { GeoCrimeRepository } from './geocrime.repository';
import { GeoCrimeScheduler } from './geocrime.scheduler';

@Module({
  controllers: [GeoCrimeController],
  providers: [GeoCrimeService, GeoCrimeRepository, GeoCrimeScheduler],
  exports: [GeoCrimeService, GeoCrimeRepository],
})
export class GeoCrimeModule {}
