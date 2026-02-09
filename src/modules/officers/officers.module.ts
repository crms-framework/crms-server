import { Module } from '@nestjs/common';
import { OfficersController } from './officers.controller';
import { OfficersService } from './officers.service';
import { OfficersRepository } from './officers.repository';

@Module({
  controllers: [OfficersController],
  providers: [OfficersRepository, OfficersService],
  exports: [OfficersRepository, OfficersService],
})
export class OfficersModule {}
