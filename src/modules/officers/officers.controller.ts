import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { OfficersService } from './officers.service';
import { CreateOfficerDto } from './dto/create-officer.dto';
import { UpdateOfficerDto } from './dto/update-officer.dto';
import { OfficerFilterDto } from './dto/officer-filter.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Officers')
@ApiBearerAuth()
@Controller('officers')
export class OfficersController {
  constructor(private readonly officersService: OfficersService) {}

  @Get()
  @RequirePermissions('officers', 'read', 'station')
  @ApiOperation({ summary: 'List officers (paginated, filterable)' })
  @ApiResponse({ status: 200, description: 'Paginated list of officers' })
  async findAll(@Query() query: OfficerFilterDto) {
    const { page, limit, search, stationId, roleId, active } = query;
    return this.officersService.findAll(
      { search, stationId, roleId, active },
      page,
      limit,
    );
  }

  @Get(':id')
  @RequirePermissions('officers', 'read', 'station')
  @ApiOperation({ summary: 'Get officer by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Officer details' })
  @ApiResponse({ status: 404, description: 'Officer not found' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.officersService.findById(id);
  }

  @Post()
  @RequirePermissions('officers', 'create', 'station')
  @ApiOperation({ summary: 'Create a new officer' })
  @ApiResponse({ status: 201, description: 'Officer created successfully' })
  @ApiResponse({ status: 409, description: 'Badge already in use' })
  async create(
    @Body() dto: CreateOfficerDto,
    @CurrentUser() user: any,
  ) {
    const { firstName, lastName, ...rest } = dto as any;
    return this.officersService.create(
      { ...rest, name: `${firstName} ${lastName}`.trim() },
      user.sub,
    );
  }

  @Patch(':id')
  @RequirePermissions('officers', 'update', 'station')
  @ApiOperation({ summary: 'Update an officer' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Officer updated successfully' })
  @ApiResponse({ status: 404, description: 'Officer not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOfficerDto,
    @CurrentUser() user: any,
  ) {
    return this.officersService.update(id, dto, user.sub);
  }

  @Patch(':id/deactivate')
  @RequirePermissions('officers', 'update', 'station')
  @ApiOperation({ summary: 'Deactivate an officer' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Officer deactivated' })
  @ApiResponse({ status: 404, description: 'Officer not found' })
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.officersService.deactivate(id, user.sub);
  }

  @Patch(':id/activate')
  @RequirePermissions('officers', 'update', 'station')
  @ApiOperation({ summary: 'Activate an officer' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Officer activated' })
  @ApiResponse({ status: 404, description: 'Officer not found' })
  async activate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.officersService.activate(id, user.sub);
  }
}
