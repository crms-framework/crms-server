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
import { EvidenceService } from './evidence.service';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { UpdateEvidenceDto } from './dto/update-evidence.dto';
import { EvidenceFilterDto } from './dto/evidence-filter.dto';
import { CustodyEventDto } from './dto/custody-event.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@ApiTags('Evidence')
@ApiBearerAuth()
@Controller('evidence')
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Get()
  @RequirePermissions('evidence', 'read', 'station')
  @ApiOperation({ summary: 'List evidence with pagination and filters' })
  findAll(@Query() filters: EvidenceFilterDto) {
    const pagination = new PaginationQueryDto();
    pagination.page = filters.page;
    pagination.limit = filters.limit;
    pagination.sortBy = filters.sortBy;
    pagination.sortOrder = filters.sortOrder;
    return this.evidenceService.findAll(
      {
        caseId: filters.caseId,
        type: filters.type,
        status: filters.status,
        stationId: filters.stationId,
        isSealed: filters.isSealed,
        search: filters.search,
      },
      pagination,
    );
  }

  @Get('stats')
  @RequirePermissions('evidence', 'read', 'station')
  @ApiOperation({ summary: 'Get evidence statistics' })
  getStats(@Query('stationId') stationId?: string) {
    return this.evidenceService.getStats(stationId);
  }

  @Get('qr/:qrCode')
  @RequirePermissions('evidence', 'read', 'station')
  @ApiOperation({ summary: 'Find evidence by QR code' })
  findByQrCode(@Param('qrCode') qrCode: string) {
    return this.evidenceService.findByQrCode(qrCode);
  }

  @Get('case/:caseId')
  @RequirePermissions('evidence', 'read', 'station')
  @ApiOperation({ summary: 'Get all evidence linked to a case' })
  findByCase(@Param('caseId') caseId: string) {
    return this.evidenceService.findByCase(caseId);
  }

  @Get(':id')
  @RequirePermissions('evidence', 'read', 'station')
  @ApiOperation({ summary: 'Get evidence by ID' })
  findById(@Param('id') id: string, @CurrentUser('id') officerId: string) {
    return this.evidenceService.findById(id, officerId);
  }

  @Post()
  @RequirePermissions('evidence', 'create', 'station')
  @ApiOperation({ summary: 'Create new evidence and link to a case' })
  create(@Body() dto: CreateEvidenceDto, @CurrentUser() user: any) {
    return this.evidenceService.create(dto, user.id, user.stationId);
  }

  @Patch(':id')
  @RequirePermissions('evidence', 'update', 'station')
  @ApiOperation({ summary: 'Update evidence details (not sealed)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEvidenceDto,
    @CurrentUser('id') officerId: string,
  ) {
    return this.evidenceService.update(id, dto, officerId);
  }

  @Delete(':id')
  @RequirePermissions('evidence', 'delete', 'station')
  @ApiOperation({ summary: 'Delete evidence (not sealed)' })
  delete(@Param('id') id: string, @CurrentUser('id') officerId: string) {
    return this.evidenceService.delete(id, officerId);
  }

  @Patch(':id/status')
  @RequirePermissions('evidence', 'update', 'station')
  @ApiOperation({ summary: 'Update evidence status with transition validation' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @CurrentUser('id') officerId: string,
  ) {
    return this.evidenceService.updateStatus(id, body.status, officerId);
  }

  @Post(':id/custody')
  @RequirePermissions('evidence', 'update', 'station')
  @ApiOperation({ summary: 'Add a chain of custody event' })
  addCustodyEvent(
    @Param('id') id: string,
    @Body() dto: CustodyEventDto,
    @CurrentUser('id') officerId: string,
  ) {
    return this.evidenceService.addCustodyEvent(id, dto, officerId);
  }

  @Post(':id/seal')
  @RequirePermissions('evidence', 'update', 'station')
  @ApiOperation({ summary: 'Seal evidence (makes it immutable)' })
  seal(@Param('id') id: string, @CurrentUser('id') officerId: string) {
    return this.evidenceService.seal(id, officerId);
  }

  @Post(':id/cases')
  @RequirePermissions('evidence', 'update', 'station')
  @ApiOperation({ summary: 'Link evidence to an additional case' })
  linkToCase(
    @Param('id') id: string,
    @Body() body: { caseId: string },
    @CurrentUser('id') officerId: string,
  ) {
    return this.evidenceService.linkToCase(id, body.caseId, officerId);
  }
}
