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
import { IntegrityService } from './integrity.service';
import { CreateIntegrityReportDto } from './dto/create-integrity-report.dto';
import { UpdateIntegrityReportDto } from './dto/update-integrity-report.dto';
import { IntegrityFilterDto } from './dto/integrity-filter.dto';

@ApiTags('Integrity')
@ApiBearerAuth()
@Controller('integrity')
export class IntegrityController {
  constructor(private readonly integrityService: IntegrityService) {}

  @Post('report')
  @RequirePermissions('integrity', 'create', 'own')
  @ApiOperation({ summary: 'Submit an anonymous integrity report' })
  createReport(@Body() dto: CreateIntegrityReportDto) {
    // Officer is authenticated but their ID is NOT passed to the service
    return this.integrityService.createReport(dto);
  }

  @Get('report/token/:token')
  @RequirePermissions('integrity', 'create', 'own')
  @ApiOperation({ summary: 'Check report status by anonymous token' })
  findByToken(@Param('token') token: string) {
    return this.integrityService.findByToken(token);
  }

  @Get('reports')
  @RequirePermissions('integrity', 'read', 'national')
  @ApiOperation({ summary: 'List all integrity reports (Professional Standards)' })
  findAll(@Query() filters: IntegrityFilterDto) {
    return this.integrityService.findAll(filters);
  }

  @Get('reports/:id')
  @RequirePermissions('integrity', 'read', 'national')
  @ApiOperation({ summary: 'Get integrity report details' })
  findById(@Param('id') id: string) {
    return this.integrityService.findById(id);
  }

  @Patch('reports/:id')
  @RequirePermissions('integrity', 'update', 'national')
  @ApiOperation({ summary: 'Update integrity report status/assignment/resolution' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateIntegrityReportDto,
    @CurrentUser('id') officerId: string,
  ) {
    return this.integrityService.update(id, dto, officerId);
  }
}
