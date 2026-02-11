import { Module } from '@nestjs/common';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { VehiclesRepository } from './vehicles.repository';

@Module({
  controllers: [VehiclesController],
  providers: [VehiclesRepository, VehiclesService],
  exports: [VehiclesRepository, VehiclesService],
})
export class VehiclesModule {}
