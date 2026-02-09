import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { RolesRepository } from './roles.repository';
import { CreateRoleDto, UpdateRoleDto } from './dto/create-role.dto';
import { AddPermissionsDto, RemovePermissionsDto } from './dto/manage-permissions.dto';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    private readonly rolesRepository: RolesRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll() {
    return this.rolesRepository.findAll();
  }

  async findById(id: string) {
    const role = await this.rolesRepository.findByIdWithPermissions(id);
    if (!role) {
      throw new NotFoundException(`Role not found: ${id}`);
    }
    return role;
  }

  async create(data: CreateRoleDto, officerId: string) {
    const existingName = await this.rolesRepository.findByName(data.name);
    if (existingName) {
      throw new ConflictException(`Role with name "${data.name}" already exists`);
    }

    const existingLevel = await this.rolesRepository.findByLevel(data.level);
    if (existingLevel) {
      throw new ConflictException(`Role with level ${data.level} already exists`);
    }

    const role = await this.rolesRepository.create(data);

    await this.logAudit(officerId, 'create', role.id, {
      name: role.name,
      level: role.level,
    });

    return role;
  }

  async update(id: string, data: UpdateRoleDto, officerId: string) {
    const existing = await this.rolesRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Role not found: ${id}`);
    }

    if (data.name && data.name !== existing.name) {
      const duplicate = await this.rolesRepository.findByName(data.name);
      if (duplicate) {
        throw new ConflictException(`Role with name "${data.name}" already exists`);
      }
    }

    if (data.level !== undefined && data.level !== existing.level) {
      const duplicate = await this.rolesRepository.findByLevel(data.level);
      if (duplicate) {
        throw new ConflictException(`Role with level ${data.level} already exists`);
      }
    }

    const role = await this.rolesRepository.update(id, data);

    await this.logAudit(officerId, 'update', id, {
      name: existing.name,
      changes: Object.keys(data),
    });

    return role;
  }

  async delete(id: string, officerId: string) {
    const existing = await this.rolesRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Role not found: ${id}`);
    }

    const officerCount = await this.prisma.officer.count({ where: { roleId: id } });
    if (officerCount > 0) {
      throw new BadRequestException(
        `Cannot delete role "${existing.name}" — ${officerCount} officer(s) are still assigned to it`,
      );
    }

    await this.rolesRepository.delete(id);

    await this.logAudit(officerId, 'delete', id, {
      name: existing.name,
      level: existing.level,
    });

    return { deleted: true };
  }

  async addPermissions(roleId: string, dto: AddPermissionsDto, officerId: string) {
    const role = await this.rolesRepository.findById(roleId);
    if (!role) {
      throw new NotFoundException(`Role not found: ${roleId}`);
    }

    const result = await this.rolesRepository.addPermissions(roleId, dto.permissionIds);

    await this.logAudit(officerId, 'add_permissions', roleId, {
      roleName: role.name,
      permissionIds: dto.permissionIds,
    });

    return result;
  }

  async removePermissions(roleId: string, dto: RemovePermissionsDto, officerId: string) {
    const role = await this.rolesRepository.findById(roleId);
    if (!role) {
      throw new NotFoundException(`Role not found: ${roleId}`);
    }

    const result = await this.rolesRepository.removePermissions(roleId, dto.permissionIds);

    await this.logAudit(officerId, 'remove_permissions', roleId, {
      roleName: role.name,
      permissionIds: dto.permissionIds,
    });

    return result;
  }

  async replacePermissions(roleId: string, permissionIds: string[], officerId: string) {
    const role = await this.rolesRepository.findByIdWithPermissions(roleId);
    if (!role) {
      throw new NotFoundException(`Role not found: ${roleId}`);
    }

    const currentIds = role.permissions.map((p: any) => p.id);
    if (currentIds.length > 0) {
      await this.rolesRepository.removePermissions(roleId, currentIds);
    }
    if (permissionIds.length > 0) {
      await this.rolesRepository.addPermissions(roleId, permissionIds);
    }

    const updated = await this.rolesRepository.findByIdWithPermissions(roleId);

    await this.logAudit(officerId, 'replace_permissions', roleId, {
      roleName: role.name,
      previousCount: currentIds.length,
      newCount: permissionIds.length,
    });

    return updated;
  }

  async getPermissions(roleId: string) {
    const role = await this.rolesRepository.findById(roleId);
    if (!role) {
      throw new NotFoundException(`Role not found: ${roleId}`);
    }
    return this.rolesRepository.getPermissions(roleId);
  }

  async cloneRole(sourceRoleId: string, newName: string, officerId: string) {
    const source = await this.rolesRepository.findByIdWithPermissions(sourceRoleId);
    if (!source) {
      throw new NotFoundException(`Source role not found: ${sourceRoleId}`);
    }

    const existingName = await this.rolesRepository.findByName(newName);
    if (existingName) {
      throw new ConflictException(`Role with name "${newName}" already exists`);
    }

    const allRoles = await this.rolesRepository.findAll();
    const usedLevels = new Set(allRoles.map((r: any) => r.level));
    let newLevel = source.level + 1;
    while (usedLevels.has(newLevel)) {
      newLevel++;
    }

    const cloned = await this.rolesRepository.create({
      name: newName,
      description: `Cloned from ${source.name}`,
      level: newLevel,
    });

    const permissionIds = source.permissions.map((p: any) => p.id);
    if (permissionIds.length > 0) {
      await this.rolesRepository.addPermissions(cloned.id, permissionIds);
    }

    const result = await this.rolesRepository.findByIdWithPermissions(cloned.id);

    await this.logAudit(officerId, 'clone_role', cloned.id, {
      sourceRoleId,
      sourceName: source.name,
      clonedName: newName,
      permissionCount: permissionIds.length,
    });

    return result;
  }

  private async logAudit(
    officerId: string,
    action: string,
    entityId: string,
    details: Record<string, any>,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          entityType: 'role',
          entityId,
          officerId,
          action,
          success: true,
          details,
        },
      });
    } catch (err) {
      this.logger.error('Audit log write failed', err);
    }
  }
}
