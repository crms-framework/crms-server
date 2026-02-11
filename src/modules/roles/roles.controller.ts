import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/create-role.dto';
import { AddPermissionsDto, RemovePermissionsDto } from './dto/manage-permissions.dto';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions('roles', 'read', 'station')
  @ApiOperation({ summary: 'List all roles' })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('roles', 'read', 'station')
  @ApiOperation({ summary: 'Get role by ID with permissions' })
  findById(@Param('id') id: string) {
    return this.rolesService.findById(id);
  }

  @Post()
  @RequirePermissions('roles', 'create', 'national')
  @ApiOperation({ summary: 'Create a new role' })
  create(@Body() dto: CreateRoleDto, @CurrentUser('id') officerId: string) {
    return this.rolesService.create(dto, officerId);
  }

  @Patch(':id')
  @RequirePermissions('roles', 'update', 'national')
  @ApiOperation({ summary: 'Update role details' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser('id') officerId: string,
  ) {
    return this.rolesService.update(id, dto, officerId);
  }

  @Delete(':id')
  @RequirePermissions('roles', 'delete', 'national')
  @ApiOperation({ summary: 'Delete a role (must have no assigned officers)' })
  delete(@Param('id') id: string, @CurrentUser('id') officerId: string) {
    return this.rolesService.delete(id, officerId);
  }

  @Post(':id/permissions')
  @RequirePermissions('roles', 'update', 'national')
  @ApiOperation({ summary: 'Add permissions to a role' })
  addPermissions(
    @Param('id') id: string,
    @Body() dto: AddPermissionsDto,
    @CurrentUser('id') officerId: string,
  ) {
    return this.rolesService.addPermissions(id, dto, officerId);
  }

  @Delete(':id/permissions')
  @RequirePermissions('roles', 'update', 'national')
  @ApiOperation({ summary: 'Remove permissions from a role' })
  removePermissions(
    @Param('id') id: string,
    @Body() dto: RemovePermissionsDto,
    @CurrentUser('id') officerId: string,
  ) {
    return this.rolesService.removePermissions(id, dto, officerId);
  }

  @Put(':id/permissions')
  @RequirePermissions('roles', 'update', 'national')
  @ApiOperation({ summary: 'Replace all permissions on a role' })
  replacePermissions(
    @Param('id') id: string,
    @Body() dto: AddPermissionsDto,
    @CurrentUser('id') officerId: string,
  ) {
    return this.rolesService.replacePermissions(id, dto.permissionIds, officerId);
  }

  @Post(':id/clone')
  @RequirePermissions('roles', 'create', 'national')
  @ApiOperation({ summary: 'Clone a role with all its permissions' })
  cloneRole(
    @Param('id') id: string,
    @Body() body: { name: string },
    @CurrentUser('id') officerId: string,
  ) {
    return this.rolesService.cloneRole(id, body.name, officerId);
  }
}
