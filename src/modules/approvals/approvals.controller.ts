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
import { ApprovalsService } from './approvals.service';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { RejectApprovalDto } from './dto/reject-approval.dto';
import { ApprovalFilterDto } from './dto/approval-filter.dto';

@ApiTags('Approvals')
@ApiBearerAuth()
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Post()
  @RequirePermissions('approvals', 'create', 'national')
  @ApiOperation({ summary: 'Request a new approval (SuperAdmin only)' })
  create(
    @Body() dto: CreateApprovalDto,
    @CurrentUser('id') officerId: string,
  ) {
    return this.approvalsService.create(dto, officerId);
  }

  @Get()
  @RequirePermissions('approvals', 'read', 'national')
  @ApiOperation({ summary: 'List approvals with optional filters' })
  findAll(@Query() filters: ApprovalFilterDto) {
    return this.approvalsService.findAll(filters);
  }

  @Get(':id')
  @RequirePermissions('approvals', 'read', 'national')
  @ApiOperation({ summary: 'Get approval details' })
  findById(@Param('id') id: string) {
    return this.approvalsService.findById(id);
  }

  @Patch(':id/approve')
  @RequirePermissions('approvals', 'update', 'national')
  @ApiOperation({ summary: 'Approve a pending request (must be different SuperAdmin)' })
  approve(
    @Param('id') id: string,
    @CurrentUser('id') officerId: string,
  ) {
    return this.approvalsService.approve(id, officerId);
  }

  @Patch(':id/reject')
  @RequirePermissions('approvals', 'update', 'national')
  @ApiOperation({ summary: 'Reject a pending request with reason' })
  reject(
    @Param('id') id: string,
    @Body() dto: RejectApprovalDto,
    @CurrentUser('id') officerId: string,
  ) {
    return this.approvalsService.reject(id, officerId, dto.reason);
  }
}
