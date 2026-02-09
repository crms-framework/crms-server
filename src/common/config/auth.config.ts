import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  jwtExpiry: process.env.JWT_EXPIRY || '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-me-refresh-secret',
  refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  maxFailedAttempts: parseInt(process.env.MAX_FAILED_ATTEMPTS || '5', 10),
  lockDurationMinutes: parseInt(process.env.LOCK_DURATION_MINUTES || '30', 10),
  pinExpiryDays: parseInt(process.env.PIN_EXPIRY_DAYS || '90', 10),
}));
