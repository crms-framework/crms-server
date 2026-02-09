import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class RolesRepository {
  private readonly logger = new Logger(RolesRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.role.findUnique({ where: { id } });
  }

  async findByName(name: string) {
    return this.prisma.role.findUnique({ where: { name } });
  }

  async findByLevel(level: number) {
    return this.prisma.role.findUnique({ where: { level } });
  }

  async findAll() {
    return this.prisma.role.findMany({
      orderBy: { level: 'asc' },
    });
  }

  async findByIdWithPermissions(id: string) {
    return this.prisma.role.findUnique({
      where: { id },
      include: { permissions: true },
    });
  }

  async create(data: { name: string; description?: string; level: number }) {
    return this.prisma.role.create({ data });
  }

  async update(id: string, data: { name?: string; description?: string; level?: number }) {
    return this.prisma.role.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.role.delete({ where: { id } });
  }

  async addPermissions(roleId: string, permissionIds: string[]) {
    return this.prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          connect: permissionIds.map((id) => ({ id })),
        },
      },
      include: { permissions: true },
    });
  }

  async removePermissions(roleId: string, permissionIds: string[]) {
    return this.prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          disconnect: permissionIds.map((id) => ({ id })),
        },
      },
      include: { permissions: true },
    });
  }

  async getPermissions(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: true },
    });
    return role?.permissions ?? [];
  }
}
