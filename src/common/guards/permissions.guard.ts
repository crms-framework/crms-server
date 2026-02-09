import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSIONS_KEY,
  RequiredPermission,
} from '../decorators/permissions.decorator';

const SCOPE_HIERARCHY: Record<string, number> = {
  own: 1,
  station: 2,
  region: 3,
  national: 4,
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<RequiredPermission>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('No authenticated user');
    }

    // SuperAdmin (level 1) has all permissions
    if (user.roleLevel === 1) {
      return true;
    }

    const hasPermission = this.checkPermission(user, required);
    if (!hasPermission) {
      throw new ForbiddenException(
        `Insufficient permissions: ${required.resource}.${required.action} with ${required.scope} scope required`,
      );
    }

    return true;
  }

  private checkPermission(
    user: any,
    required: RequiredPermission,
  ): boolean {
    if (!user.permissions || !Array.isArray(user.permissions)) {
      return false;
    }

    const permission = user.permissions.find(
      (p: any) =>
        p.resource === required.resource && p.action === required.action,
    );

    if (!permission) {
      return false;
    }

    return this.isScopeSufficient(permission.scope, required.scope);
  }

  private isScopeSufficient(
    userScope: string,
    requiredScope: string,
  ): boolean {
    return (
      (SCOPE_HIERARCHY[userScope] || 0) >=
      (SCOPE_HIERARCHY[requiredScope] || 0)
    );
  }
}

/**
 * Build a Prisma where clause based on user's permission scope.
 * Useful for filtering query results based on access level.
 */
export function buildScopeFilter(
  user: any,
  resource: string,
  action: string,
): Record<string, any> {
  if (!user) {
    return { id: null };
  }

  // SuperAdmin or level 1 — no filter
  if (user.roleLevel === 1) {
    return {};
  }

  const scope = getEffectiveScope(user, resource, action);
  if (!scope) {
    return { id: null };
  }

  if (scope === 'national') return {};
  if (scope === 'station') return { stationId: user.stationId };
  if (scope === 'own') return { officerId: user.id };
  if (scope === 'region') return { stationId: user.stationId };

  return { id: null };
}

function getEffectiveScope(
  user: any,
  resource: string,
  action: string,
): string | null {
  if (user.roleLevel === 1) return 'national';
  const perm = user.permissions?.find(
    (p: any) => p.resource === resource && p.action === action,
  );
  return perm?.scope || null;
}
