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
import { PersonsService } from './persons.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { PersonFilterDto } from './dto/person-filter.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@ApiTags('Persons')
@ApiBearerAuth()
@Controller('persons')
export class PersonsController {
  constructor(private readonly personsService: PersonsService) {}

  @Get()
  @RequirePermissions('persons', 'read', 'station')
  @ApiOperation({ summary: 'List persons with pagination and filters' })
  findAll(@Query() filters: PersonFilterDto) {
    const pagination = new PaginationQueryDto();
    pagination.page = filters.page;
    pagination.limit = filters.limit;
    pagination.sortBy = filters.sortBy;
    pagination.sortOrder = filters.sortOrder;
    return this.personsService.findAll(
      {
        gender: filters.gender,
        isWanted: filters.isWanted,
        riskLevel: filters.riskLevel,
        search: filters.search,
      },
      pagination,
    );
  }

  @Get('wanted')
  @RequirePermissions('persons', 'read', 'station')
  @ApiOperation({ summary: 'List wanted persons' })
  getWanted(@Query() pagination: PaginationQueryDto) {
    return this.personsService.getWantedPersons(pagination);
  }

  @Get('high-risk')
  @RequirePermissions('persons', 'read', 'station')
  @ApiOperation({ summary: 'List high-risk persons' })
  getHighRisk(@Query() pagination: PaginationQueryDto) {
    return this.personsService.getHighRiskPersons(pagination);
  }

  @Get('stats')
  @RequirePermissions('persons', 'read', 'station')
  @ApiOperation({ summary: 'Get person statistics' })
  getStats() {
    return this.personsService.getStats();
  }

  @Get('nin/:nin')
  @RequirePermissions('persons', 'read', 'station')
  @ApiOperation({ summary: 'Find person by National ID' })
  findByNationalId(@Param('nin') nin: string, @CurrentUser('id') officerId: string) {
    return this.personsService.findByNationalId(nin, officerId);
  }

  @Get('fingerprint/:hash')
  @RequirePermissions('persons', 'read', 'station')
  @ApiOperation({ summary: 'Find person by fingerprint hash' })
  findByFingerprint(@Param('hash') hash: string, @CurrentUser('id') officerId: string) {
    return this.personsService.findByFingerprint(hash, officerId);
  }

  @Get(':id')
  @RequirePermissions('persons', 'read', 'station')
  @ApiOperation({ summary: 'Get person by ID with case relations' })
  findById(@Param('id') id: string, @CurrentUser('id') officerId: string) {
    return this.personsService.findById(id, officerId);
  }

  @Post()
  @RequirePermissions('persons', 'create', 'station')
  @ApiOperation({ summary: 'Create a new person record' })
  create(@Body() dto: CreatePersonDto, @CurrentUser('id') officerId: string) {
    const data: any = { ...dto };
    if (dto.dateOfBirth) {
      data.dob = new Date(dto.dateOfBirth);
      delete data.dateOfBirth;
    }
    if (dto.nin) {
      data.nationalId = dto.nin;
      delete data.nin;
    }
    return this.personsService.create(data, officerId);
  }

  @Patch(':id')
  @RequirePermissions('persons', 'update', 'station')
  @ApiOperation({ summary: 'Update person details' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePersonDto,
    @CurrentUser('id') officerId: string,
  ) {
    const data: any = { ...dto };
    if (dto.dateOfBirth) {
      data.dob = new Date(dto.dateOfBirth);
      delete data.dateOfBirth;
    }
    if (dto.nin) {
      data.nationalId = dto.nin;
      delete data.nin;
    }
    return this.personsService.update(id, data, officerId);
  }

  @Delete(':id')
  @RequirePermissions('persons', 'delete', 'station')
  @ApiOperation({ summary: 'Delete a person record' })
  delete(@Param('id') id: string, @CurrentUser('id') officerId: string) {
    return this.personsService.delete(id, officerId);
  }

  @Patch(':id/wanted')
  @RequirePermissions('persons', 'update', 'station')
  @ApiOperation({ summary: 'Update wanted status' })
  updateWantedStatus(
    @Param('id') id: string,
    @Body() body: { isWanted: boolean },
    @CurrentUser('id') officerId: string,
  ) {
    return this.personsService.updateWantedStatus(id, body.isWanted, officerId);
  }

  @Patch(':id/risk-level')
  @RequirePermissions('persons', 'update', 'station')
  @ApiOperation({ summary: 'Update risk level' })
  updateRiskLevel(
    @Param('id') id: string,
    @Body() body: { riskLevel: string },
    @CurrentUser('id') officerId: string,
  ) {
    return this.personsService.updateRiskLevel(id, body.riskLevel, officerId);
  }

  @Post(':id/aliases')
  @RequirePermissions('persons', 'update', 'station')
  @ApiOperation({ summary: 'Add an alias to a person' })
  addAlias(
    @Param('id') id: string,
    @Body() body: { alias: string },
    @CurrentUser('id') officerId: string,
  ) {
    return this.personsService.addAlias(id, body.alias, officerId);
  }

  @Delete(':id/aliases')
  @RequirePermissions('persons', 'update', 'station')
  @ApiOperation({ summary: 'Remove an alias from a person' })
  removeAlias(
    @Param('id') id: string,
    @Body() body: { alias: string },
    @CurrentUser('id') officerId: string,
  ) {
    return this.personsService.removeAlias(id, body.alias, officerId);
  }
}
