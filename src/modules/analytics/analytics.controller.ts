import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AnalyticsService } from './analytics.service';
import { AnalyticsCacheInterceptor } from './interceptors/analytics-cache.interceptor';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @RequirePermissions('reports', 'read', 'station')
  @ApiOperation({ summary: 'Get full dashboard overview' })
  getOverview(@Query('stationId') stationId?: string) {
    return this.analyticsService.getOverview(stationId);
  }

  @Get('dashboard')
  @UseInterceptors(AnalyticsCacheInterceptor)
  @RequirePermissions('reports', 'read', 'station')
  @ApiOperation({ summary: 'Get comprehensive dashboard statistics for client' })
  getDashboard(@Query('stationId') stationId?: string) {
    return this.analyticsService.getDashboardStats(stationId);
  }

  @Get('cases')
  @RequirePermissions('reports', 'read', 'station')
  @ApiOperation({ summary: 'Get case statistics' })
  getCaseStats(@Query('stationId') stationId?: string) {
    return this.analyticsService.getCaseStats(stationId);
  }

  @Get('officers')
  @RequirePermissions('reports', 'read', 'station')
  @ApiOperation({ summary: 'Get officer statistics' })
  getOfficerStats(@Query('stationId') stationId?: string) {
    return this.analyticsService.getOfficerStats(stationId);
  }

  @Get('evidence')
  @RequirePermissions('reports', 'read', 'station')
  @ApiOperation({ summary: 'Get evidence statistics' })
  getEvidenceStats(@Query('stationId') stationId?: string) {
    return this.analyticsService.getEvidenceStats(stationId);
  }

  @Get('alerts')
  @RequirePermissions('reports', 'read', 'station')
  @ApiOperation({ summary: 'Get alert statistics' })
  getAlertStats() {
    return this.analyticsService.getAlertStats();
  }

  @Get('trends')
  @RequirePermissions('reports', 'read', 'station')
  @ApiOperation({ summary: 'Get case trends over time' })
  getTrends(
    @Query('months') months?: number,
    @Query('stationId') stationId?: string,
  ) {
    return this.analyticsService.getTrends(Number(months) || 12, stationId);
  }

  @Get('activity')
  @RequirePermissions('reports', 'read', 'station')
  @ApiOperation({ summary: 'Get recent activity from audit log' })
  getRecentActivity(@Query('limit') limit?: number) {
    return this.analyticsService.getRecentActivity(Number(limit) || 50);
  }
}
