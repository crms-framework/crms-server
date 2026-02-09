import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { SyncRepository, SyncFilters } from './sync.repository';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly syncRepository: SyncRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(filters: SyncFilters, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.syncRepository.findAll(filters, skip, limit),
      this.syncRepository.count(filters),
    ]);
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async getStats() {
    return this.syncRepository.countByStatus();
  }

  async queueChange(data: {
    entityType: string;
    entityId: string;
    operation: string;
    payload: Record<string, any>;
  }) {
    const entry = await this.syncRepository.create(data);

    this.logger.log(
      `Queued sync: ${data.operation} on ${data.entityType}/${data.entityId}`,
    );

    return entry;
  }

  async processPending(limit = 50) {
    const pending = await this.syncRepository.findPending(limit);

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
    };

    for (const item of pending) {
      results.processed++;
      try {
        // Mark as processing
        await this.syncRepository.updateStatus(item.id, 'processing');

        // Execute the sync operation
        await this.executeSync(item);

        // Mark as completed
        await this.syncRepository.markCompleted(item.id);
        results.succeeded++;
      } catch (err: any) {
        await this.syncRepository.markFailed(item.id, err.message || 'Unknown error');
        results.failed++;
        this.logger.error(`Sync failed for ${item.id}: ${err.message}`);
      }
    }

    this.logger.log(
      `Sync processed: ${results.processed} total, ${results.succeeded} ok, ${results.failed} failed`,
    );

    return results;
  }

  async retryFailed(id: string) {
    const entry = await this.syncRepository.findById(id);
    if (!entry) {
      throw new NotFoundException(`Sync entry not found: ${id}`);
    }

    await this.syncRepository.resetForRetry(id);

    this.logger.log(`Reset sync entry ${id} for retry`);

    return { reset: true, id };
  }

  private async executeSync(item: any) {
    // Process based on operation type
    // This is a placeholder that will be customized per deployment
    switch (item.operation) {
      case 'create':
      case 'update':
      case 'delete':
        this.logger.log(
          `Executing sync: ${item.operation} ${item.entityType}/${item.entityId}`,
        );
        break;
      default:
        this.logger.warn(`Unknown sync operation: ${item.operation}`);
    }
  }
}
