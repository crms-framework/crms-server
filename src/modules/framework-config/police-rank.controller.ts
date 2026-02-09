import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FrameworkConfigService } from './framework-config.service';
import { CreatePoliceRankDto, UpdatePoliceRankDto } from './dto/create-police-rank.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Police Ranks')
@ApiBearerAuth()
@Controller('police-ranks')
export class PoliceRankController {
  constructor(private readonly configService: FrameworkConfigService) {}

  @Get()
  @ApiOperation({ summary: 'List all police ranks (ordered by level)' })
  findAll() {
    return this.configService.findAllPoliceRanks();
  }

  @Post()
  @RequirePermissions('stations', 'create', 'national')
  @ApiOperation({ summary: 'Create police rank' })
  create(@Body() dto: CreatePoliceRankDto) {
    return this.configService.createPoliceRank(dto);
  }

  @Patch(':id')
  @RequirePermissions('stations', 'update', 'national')
  @ApiOperation({ summary: 'Update police rank' })
  update(@Param('id') id: string, @Body() dto: UpdatePoliceRankDto) {
    return this.configService.updatePoliceRank(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('stations', 'delete', 'national')
  @ApiOperation({ summary: 'Soft delete police rank' })
  remove(@Param('id') id: string) {
    return this.configService.softDeletePoliceRank(id);
  }
}
