import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class FrameworkConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.frameworkConfig.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });
  }

  async findByKey(key: string) {
    return this.prisma.frameworkConfig.findUnique({ where: { key } });
  }

  async findByCategory(category: string) {
    return this.prisma.frameworkConfig.findMany({
      where: { category },
      orderBy: { key: 'asc' },
    });
  }

  async upsert(key: string, data: { category: string; value: any; description?: string; isSystem?: boolean }) {
    return this.prisma.frameworkConfig.upsert({
      where: { key },
      create: { key, ...data },
      update: { value: data.value, description: data.description, category: data.category },
    });
  }

  async delete(key: string) {
    return this.prisma.frameworkConfig.delete({ where: { key } });
  }

  // Offense Categories
  async findAllOffenseCategories() {
    return this.prisma.offenseCategory.findMany({
      where: { isActive: true },
      include: { children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOffenseCategoryById(id: string) {
    return this.prisma.offenseCategory.findUnique({
      where: { id },
      include: { children: true, parent: true },
    });
  }

  async createOffenseCategory(data: {
    code: string;
    name: string;
    description?: string;
    parentId?: string;
    sortOrder?: number;
  }) {
    return this.prisma.offenseCategory.create({ data });
  }

  async updateOffenseCategory(id: string, data: Partial<{
    code: string;
    name: string;
    description: string;
    parentId: string;
    sortOrder: number;
    isActive: boolean;
  }>) {
    return this.prisma.offenseCategory.update({ where: { id }, data });
  }

  // Police Ranks
  async findAllPoliceRanks() {
    return this.prisma.policeRank.findMany({
      where: { isActive: true },
      orderBy: { level: 'asc' },
    });
  }

  async createPoliceRank(data: { name: string; abbreviation: string; level: number }) {
    return this.prisma.policeRank.create({ data });
  }

  async updatePoliceRank(id: string, data: Partial<{
    name: string;
    abbreviation: string;
    level: number;
    isActive: boolean;
  }>) {
    return this.prisma.policeRank.update({ where: { id }, data });
  }
}
