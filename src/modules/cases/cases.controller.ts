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
import { CasesService } from './cases.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CaseFilters } from './cases.repository';

@ApiTags('Cases')
@ApiBearerAuth()
@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Get()
  @RequirePermissions('cases', 'read', 'station')
  @ApiOperation({ summary: 'List cases with pagination and filters' })
  findAll(
    @Query() pagination: PaginationQueryDto,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('severity') severity?: string,
    @Query('stationId') stationId?: string,
    @Query('officerId') officerId?: string,
    @Query('search') search?: string,
  ) {
    const filters: CaseFilters = {
      status,
      category,
      severity,
      stationId,
      officerId,
      search,
    };
    return this.casesService.findAll(filters, pagination);
  }

  @Get(':id')
  @RequirePermissions('cases', 'read', 'station')
  @ApiOperation({ summary: 'Get case by ID with all relations' })
  findById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.casesService.findById(id, user.id);
  }

  @Post()
  @RequirePermissions('cases', 'create', 'station')
  @ApiOperation({ summary: 'Create a new case' })
  create(
    @Body()
    body: {
      title: string;
      description?: string;
      category: string;
      severity: string;
      incidentDate: string;
      location?: string;
      latitude?: number;
      longitude?: number;
      ward?: string;
      district?: string;
      stationId: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.casesService.create(
      {
        ...body,
        incidentDate: new Date(body.incidentDate),
      },
      user.id,
    );
  }

  @Patch(':id')
  @RequirePermissions('cases', 'update', 'station')
  @ApiOperation({ summary: 'Update case details' })
  update(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      title: string;
      description: string;
      category: string;
      severity: string;
      incidentDate: string;
      location: string;
      latitude: number;
      longitude: number;
      ward: string;
      district: string;
    }>,
    @CurrentUser() user: any,
  ) {
    const data: any = { ...body };
    if (body.incidentDate) {
      data.incidentDate = new Date(body.incidentDate);
    }
    return this.casesService.update(id, data, user.id);
  }

  @Patch(':id/status')
  @RequirePermissions('cases', 'update', 'station')
  @ApiOperation({ summary: 'Update case status with transition validation' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @CurrentUser() user: any,
  ) {
    return this.casesService.updateStatus(id, body.status, user.id);
  }

  @Post(':id/persons')
  @RequirePermissions('cases', 'update', 'station')
  @ApiOperation({ summary: 'Link a person to this case' })
  addPerson(
    @Param('id') id: string,
    @Body() body: { personId: string; role: string; statement?: string },
    @CurrentUser() user: any,
  ) {
    return this.casesService.addPerson(
      id,
      body.personId,
      body.role,
      user.id,
      body.statement,
    );
  }

  @Delete(':id/persons/:personId/:role')
  @RequirePermissions('cases', 'update', 'station')
  @ApiOperation({ summary: 'Unlink a person from this case' })
  removePerson(
    @Param('id') id: string,
    @Param('personId') personId: string,
    @Param('role') role: string,
    @CurrentUser() user: any,
  ) {
    return this.casesService.removePerson(id, personId, role, user.id);
  }

  @Post(':id/notes')
  @RequirePermissions('cases', 'update', 'station')
  @ApiOperation({ summary: 'Add a note to this case' })
  addNote(
    @Param('id') id: string,
    @Body() body: { content: string },
    @CurrentUser() user: any,
  ) {
    return this.casesService.addNote(id, user.id, body.content);
  }
}
