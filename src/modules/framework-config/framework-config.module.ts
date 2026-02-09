import { Global, Module } from '@nestjs/common';
import { FrameworkConfigRepository } from './framework-config.repository';
import { FrameworkConfigService } from './framework-config.service';
import { FrameworkConfigController } from './framework-config.controller';
import { OffenseCategoryController } from './offense-category.controller';
import { PoliceRankController } from './police-rank.controller';

@Global()
@Module({
  controllers: [
    FrameworkConfigController,
    OffenseCategoryController,
    PoliceRankController,
  ],
  providers: [FrameworkConfigRepository, FrameworkConfigService],
  exports: [FrameworkConfigService],
})
export class FrameworkConfigModule {}
