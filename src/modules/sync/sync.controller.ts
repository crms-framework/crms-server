import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { SyncService } from './sync.service';
import { CreateSyncDto, SyncFilterDto } from './dto/create-sync.dto';

@ApiTags('Sync')
@ApiBearerAuth()
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get()
  @RequirePermissions('cases', 'read', 'station')
  @ApiOperation({ summary: 'List sync queue entries' })
  findAll(
    @Query() filters: SyncFilterDto,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.syncService.findAll(
      { status: filters.status, entityType: filters.entityType },
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Get('stats')
  @RequirePermissions('cases', 'read', 'station')
  @ApiOperation({ summary: 'Get sync queue status counts' })
  getStats() {
    return this.syncService.getStats();
  }

  @Post()
  @RequirePermissions('cases', 'create', 'station')
  @ApiOperation({ summary: 'Queue a change for sync' })
  queueChange(@Body() dto: CreateSyncDto) {
    return this.syncService.queueChange(dto);
  }

  @Post('process')
  @RequirePermissions('cases', 'update', 'national')
  @ApiOperation({ summary: 'Process pending sync items' })
  processPending(@Query('limit') limit?: number) {
    return this.syncService.processPending(Number(limit) || 50);
  }

  @Post(':id/retry')
  @RequirePermissions('cases', 'update', 'station')
  @ApiOperation({ summary: 'Retry a failed sync entry' })
  retry(@Param('id') id: string) {
    return this.syncService.retryFailed(id);
  }
}
