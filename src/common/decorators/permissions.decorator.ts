import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

export interface RequiredPermission {
  resource: string;
  action: string;
  scope: string;
}

export const RequirePermissions = (
  resource: string,
  action: string,
  scope: string = 'own',
) => SetMetadata(PERMISSIONS_KEY, { resource, action, scope } as RequiredPermission);
