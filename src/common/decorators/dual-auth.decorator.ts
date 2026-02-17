import { SetMetadata } from '@nestjs/common';

export const DUAL_AUTH_KEY = 'dual_auth_required';

export const RequireDualAuth = () => SetMetadata(DUAL_AUTH_KEY, true);
