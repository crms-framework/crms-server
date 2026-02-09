import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BackgroundChecksService } from './background-checks.service';

@ApiTags('Background Checks')
@ApiBearerAuth()
@Controller('background-checks')
export class BackgroundChecksController {
  constructor(private readonly bgCheckService: BackgroundChecksService) {}

  @Post()
  @RequirePermissions('bgcheck', 'create', 'station')
  @ApiOperation({ summary: 'Perform a background check by NIN' })
  perform(
    @Body()
    body: {
      nin: string;
      requestType: string;
      phoneNumber?: string;
      ipAddress?: string;
    },
    @CurrentUser('id') officerId: string,
  ) {
    return this.bgCheckService.perform(body, officerId);
  }

  @Get()
  @RequirePermissions('bgcheck', 'read', 'station')
  @ApiOperation({ summary: 'List background checks with filters' })
  findAll(
    @Query('requestType') requestType?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.bgCheckService.findAll(
      { requestType, status },
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Get('stats')
  @RequirePermissions('bgcheck', 'read', 'station')
  @ApiOperation({ summary: 'Get background check statistics' })
  getStats() {
    return this.bgCheckService.getStats();
  }

  @Get('history/:nin')
  @RequirePermissions('bgcheck', 'read', 'station')
  @ApiOperation({ summary: 'Get background check history for a NIN' })
  getHistory(
    @Param('nin') nin: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.bgCheckService.getHistory(nin, Number(page) || 1, Number(limit) || 20);
  }

  @Get(':id')
  @RequirePermissions('bgcheck', 'read', 'station')
  @ApiOperation({ summary: 'Get background check by ID' })
  findById(@Param('id') id: string) {
    return this.bgCheckService.findById(id);
  }

  @Get(':id/result')
  @RequirePermissions('bgcheck', 'read', 'station')
  @ApiOperation({ summary: 'Get background check result' })
  getResult(@Param('id') id: string) {
    return this.bgCheckService.getResult(id);
  }

  @Post(':id/certificate')
  @RequirePermissions('bgcheck', 'create', 'station')
  @ApiOperation({ summary: 'Issue a clearance certificate' })
  issueCertificate(
    @Param('id') id: string,
    @CurrentUser('id') officerId: string,
  ) {
    return this.bgCheckService.issueCertificate(id, officerId);
  }

  @Delete(':id')
  @RequirePermissions('bgcheck', 'delete', 'station')
  @ApiOperation({ summary: 'Delete a background check' })
  delete(@Param('id') id: string, @CurrentUser('id') officerId: string) {
    return this.bgCheckService.delete(id, officerId);
  }
}
