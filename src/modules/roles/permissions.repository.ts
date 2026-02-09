import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

export interface PermissionFilters {
  resource?: string;
  action?: string;
  scope?: string;
}

@Injectable()
export class PermissionsRepository {
  private readonly logger = new Logger(PermissionsRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.permission.findUnique({ where: { id } });
  }

  async findByAttributes(resource: string, action: string, scope: string) {
    return this.prisma.permission.findUnique({
      where: {
        resource_action_scope: { resource, action, scope },
      },
    });
  }

  async findAll(filters?: PermissionFilters) {
    const where = this.buildWhereClause(filters);
    return this.prisma.permission.findMany({
      where,
      orderBy: [{ resource: 'asc' }, { action: 'asc' }, { scope: 'asc' }],
    });
  }

  async findByResource(resource: string) {
    return this.prisma.permission.findMany({
      where: { resource },
      orderBy: [{ action: 'asc' }, { scope: 'asc' }],
    });
  }

  async create(data: { resource: string; action: string; scope: string }) {
    return this.prisma.permission.create({ data });
  }

  async delete(id: string) {
    return this.prisma.permission.delete({ where: { id } });
  }

  async createMany(data: Array<{ resource: string; action: string; scope: string }>) {
    const results: Array<{ id: string; resource: string; action: string; scope: string }> = [];
    for (const item of data) {
      const permission = await this.prisma.permission.upsert({
        where: {
          resource_action_scope: {
            resource: item.resource,
            action: item.action,
            scope: item.scope,
          },
        },
        update: {},
        create: item,
      });
      results.push(permission);
    }
    return results;
  }

  private buildWhereClause(filters?: PermissionFilters) {
    if (!filters) return {};
    const where: Record<string, string> = {};
    if (filters.resource) where.resource = filters.resource;
    if (filters.action) where.action = filters.action;
    if (filters.scope) where.scope = filters.scope;
    return where;
  }
}
