import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { FrameworkConfigRepository } from './framework-config.repository';

@Injectable()
export class FrameworkConfigService implements OnModuleInit {
  private readonly logger = new Logger(FrameworkConfigService.name);
  private cache = new Map<string, any>();

  constructor(private readonly repo: FrameworkConfigRepository) {}

  async onModuleInit() {
    await this.loadCache();
  }

  private async loadCache() {
    const configs = await this.repo.findAll();
    this.cache.clear();
    for (const config of configs) {
      this.cache.set(config.key, config.value);
    }
    this.logger.log(`Loaded ${configs.length} framework configs into cache`);
  }

  private invalidateCache() {
    this.cache.clear();
  }

  // Read from cache (never hits DB after init)
  getConfig(key: string): any {
    return this.cache.get(key) ?? null;
  }

  async findAll() {
    return this.repo.findAll();
  }

  async findByKey(key: string) {
    const config = await this.repo.findByKey(key);
    if (!config) throw new NotFoundException(`Config key "${key}" not found`);
    return config;
  }

  async findByCategory(category: string) {
    return this.repo.findByCategory(category);
  }

  async upsert(
    key: string,
    data: { category: string; value: any; description?: string; isSystem?: boolean },
  ) {
    const result = await this.repo.upsert(key, data);
    this.invalidateCache();
    await this.loadCache();
    return result;
  }

  async delete(key: string) {
    const config = await this.repo.findByKey(key);
    if (!config) throw new NotFoundException(`Config key "${key}" not found`);
    if (config.isSystem) throw new BadRequestException('System configs cannot be deleted');
    const result = await this.repo.delete(key);
    this.invalidateCache();
    await this.loadCache();
    return result;
  }

  // Offense Categories
  async findAllOffenseCategories() {
    const categories = await this.repo.findAllOffenseCategories();
    // Return only root categories (with children nested)
    return categories.filter((c) => !c.parentId);
  }

  async createOffenseCategory(data: {
    code: string;
    name: string;
    description?: string;
    parentId?: string;
    sortOrder?: number;
  }) {
    return this.repo.createOffenseCategory(data);
  }

  async updateOffenseCategory(
    id: string,
    data: Partial<{ code: string; name: string; description: string; sortOrder: number; isActive: boolean }>,
  ) {
    const existing = await this.repo.findOffenseCategoryById(id);
    if (!existing) throw new NotFoundException('Offense category not found');
    return this.repo.updateOffenseCategory(id, data);
  }

  async softDeleteOffenseCategory(id: string) {
    return this.updateOffenseCategory(id, { isActive: false });
  }

  // Police Ranks
  async findAllPoliceRanks() {
    return this.repo.findAllPoliceRanks();
  }

  async createPoliceRank(data: { name: string; abbreviation: string; level: number }) {
    return this.repo.createPoliceRank(data);
  }

  async updatePoliceRank(
    id: string,
    data: Partial<{ name: string; abbreviation: string; level: number; isActive: boolean }>,
  ) {
    return this.repo.updatePoliceRank(id, data);
  }

  async softDeletePoliceRank(id: string) {
    return this.updatePoliceRank(id, { isActive: false });
  }
}
