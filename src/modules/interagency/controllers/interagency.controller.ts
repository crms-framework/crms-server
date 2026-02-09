import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { ApiKeyAuthGuard } from '../guards/api-key-auth.guard';
import { InteragencyAuditInterceptor } from '../interceptors/interagency-audit.interceptor';
import { CurrentAgency } from '../decorators/current-agency.decorator';
import { InteragencyService } from '../services/interagency.service';
import { WarrantRequestDto } from '../dto/interagency-request.dto';
import { FlagRequestDto } from '../dto/interagency-request.dto';

@ApiTags('Inter-Agency Data Sharing')
@ApiSecurity('api-key')
@Controller('interagency')
@Public()
@UseGuards(ApiKeyAuthGuard)
@UseInterceptors(InteragencyAuditInterceptor)
export class InteragencyController {
  constructor(private readonly interagencyService: InteragencyService) {}

  @Get('cases/:caseNumber/status')
  @ApiOperation({ summary: 'Get case status (external agency)' })
  getCaseStatus(
    @Param('caseNumber') caseNumber: string,
    @CurrentAgency() agency: any,
  ) {
    return this.interagencyService.getCaseStatus(caseNumber, agency);
  }

  @Get('persons/:nationalId')
  @ApiOperation({ summary: 'Lookup person by national ID (external agency)' })
  lookupPerson(
    @Param('nationalId') nationalId: string,
    @CurrentAgency() agency: any,
  ) {
    return this.interagencyService.lookupPerson(nationalId, agency);
  }

  @Post('warrants')
  @ApiOperation({ summary: 'Issue/update/revoke a warrant (external agency)' })
  issueWarrant(
    @Body() dto: WarrantRequestDto,
    @CurrentAgency() agency: any,
  ) {
    return this.interagencyService.issueWarrant(dto, agency);
  }

  @Get('inmates/:nationalId')
  @ApiOperation({ summary: 'Get inmate status (external agency)' })
  getInmateStatus(
    @Param('nationalId') nationalId: string,
    @CurrentAgency() agency: any,
  ) {
    return this.interagencyService.getInmateStatus(nationalId, agency);
  }

  @Post('flags')
  @ApiOperation({ summary: 'Flag a person (travel ban/watchlist/hold)' })
  flagPerson(
    @Body() dto: FlagRequestDto,
    @CurrentAgency() agency: any,
  ) {
    return this.interagencyService.flagPerson(dto, agency);
  }
}
