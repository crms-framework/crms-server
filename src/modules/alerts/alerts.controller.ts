import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AlertsService } from './alerts.service';
import { PosterService } from './poster/poster.service';

@ApiTags('Alerts')
@ApiBearerAuth()
@Controller('alerts')
export class AlertsController {
  constructor(
    private readonly alertsService: AlertsService,
    private readonly posterService: PosterService,
  ) {}

  @Get('active')
  @RequirePermissions('alerts', 'read', 'station')
  @ApiOperation({ summary: 'Get all active alerts (amber + wanted)' })
  getActiveAlerts() {
    return this.alertsService.getActiveAlerts();
  }

  @Get('stats')
  @RequirePermissions('alerts', 'read', 'station')
  @ApiOperation({ summary: 'Get alert statistics' })
  getStats() {
    return this.alertsService.getStats();
  }

  // ==================== Amber Alerts ====================

  @Get('amber')
  @RequirePermissions('alerts', 'read', 'station')
  @ApiOperation({ summary: 'List amber alerts' })
  findAllAmberAlerts(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.alertsService.findAllAmberAlerts(
      { status, search },
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Get('amber/:id')
  @RequirePermissions('alerts', 'read', 'station')
  @ApiOperation({ summary: 'Get amber alert by ID' })
  findAmberAlertById(@Param('id') id: string) {
    return this.alertsService.findAmberAlertById(id);
  }

  @Post('amber')
  @RequirePermissions('alerts', 'create', 'station')
  @ApiOperation({ summary: 'Create a new amber alert (child under 18)' })
  createAmberAlert(
    @Body()
    body: {
      personName: string;
      age?: number;
      gender?: string;
      description: string;
      lastSeenLocation?: string;
      lastSeenDate?: string;
      contactPhone: string;
      photoUrl?: string;
    },
    @CurrentUser('id') officerId: string,
  ) {
    return this.alertsService.createAmberAlert(body, officerId);
  }

  @Patch('amber/:id')
  @RequirePermissions('alerts', 'update', 'station')
  @ApiOperation({ summary: 'Update an amber alert' })
  updateAmberAlert(
    @Param('id') id: string,
    @Body() body: Record<string, any>,
    @CurrentUser('id') officerId: string,
  ) {
    return this.alertsService.updateAmberAlert(id, body, officerId);
  }

  @Post('amber/:id/resolve')
  @RequirePermissions('alerts', 'update', 'station')
  @ApiOperation({ summary: 'Resolve an amber alert (child found)' })
  resolveAmberAlert(
    @Param('id') id: string,
    @CurrentUser('id') officerId: string,
  ) {
    return this.alertsService.resolveAmberAlert(id, officerId);
  }

  @Get('amber/:id/poster')
  @RequirePermissions('alerts', 'read', 'station')
  @ApiOperation({ summary: 'Generate amber alert poster (PDF or image)' })
  async getAmberAlertPoster(
    @Param('id') id: string,
    @Query('format') format: string = 'pdf',
    @CurrentUser('id') officerId: string,
    @Res() res: Response,
  ) {
    const validFormat = this.posterService.validateFormat(format);
    const result = await this.posterService.generateAmberAlertPoster(
      id,
      validFormat,
      officerId,
    );

    res.setHeader('Content-Type', result.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );
    res.setHeader('Content-Length', result.size);
    res.setHeader('Cache-Control', 'no-cache');
    res.send(result.buffer);
  }

  // ==================== Wanted Persons ====================

  @Get('wanted')
  @RequirePermissions('alerts', 'read', 'station')
  @ApiOperation({ summary: 'List wanted persons' })
  findAllWantedPersons(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.alertsService.findAllWantedPersons(
      { status, search },
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Get('wanted/:id')
  @RequirePermissions('alerts', 'read', 'station')
  @ApiOperation({ summary: 'Get wanted person by ID' })
  findWantedPersonById(@Param('id') id: string) {
    return this.alertsService.findWantedPersonById(id);
  }

  @Post('wanted')
  @RequirePermissions('alerts', 'create', 'station')
  @ApiOperation({ summary: 'Create a new wanted person record' })
  createWantedPerson(
    @Body()
    body: {
      personId?: string;
      name: string;
      aliases?: string[];
      charges: string[];
      description?: string;
      reward?: number;
      dangerLevel?: string;
      warrantNumber?: string;
      lastSeenLocation?: string;
      lastSeenDate?: string;
      photoUrl?: string;
    },
    @CurrentUser('id') officerId: string,
  ) {
    return this.alertsService.createWantedPerson(body, officerId);
  }

  @Patch('wanted/:id')
  @RequirePermissions('alerts', 'update', 'station')
  @ApiOperation({ summary: 'Update a wanted person record' })
  updateWantedPerson(
    @Param('id') id: string,
    @Body() body: Record<string, any>,
    @CurrentUser('id') officerId: string,
  ) {
    return this.alertsService.updateWantedPerson(id, body, officerId);
  }

  @Post('wanted/:id/capture')
  @RequirePermissions('alerts', 'update', 'station')
  @ApiOperation({ summary: 'Mark a wanted person as captured' })
  captureWantedPerson(
    @Param('id') id: string,
    @Body() body: { capturedLocation?: string },
    @CurrentUser('id') officerId: string,
  ) {
    return this.alertsService.captureWantedPerson(id, body.capturedLocation, officerId);
  }

  @Get('wanted/:id/poster')
  @RequirePermissions('alerts', 'read', 'station')
  @ApiOperation({ summary: 'Generate wanted person poster (PDF or image)' })
  async getWantedPersonPoster(
    @Param('id') id: string,
    @Query('format') format: string = 'pdf',
    @CurrentUser('id') officerId: string,
    @Res() res: Response,
  ) {
    const validFormat = this.posterService.validateFormat(format);
    const result = await this.posterService.generateWantedPoster(
      id,
      validFormat,
      officerId,
    );

    res.setHeader('Content-Type', result.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );
    res.setHeader('Content-Length', result.size);
    res.setHeader('Cache-Control', 'no-cache');
    res.send(result.buffer);
  }
}
