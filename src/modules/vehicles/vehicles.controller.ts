import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleFilterDto } from './dto/vehicle-filter.dto';
import { ReportStolenDto } from './dto/report-stolen.dto';

@ApiTags('Vehicles')
@ApiBearerAuth()
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @RequirePermissions('alerts', 'read', 'station')
  @ApiOperation({ summary: 'List all vehicles with filters and pagination' })
  async findAll(@Query() filters: VehicleFilterDto) {
    return this.vehiclesService.findAll(filters);
  }

  @Get(':id')
  @RequirePermissions('alerts', 'read', 'station')
  @ApiOperation({ summary: 'Get vehicle by ID' })
  async findById(@Param('id') id: string) {
    return this.vehiclesService.findById(id);
  }

  @Get('plate/:licensePlate')
  @RequirePermissions('alerts', 'read', 'station')
  @ApiOperation({ summary: 'Get vehicle by license plate' })
  async findByLicensePlate(@Param('licensePlate') licensePlate: string) {
    return this.vehiclesService.findByLicensePlate(licensePlate);
  }

  @Post()
  @RequirePermissions('alerts', 'create', 'station')
  @ApiOperation({ summary: 'Register a new vehicle' })
  async create(
    @Body() data: CreateVehicleDto,
    @CurrentUser('id') officerId: string,
  ) {
    return this.vehiclesService.create(data, officerId);
  }

  @Patch(':id')
  @RequirePermissions('alerts', 'update', 'station')
  @ApiOperation({ summary: 'Update vehicle details' })
  async update(
    @Param('id') id: string,
    @Body() data: UpdateVehicleDto,
    @CurrentUser('id') officerId: string,
  ) {
    return this.vehiclesService.update(id, data, officerId);
  }

  @Post(':id/stolen')
  @RequirePermissions('alerts', 'create', 'station')
  @ApiOperation({ summary: 'Report a vehicle as stolen' })
  async reportStolen(
    @Param('id') id: string,
    @Body() dto: ReportStolenDto,
    @CurrentUser('id') officerId: string,
  ) {
    return this.vehiclesService.reportStolen(id, officerId, dto.notes);
  }

  @Post(':id/recovered')
  @RequirePermissions('alerts', 'update', 'station')
  @ApiOperation({ summary: 'Mark a stolen vehicle as recovered' })
  async markRecovered(
    @Param('id') id: string,
    @CurrentUser('id') officerId: string,
  ) {
    return this.vehiclesService.markRecovered(id, officerId);
  }

  @Post(':id/impounded')
  @RequirePermissions('alerts', 'update', 'station')
  @ApiOperation({ summary: 'Mark a vehicle as impounded' })
  async markImpounded(
    @Param('id') id: string,
    @CurrentUser('id') officerId: string,
  ) {
    return this.vehiclesService.markImpounded(id, officerId);
  }
}
