import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/database/prisma.service';
import { hashPin, verifyPin } from '../../common/utils/hash.util';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(badge: string, pin: string, ipAddress?: string, userAgent?: string) {
    if (!badge || !pin) {
      throw new BadRequestException('Badge and PIN are required');
    }

    const officer = await this.prisma.officer.findUnique({
      where: { badge },
      include: {
        role: { include: { permissions: true } },
        station: true,
      },
    });

    if (!officer) {
      await this.logAudit(null, 'login', false, { badge, reason: 'Officer not found' }, ipAddress, userAgent);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check active
    if (!officer.active) {
      await this.logAudit(officer.id, 'login', false, { badge, reason: 'Account deactivated' }, ipAddress, userAgent);
      throw new UnauthorizedException('Account is deactivated');
    }

    // Check locked
    if (officer.lockedUntil && officer.lockedUntil > new Date()) {
      await this.logAudit(officer.id, 'login', false, { badge, reason: 'Account locked' }, ipAddress, userAgent);
      throw new UnauthorizedException('Account is locked. Try again later.');
    }

    // Check PIN expiry (90 days default)
    const pinExpiryDays = this.config.get<number>('auth.pinExpiryDays', 90);
    const daysSincePinChange = Math.floor(
      (Date.now() - officer.pinChangedAt.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysSincePinChange > pinExpiryDays) {
      await this.logAudit(officer.id, 'login', false, { badge, reason: 'PIN expired' }, ipAddress, userAgent);
      throw new UnauthorizedException('PIN has expired. Please reset your PIN.');
    }

    // Verify PIN
    const isValid = await verifyPin(pin, officer.pinHash);
    if (!isValid) {
      await this.handleFailedLogin(officer.id, officer.badge, ipAddress, userAgent);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Success — reset failed attempts & update last login
    await this.prisma.officer.update({
      where: { id: officer.id },
      data: { failedAttempts: 0, lockedUntil: null, lastLogin: new Date() },
    });

    // Build JWT payload
    const permissions = officer.role.permissions.map((p) => ({
      resource: p.resource,
      action: p.action,
      scope: p.scope,
    }));

    const payload: JwtPayload = {
      sub: officer.id,
      badge: officer.badge,
      role: officer.role.name,
      roleLevel: officer.role.level,
      stationId: officer.stationId,
      permissions,
    };

    const accessToken = this.jwtService.sign(payload);

    // Audit success
    await this.logAudit(officer.id, 'login', true, { badge }, ipAddress, userAgent);

    return {
      accessToken,
      officer: {
        id: officer.id,
        badge: officer.badge,
        name: officer.name,
        email: officer.email,
        roleId: officer.roleId,
        roleName: officer.role.name,
        roleLevel: officer.role.level,
        stationId: officer.stationId,
        stationName: officer.station.name,
        active: officer.active,
        mfaEnabled: officer.mfaEnabled,
        permissions,
      },
    };
  }

  async changePin(officerId: string, currentPin: string, newPin: string) {
    this.validatePinStrength(newPin);

    const officer = await this.prisma.officer.findUnique({ where: { id: officerId } });
    if (!officer) throw new UnauthorizedException('Officer not found');

    const isValid = await verifyPin(currentPin, officer.pinHash);
    if (!isValid) {
      await this.logAudit(officerId, 'pin_change', false, { reason: 'Invalid current PIN' });
      throw new UnauthorizedException('Invalid current PIN');
    }

    const newPinHash = await hashPin(newPin);
    await this.prisma.officer.update({
      where: { id: officerId },
      data: { pinHash: newPinHash, pinChangedAt: new Date() },
    });

    await this.logAudit(officerId, 'pin_change', true, {});
  }

  async resetPin(officerId: string, newPin: string, adminId: string) {
    this.validatePinStrength(newPin);

    const officer = await this.prisma.officer.findUnique({ where: { id: officerId } });
    if (!officer) throw new BadRequestException('Officer not found');

    const newPinHash = await hashPin(newPin);
    await this.prisma.officer.update({
      where: { id: officerId },
      data: {
        pinHash: newPinHash,
        pinChangedAt: new Date(),
        failedAttempts: 0,
        lockedUntil: null,
      },
    });

    await this.logAudit(adminId, 'pin_reset', true, { targetOfficerId: officerId });
  }

  async refreshToken(payload: JwtPayload) {
    // Re-fetch officer to get fresh permissions
    const officer = await this.prisma.officer.findUnique({
      where: { id: payload.sub },
      include: { role: { include: { permissions: true } }, station: true },
    });

    if (!officer || !officer.active) {
      throw new UnauthorizedException('Invalid session');
    }

    const permissions = officer.role.permissions.map((p) => ({
      resource: p.resource,
      action: p.action,
      scope: p.scope,
    }));

    const newPayload: JwtPayload = {
      sub: officer.id,
      badge: officer.badge,
      role: officer.role.name,
      roleLevel: officer.role.level,
      stationId: officer.stationId,
      permissions,
    };

    return { accessToken: this.jwtService.sign(newPayload) };
  }

  private validatePinStrength(pin: string) {
    if (pin.length < 8) throw new BadRequestException('PIN must be at least 8 digits');
    if (!/^\d+$/.test(pin)) throw new BadRequestException('PIN must contain only digits');
    if (/^(\d)\1+$/.test(pin)) throw new BadRequestException('PIN cannot be all the same digit');
    const common = ['12345678', '87654321', '11111111', '00000000'];
    if (common.includes(pin)) throw new BadRequestException('PIN is too common');
  }

  private async handleFailedLogin(officerId: string, badge: string, ipAddress?: string, userAgent?: string) {
    const updated = await this.prisma.officer.update({
      where: { id: officerId },
      data: { failedAttempts: { increment: 1 } },
    });

    const maxAttempts = this.config.get<number>('auth.maxFailedAttempts', 5);
    const lockMinutes = this.config.get<number>('auth.lockDurationMinutes', 30);

    if (updated.failedAttempts >= maxAttempts) {
      const lockUntil = new Date(Date.now() + lockMinutes * 60 * 1000);
      await this.prisma.officer.update({
        where: { id: officerId },
        data: { lockedUntil: lockUntil },
      });
      await this.logAudit(officerId, 'account_locked', true, {
        badge,
        failedAttempts: updated.failedAttempts,
        lockedUntil: lockUntil.toISOString(),
      }, ipAddress, userAgent);
    }

    await this.logAudit(officerId, 'login', false, {
      badge,
      failedAttempts: updated.failedAttempts,
      reason: 'Invalid PIN',
    }, ipAddress, userAgent);
  }

  private async logAudit(
    officerId: string | null,
    action: string,
    success: boolean,
    details: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          entityType: 'officer',
          entityId: officerId || undefined,
          officerId: officerId || undefined,
          action,
          success,
          details,
          ipAddress,
          userAgent,
        },
      });
    } catch (err) {
      this.logger.error('Audit log write failed', err);
    }
  }
}
