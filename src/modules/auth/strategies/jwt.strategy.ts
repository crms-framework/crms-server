import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string;
  badge: string;
  role: string;
  roleLevel: number;
  stationId: string;
  permissions: Array<{ resource: string; action: string; scope: string }>;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('auth.jwtSecret') || 'fallback-secret',
    });
  }

  validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token');
    }
    return {
      id: payload.sub,
      badge: payload.badge,
      role: payload.role,
      roleLevel: payload.roleLevel,
      stationId: payload.stationId,
      permissions: payload.permissions,
    };
  }
}
