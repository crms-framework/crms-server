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
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AgencyService } from '../services/agency.service';
import { CreateAgencyDto, UpdateAgencyDto } from '../dto/create-agency.dto';
import { CreateWebhookDto } from '../dto/create-webhook.dto';

@ApiTags('Agencies (Admin)')
@ApiBearerAuth()
@Controller('agencies')
export class AgencyAdminController {
  constructor(private readonly agencyService: AgencyService) {}

  @Post()
  @RequirePermissions('agencies', 'create', 'national')
  @ApiOperation({ summary: 'Create a new agency with API key' })
  create(
    @Body() dto: CreateAgencyDto,
    @CurrentUser('id') officerId: string,
  ) {
    return this.agencyService.create(dto, officerId);
  }

  @Get()
  @RequirePermissions('agencies', 'read', 'national')
  @ApiOperation({ summary: 'List all agencies' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.agencyService.findAll(Number(page) || 1, Number(limit) || 20);
  }

  @Get(':id')
  @RequirePermissions('agencies', 'read', 'national')
  @ApiOperation({ summary: 'Get agency by ID' })
  findById(@Param('id') id: string) {
    return this.agencyService.findById(id);
  }

  @Patch(':id')
  @RequirePermissions('agencies', 'update', 'national')
  @ApiOperation({ summary: 'Update an agency' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAgencyDto,
    @CurrentUser('id') officerId: string,
  ) {
    return this.agencyService.update(id, dto, officerId);
  }

  @Post(':id/rotate-key')
  @RequirePermissions('agencies', 'update', 'national')
  @ApiOperation({ summary: 'Rotate agency API key' })
  rotateKey(
    @Param('id') id: string,
    @CurrentUser('id') officerId: string,
  ) {
    return this.agencyService.rotateApiKey(id, officerId);
  }

  @Post(':id/deactivate')
  @RequirePermissions('agencies', 'delete', 'national')
  @ApiOperation({ summary: 'Deactivate an agency' })
  deactivate(
    @Param('id') id: string,
    @CurrentUser('id') officerId: string,
  ) {
    return this.agencyService.deactivate(id, officerId);
  }

  // ==================== Webhooks ====================

  @Post(':id/webhooks')
  @RequirePermissions('agencies', 'update', 'national')
  @ApiOperation({ summary: 'Create a webhook for an agency' })
  createWebhook(
    @Param('id') agencyId: string,
    @Body() dto: CreateWebhookDto,
    @CurrentUser('id') officerId: string,
  ) {
    return this.agencyService.createWebhook(agencyId, dto, officerId);
  }

  @Get(':id/webhooks')
  @RequirePermissions('agencies', 'read', 'national')
  @ApiOperation({ summary: 'List webhooks for an agency' })
  findWebhooks(@Param('id') agencyId: string) {
    return this.agencyService.findWebhooks(agencyId);
  }

  @Delete(':id/webhooks/:webhookId')
  @RequirePermissions('agencies', 'delete', 'national')
  @ApiOperation({ summary: 'Delete a webhook' })
  deleteWebhook(
    @Param('webhookId') webhookId: string,
    @CurrentUser('id') officerId: string,
  ) {
    return this.agencyService.deleteWebhook(webhookId, officerId);
  }
}
