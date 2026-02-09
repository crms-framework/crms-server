import { Module } from '@nestjs/common';
import { UssdController } from './ussd.controller';
import { UssdService } from './ussd.service';
import { UssdRepository } from './ussd.repository';

@Module({
  controllers: [UssdController],
  providers: [UssdService, UssdRepository],
  exports: [UssdService, UssdRepository],
})
export class UssdModule {}
