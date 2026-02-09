import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { InteragencyService } from '../services/interagency.service';
import { InteragencyRequestFilterDto } from '../dto/interagency-request.dto';

@ApiTags('Inter-Agency Admin')
@ApiBearerAuth()
@Controller('interagency')
export class InteragencyAdminController {
  constructor(private readonly interagencyService: InteragencyService) {}

  @Get('requests')
  @RequirePermissions('agencies', 'read', 'national')
  @ApiOperation({ summary: 'View interagency request audit log' })
  getRequestAuditLog(@Query() filters: InteragencyRequestFilterDto) {
    return this.interagencyService.getRequestAuditLog(filters);
  }
}
