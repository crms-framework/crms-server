import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GeoCrimeService } from './geocrime.service';
import { GeoCrimeQueryDto, GeoCrimeTrendQueryDto, GeoCrimeHotspotQueryDto } from './dto/geocrime-query.dto';

@ApiTags('GeoCrime')
@ApiBearerAuth()
@Controller('geocrime')
export class GeoCrimeController {
  constructor(private readonly geoCrimeService: GeoCrimeService) {}

  @Get('heatmap')
  @RequirePermissions('reports', 'read', 'station')
  @ApiOperation({ summary: 'Get heatmap data for crime visualization' })
  getHeatmap(@Query() query: GeoCrimeQueryDto) {
    return this.geoCrimeService.getHeatmap(query);
  }

  @Get('clusters')
  @RequirePermissions('reports', 'read', 'station')
  @ApiOperation({ summary: 'Get clustered crime data by region' })
  getClusters(@Query() query: GeoCrimeQueryDto) {
    return this.geoCrimeService.getClusters(query);
  }

  @Get('trends')
  @RequirePermissions('reports', 'read', 'station')
  @ApiOperation({ summary: 'Get crime trend data over time' })
  getTrends(@Query() query: GeoCrimeTrendQueryDto) {
    return this.geoCrimeService.getTrends(query);
  }

  @Get('hotspots')
  @RequirePermissions('reports', 'read', 'station')
  @ApiOperation({ summary: 'Get top crime hotspots' })
  getHotspots(@Query() query: GeoCrimeHotspotQueryDto) {
    return this.geoCrimeService.getHotspots(query);
  }

  @Post('aggregate')
  @RequirePermissions('reports', 'create', 'national')
  @ApiOperation({ summary: 'Trigger manual aggregate rebuild (admin only)' })
  triggerAggregation(@CurrentUser('id') officerId: string) {
    return this.geoCrimeService.triggerAggregation(officerId);
  }
}
