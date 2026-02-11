import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StationsService } from './stations.service';
import { CreateStationDto } from './dto/create-station.dto';
import { StationFilterDto } from './dto/station-filter.dto';

@ApiTags('Stations')
@ApiBearerAuth()
@Controller('stations')
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  @Get()
  @RequirePermissions('stations', 'read', 'station')
  @ApiOperation({ summary: 'List stations with pagination and filters' })
  findAll(@Query() filters: StationFilterDto) {
    return this.stationsService.findAll(filters);
  }

  @Get('stats')
  @RequirePermissions('stations', 'read', 'national')
  @ApiOperation({ summary: 'Get station statistics' })
  getStats() {
    return this.stationsService.getStats();
  }

  @Get(':id')
  @RequirePermissions('stations', 'read', 'station')
  @ApiOperation({ summary: 'Get station by ID' })
  findById(@Param('id') id: string) {
    return this.stationsService.findById(id);
  }

  @Post()
  @RequirePermissions('stations', 'create', 'national')
  @ApiOperation({ summary: 'Create a new station' })
  create(@Body() dto: CreateStationDto, @CurrentUser('id') officerId: string) {
    return this.stationsService.create(dto, officerId);
  }

  @Patch(':id')
  @RequirePermissions('stations', 'update', 'station')
  @ApiOperation({ summary: 'Update station details' })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateStationDto>,
    @CurrentUser('id') officerId: string,
  ) {
    return this.stationsService.update(id, dto, officerId);
  }

  @Delete(':id')
  @RequirePermissions('stations', 'delete', 'national')
  @ApiOperation({ summary: 'Delete a station (must have no assigned officers)' })
  delete(@Param('id') id: string, @CurrentUser('id') officerId: string) {
    return this.stationsService.delete(id, officerId);
  }

  @Patch(':id/activate')
  @RequirePermissions('stations', 'update', 'national')
  @ApiOperation({ summary: 'Activate a station' })
  activate(@Param('id') id: string, @CurrentUser('id') officerId: string) {
    return this.stationsService.activate(id, officerId);
  }

  @Patch(':id/deactivate')
  @RequirePermissions('stations', 'update', 'national')
  @ApiOperation({ summary: 'Deactivate a station' })
  deactivate(@Param('id') id: string, @CurrentUser('id') officerId: string) {
    return this.stationsService.deactivate(id, officerId);
  }

  @Get(':id/officers')
  @RequirePermissions('officers', 'read', 'station')
  @ApiOperation({ summary: 'Get officers assigned to a station' })
  getStationOfficers(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.stationsService.getStationOfficers(
      id,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Get(':id/cases')
  @RequirePermissions('cases', 'read', 'station')
  @ApiOperation({ summary: 'Get cases from a station' })
  getStationCases(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.stationsService.getStationCases(
      id,
      Number(page) || 1,
      Number(limit) || 20,
      status,
    );
  }

  @Get(':id/vehicles')
  @RequirePermissions('cases', 'read', 'station')
  @ApiOperation({ summary: 'Get vehicles assigned to a station' })
  getStationVehicles(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.stationsService.getStationVehicles(
      id,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }
}
