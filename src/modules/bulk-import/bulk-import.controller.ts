import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BulkImportService } from './bulk-import.service';
import { StartImportDto } from './dto/start-import.dto';
import { ImportFilterDto } from './dto/import-filter.dto';

@ApiTags('Bulk Import')
@ApiBearerAuth()
@Controller('bulk-import')
export class BulkImportController {
  constructor(private readonly bulkImportService: BulkImportService) {}

  @Post(':entity')
  @RequirePermissions('bulk-import', 'create', 'station')
  @ApiOperation({ summary: 'Start a bulk import job for an entity type' })
  startImport(
    @Param('entity') entity: string,
    @Body() dto: StartImportDto,
    @CurrentUser('id') officerId: string,
    @CurrentUser('stationId') stationId: string,
  ) {
    return this.bulkImportService.startImport(
      entity,
      dto,
      officerId,
      stationId,
    );
  }

  @Get('jobs')
  @RequirePermissions('bulk-import', 'read', 'station')
  @ApiOperation({ summary: 'List import jobs with filters' })
  listJobs(@Query() filters: ImportFilterDto) {
    return this.bulkImportService.listJobs(filters);
  }

  @Get('jobs/:jobId')
  @RequirePermissions('bulk-import', 'read', 'station')
  @ApiOperation({ summary: 'Get import job status and progress' })
  getJob(@Param('jobId') jobId: string) {
    return this.bulkImportService.getJob(jobId);
  }

  @Get(':entity/template')
  @RequirePermissions('bulk-import', 'read', 'station')
  @ApiOperation({ summary: 'Download CSV template for an entity type' })
  getTemplate(@Param('entity') entity: string, @Res() res: Response) {
    const { csv, fileName } = this.bulkImportService.getTemplate(entity);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(csv);
  }

  @Delete('jobs/:jobId')
  @RequirePermissions('bulk-import', 'delete', 'station')
  @ApiOperation({ summary: 'Cancel a pending or processing import job' })
  cancelJob(@Param('jobId') jobId: string) {
    return this.bulkImportService.cancelJob(jobId);
  }
}
