import { Params } from 'nestjs-pino';

const SENSITIVE_HEADERS = ['authorization', 'x-api-key', 'cookie', 'x-csrf-token'];
const SENSITIVE_PATTERN = /key|token|secret|password|auth/i;

function redactSensitiveHeaders(headers: Record<string, any>): Record<string, any> {
  return Object.keys(headers || {}).reduce((acc, key) => {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_HEADERS.includes(lowerKey) || SENSITIVE_PATTERN.test(key)) {
      acc[key] = '[Redacted]';
    } else {
      acc[key] = headers[key];
    }
    return acc;
  }, {} as Record<string, any>);
}

export function createLoggerConfig(): Params {
  return {
    pinoHttp: {
      transport:
        process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { singleLine: true } }
          : undefined,

      // Custom serializers for security
      serializers: {
        req(req: any) {
          return {
            id: req.id,
            method: req.method,
            url: req.url,
            query: req.query,
            headers: redactSensitiveHeaders(req.headers),
            remoteAddress: req.remoteAddress,
            remotePort: req.remotePort,
          };
        },
        res(res: any) {
          return {
            statusCode: res.statusCode,
          };
        },
      },

      // Reduce verbosity - only log errors/warnings in production
      customLogLevel(req: any, res: any, err: any) {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        if (process.env.NODE_ENV === 'production') return 'silent';
        return 'info';
      },

      // Skip health check endpoints
      autoLogging: {
        ignore: (req: any) => req.url?.includes('/health'),
      },
    },
  };
}
