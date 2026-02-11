import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { AuditFilterDto } from './dto/audit-filter.dto';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions('audit', 'read', 'station')
  @ApiOperation({ summary: 'List audit logs with pagination and filters' })
  findAll(
    @Query() pagination: PaginationQueryDto,
    @Query() filters: AuditFilterDto,
  ) {
    return this.auditService.findAll(
      {
        entityType: filters.entityType,
        officerId: filters.officerId,
        action: filters.action,
        stationId: filters.stationId,
        success: filters.success,
        startDate: filters.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      },
      pagination,
    );
  }

  @Get(':id')
  @RequirePermissions('audit', 'read', 'station')
  @ApiOperation({ summary: 'Get audit log by ID' })
  findById(@Param('id') id: string) {
    return this.auditService.findById(id);
  }
}
