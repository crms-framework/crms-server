import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UssdService } from './ussd.service';
import { UssdCallbackDto } from './dto/ussd-callback.dto';
import {
  UssdOfficerFilterDto,
  PaginatedUssdOfficersDto,
  UssdOfficerDetailDto,
} from './dto/ussd-officer.dto';
import {
  UpdateUssdAccessDto,
  UpdateUssdAccessResponseDto,
} from './dto/update-ussd-access.dto';
import {
  ResetQuickPinDto,
  ResetQuickPinResponseDto,
} from './dto/reset-quick-pin.dto';

@ApiTags('USSD')
@Controller('ussd')
export class UssdController {
  constructor(private readonly ussdService: UssdService) {}

  @Post('callback')
  @Public()
  @ApiOperation({ summary: 'USSD callback endpoint for telecom gateway (public)' })
  handleCallback(@Body() dto: UssdCallbackDto) {
    return this.ussdService.handleCallback(
      dto.sessionId,
      dto.phoneNumber,
      dto.text,
    );
  }

  @Post('register')
  @ApiBearerAuth()
  @RequirePermissions('officers', 'update', 'own')
  @ApiOperation({ summary: 'Register officer for USSD access' })
  register(
    @Body() body: { phoneNumber: string; quickPin: string },
    @CurrentUser('id') officerId: string,
  ) {
    return this.ussdService.registerOfficer(officerId, body.phoneNumber, body.quickPin);
  }

  @Get('logs')
  @ApiBearerAuth()
  @RequirePermissions('reports', 'read', 'station')
  @ApiOperation({ summary: 'Get USSD query logs' })
  getLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ussdService.getLogs(Number(page) || 1, Number(limit) || 20);
  }

  @Get('logs/:officerId')
  @ApiBearerAuth()
  @RequirePermissions('reports', 'read', 'station')
  @ApiOperation({ summary: 'Get USSD query logs for a specific officer' })
  getOfficerLogs(
    @Param('officerId') officerId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ussdService.getOfficerLogs(
      officerId,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Get('officers')
  @ApiBearerAuth()
  @RequirePermissions('officers', 'read', 'station')
  @ApiOperation({ summary: 'List officers with USSD status' })
  @ApiResponse({ status: 200, type: PaginatedUssdOfficersDto })
  getOfficersWithUssdStatus(@Query() filters: UssdOfficerFilterDto) {
    return this.ussdService.getOfficersWithUssdStatus(filters);
  }

  @Get('officers/:id')
  @ApiBearerAuth()
  @RequirePermissions('officers', 'read', 'station')
  @ApiOperation({ summary: 'Get officer USSD details' })
  @ApiResponse({ status: 200, type: UssdOfficerDetailDto })
  getOfficerUssdDetails(@Param('id') id: string) {
    return this.ussdService.getOfficerUssdDetails(id);
  }

  @Patch('officers/:id')
  @ApiBearerAuth()
  @RequirePermissions('officers', 'update', 'station')
  @ApiOperation({ summary: 'Enable or disable USSD access for an officer' })
  @ApiResponse({ status: 200, type: UpdateUssdAccessResponseDto })
  updateUssdAccess(@Param('id') id: string, @Body() dto: UpdateUssdAccessDto) {
    return this.ussdService.updateUssdAccess(id, dto);
  }

  @Post('officers/:id/reset-pin')
  @ApiBearerAuth()
  @RequirePermissions('officers', 'update', 'station')
  @ApiOperation({ summary: 'Reset officer Quick PIN for USSD' })
  @ApiResponse({ status: 200, type: ResetQuickPinResponseDto })
  resetQuickPin(@Param('id') id: string, @Body() dto: ResetQuickPinDto) {
    return this.ussdService.resetOfficerQuickPin(id, dto);
  }

  @Get('logs/:officerId/export')
  @ApiBearerAuth()
  @RequirePermissions('reports', 'read', 'station')
  @ApiOperation({ summary: 'Export officer USSD logs as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file download' })
  async exportOfficerLogs(
    @Param('officerId') officerId: string,
    @Res() res: Response,
  ) {
    const csv = await this.ussdService.exportOfficerLogsAsCsv(officerId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ussd-logs-${officerId}-${new Date().toISOString().split('T')[0]}.csv"`,
    );
    res.status(HttpStatus.OK).send(csv);
  }
}
