import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AgencyRepository } from '../agency.repository';

@Injectable()
export class InteragencyAuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(InteragencyAuditInterceptor.name);

  constructor(private readonly agencyRepo: AgencyRepository) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const agency = request.agency;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.logRequest(request, agency, 'completed', startTime);
        },
        error: (err) => {
          this.logRequest(request, agency, 'failed', startTime, err.message);
        },
      }),
    );
  }

  private logRequest(
    request: any,
    agency: any,
    status: string,
    startTime: number,
    error?: string,
  ) {
    if (!agency) return;

    const responseTime = Date.now() - startTime;
    const entityType = this.extractEntityType(request.url);

    this.agencyRepo
      .logRequest({
        agencyId: agency.id,
        requestType: request.method,
        entityType,
        requestData: {
          method: request.method,
          url: request.url,
          params: request.params,
          ...(error ? { error } : {}),
        },
        status,
        ipAddress:
          request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
          request.ip,
        responseTime,
      })
      .catch((err) => {
        this.logger.error('Failed to log interagency request', err);
      });
  }

  private extractEntityType(url: string): string {
    if (url.includes('/cases')) return 'case';
    if (url.includes('/persons')) return 'person';
    if (url.includes('/warrants')) return 'warrant';
    if (url.includes('/inmates')) return 'inmate';
    if (url.includes('/flags')) return 'flag';
    return 'unknown';
  }
}
