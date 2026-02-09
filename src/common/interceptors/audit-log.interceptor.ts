import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../database/prisma.service';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    if (!MUTATION_METHODS.has(method)) {
      return next.handle();
    }

    const user = request.user;
    const url = request.url;
    const ip = request.ip;
    const userAgent = request.headers['user-agent'];

    return next.handle().pipe(
      tap({
        next: () => {
          this.logAudit(user, method, url, ip, userAgent, true).catch(
            (err) => this.logger.error('Audit log write failed', err),
          );
        },
        error: () => {
          this.logAudit(user, method, url, ip, userAgent, false).catch(
            (err) => this.logger.error('Audit log write failed', err),
          );
        },
      }),
    );
  }

  private async logAudit(
    user: any,
    method: string,
    url: string,
    ipAddress: string,
    userAgent: string,
    success: boolean,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          entityType: this.extractEntityType(url),
          action: this.methodToAction(method),
          officerId: user?.id || null,
          stationId: user?.stationId || null,
          details: { method, url },
          ipAddress,
          userAgent,
          success,
        },
      });
    } catch {
      // Audit logging should never break the request
    }
  }

  private methodToAction(method: string): string {
    switch (method) {
      case 'POST':
        return 'create';
      case 'PUT':
      case 'PATCH':
        return 'update';
      case 'DELETE':
        return 'delete';
      default:
        return 'unknown';
    }
  }

  private extractEntityType(url: string): string {
    const segments = url.replace(/^\/api\/v1\//, '').split('/');
    return segments[0] || 'unknown';
  }
}
