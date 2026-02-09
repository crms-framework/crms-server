import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('case/:caseId')
  @RequirePermissions('reports', 'read', 'station')
  @ApiOperation({ summary: 'Generate a full case report' })
  getCaseReport(
    @Param('caseId') caseId: string,
    @CurrentUser('id') officerId: string,
  ) {
    return this.reportsService.getCaseReport(caseId, officerId);
  }

  @Get('station/:stationId')
  @RequirePermissions('reports', 'read', 'station')
  @ApiOperation({ summary: 'Generate a station report' })
  getStationReport(
    @Param('stationId') stationId: string,
    @CurrentUser('id') officerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getStationReport(stationId, officerId, startDate, endDate);
  }

  @Get('compliance')
  @RequirePermissions('reports', 'read', 'national')
  @ApiOperation({ summary: 'Generate a compliance report' })
  getComplianceReport(
    @CurrentUser('id') officerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getComplianceReport(officerId, startDate, endDate);
  }

  @Get('custom')
  @RequirePermissions('reports', 'read', 'station')
  @ApiOperation({ summary: 'Generate a custom report' })
  getCustomReport(
    @CurrentUser('id') officerId: string,
    @Query('entityType') entityType?: string,
    @Query('stationId') stationId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getCustomReport(
      { entityType, stationId, startDate, endDate },
      officerId,
    );
  }

  @Get('export')
  @RequirePermissions('reports', 'export', 'station')
  @ApiOperation({ summary: 'Export report data as CSV' })
  exportReport(
    @CurrentUser('id') officerId: string,
    @Query('entityType') entityType?: string,
    @Query('stationId') stationId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.exportReport(
      { entityType, stationId, startDate, endDate },
      officerId,
    );
  }
}
