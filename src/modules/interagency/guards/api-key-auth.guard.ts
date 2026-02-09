import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { AgencyRepository } from '../agency.repository';
import { hash } from '../../../common/utils/encryption.util';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyAuthGuard.name);

  constructor(private readonly agencyRepo: AgencyRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('Missing X-API-Key header');
    }

    const keyHash = hash(apiKey);
    const agency = await this.agencyRepo.findByApiKey(keyHash);

    if (!agency) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (!agency.isActive) {
      throw new ForbiddenException('Agency account is deactivated');
    }

    // Check IP whitelist
    if (agency.ipWhitelist && agency.ipWhitelist.length > 0) {
      const clientIp =
        request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        request.ip ||
        request.connection?.remoteAddress;

      if (!agency.ipWhitelist.includes(clientIp)) {
        throw new ForbiddenException('IP address not whitelisted');
      }
    }

    // Attach agency to request
    request.agency = agency;

    // Fire-and-forget last accessed update
    this.agencyRepo.updateLastAccessed(agency.id).catch((err) => {
      this.logger.warn('Failed to update lastAccessedAt', err);
    });

    return true;
  }
}
