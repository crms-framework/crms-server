import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UssdService } from './ussd.service';
import { UssdCallbackDto } from './dto/ussd-callback.dto';

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
}
