import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../../common/database/prisma.service';
import { AgencyRepository } from '../agency.repository';
import { hash } from '../../../common/utils/encryption.util';
import type { CreateAgencyDto, UpdateAgencyDto } from '../dto/create-agency.dto';
import type { CreateWebhookDto } from '../dto/create-webhook.dto';

@Injectable()
export class AgencyService {
  private readonly logger = new Logger(AgencyService.name);

  constructor(
    private readonly agencyRepo: AgencyRepository,
    private readonly prisma: PrismaService,
  ) {}

  // ==================== Agency CRUD ====================

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.agencyRepo.findAll(skip, limit),
      this.agencyRepo.count(),
    ]);
    return { data, total, page, limit };
  }

  async findById(id: string) {
    const agency = await this.agencyRepo.findById(id);
    if (!agency) {
      throw new NotFoundException(`Agency not found: ${id}`);
    }
    return agency;
  }

  async create(dto: CreateAgencyDto, officerId: string) {
    // Generate raw API key
    const rawApiKey = crypto.randomBytes(32).toString('hex');
    const apiKeyHash = hash(rawApiKey);
    const apiKeyPrefix = rawApiKey.substring(0, 8);

    const agency = await this.agencyRepo.create({
      name: dto.name,
      type: dto.type,
      apiKey: apiKeyHash,
      apiKeyPrefix,
      contactEmail: dto.contactEmail,
      contactPhone: dto.contactPhone,
      ipWhitelist: dto.ipWhitelist,
      rateLimit: dto.rateLimit,
      permissions: dto.permissions,
    });

    await this.logAudit(officerId, 'create_agency', agency.id, {
      name: dto.name,
      type: dto.type,
    });

    return { ...agency, rawApiKey };
  }

  async update(id: string, dto: UpdateAgencyDto, officerId: string) {
    const existing = await this.agencyRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Agency not found: ${id}`);
    }

    const agency = await this.agencyRepo.update(id, dto);

    await this.logAudit(officerId, 'update_agency', id, {
      changes: Object.keys(dto),
    });

    return agency;
  }

  async rotateApiKey(id: string, officerId: string) {
    const existing = await this.agencyRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Agency not found: ${id}`);
    }

    const rawApiKey = crypto.randomBytes(32).toString('hex');
    const apiKeyHash = hash(rawApiKey);
    const apiKeyPrefix = rawApiKey.substring(0, 8);

    await this.agencyRepo.update(id, {
      apiKey: apiKeyHash,
      apiKeyPrefix,
    });

    await this.logAudit(officerId, 'rotate_api_key', id, {
      name: existing.name,
    });

    return { id, apiKeyPrefix, rawApiKey };
  }

  async deactivate(id: string, officerId: string) {
    const existing = await this.agencyRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Agency not found: ${id}`);
    }

    const agency = await this.agencyRepo.deactivate(id);

    await this.logAudit(officerId, 'deactivate_agency', id, {
      name: existing.name,
    });

    return agency;
  }

  // ==================== Webhooks ====================

  async createWebhook(agencyId: string, dto: CreateWebhookDto, officerId: string) {
    const agency = await this.agencyRepo.findById(agencyId);
    if (!agency) {
      throw new NotFoundException(`Agency not found: ${agencyId}`);
    }

    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = await this.agencyRepo.createWebhook({
      agencyId,
      event: dto.event,
      url: dto.url,
      secret,
    });

    await this.logAudit(officerId, 'create_webhook', webhook.id, {
      agencyId,
      event: dto.event,
    });

    return { ...webhook, secret };
  }

  async findWebhooks(agencyId: string) {
    const webhooks = await this.agencyRepo.findWebhooksByAgency(agencyId);
    // Redact secrets
    return webhooks.map((w) => ({ ...w, secret: '***' }));
  }

  async deleteWebhook(webhookId: string, officerId: string) {
    await this.agencyRepo.deleteWebhook(webhookId);

    await this.logAudit(officerId, 'delete_webhook', webhookId, {});

    return { deleted: true };
  }

  // ==================== Audit ====================

  private async logAudit(
    officerId: string,
    action: string,
    entityId: string,
    details: Record<string, any>,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          entityType: 'agency',
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
