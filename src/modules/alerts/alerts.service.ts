import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { AlertsRepository, AlertFilters } from './alerts.repository';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { BusinessRuleException } from '../../common/errors/business-rule.exception';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    private readonly alertsRepository: AlertsRepository,
    private readonly prisma: PrismaService,
  ) {}

  // ==================== Amber Alerts ====================

  async findAllAmberAlerts(filters: AlertFilters, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.alertsRepository.findAllAmberAlerts(filters, skip, limit),
      this.alertsRepository.countAmberAlerts(filters),
    ]);
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findAmberAlertById(id: string) {
    const alert = await this.alertsRepository.findAmberAlertById(id);
    if (!alert) {
      throw new NotFoundException(`Amber alert not found: ${id}`);
    }
    return alert;
  }

  async createAmberAlert(
    data: {
      personName: string;
      age?: number;
      gender?: string;
      description: string;
      lastSeenLocation?: string;
      lastSeenDate?: string;
      contactPhone: string;
      photoUrl?: string;
    },
    officerId: string,
  ) {
    if (data.age !== undefined && data.age >= 18) {
      throw new BadRequestException('Amber alerts are for children under 18 years old');
    }

    const alert = await this.alertsRepository.createAmberAlert({
      ...data,
      lastSeenDate: data.lastSeenDate ? new Date(data.lastSeenDate) : undefined,
      createdById: officerId,
    });

    await this.logAudit(officerId, 'create_amber_alert', alert.id, {
      personName: data.personName,
    });

    return alert;
  }

  async updateAmberAlert(id: string, data: Record<string, any>, officerId: string) {
    const existing = await this.alertsRepository.findAmberAlertById(id);
    if (!existing) {
      throw new NotFoundException(`Amber alert not found: ${id}`);
    }

    if (existing.status === 'resolved' || existing.status === 'expired') {
      throw new BusinessRuleException(`Cannot update a ${existing.status} amber alert`);
    }

    if (data.lastSeenDate) {
      data.lastSeenDate = new Date(data.lastSeenDate);
    }

    const alert = await this.alertsRepository.updateAmberAlert(id, data);

    await this.logAudit(officerId, 'update_amber_alert', id, {
      changes: Object.keys(data),
    });

    return alert;
  }

  async resolveAmberAlert(id: string, officerId: string) {
    const existing = await this.alertsRepository.findAmberAlertById(id);
    if (!existing) {
      throw new NotFoundException(`Amber alert not found: ${id}`);
    }

    if (existing.status !== 'active') {
      throw new BusinessRuleException('Only active amber alerts can be resolved');
    }

    const alert = await this.alertsRepository.updateAmberAlert(id, {
      status: 'resolved',
    });

    await this.logAudit(officerId, 'resolve_amber_alert', id, {
      personName: existing.personName,
    });

    return alert;
  }

  // ==================== Wanted Persons ====================

  async findAllWantedPersons(filters: AlertFilters, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.alertsRepository.findAllWantedPersons(filters, skip, limit),
      this.alertsRepository.countWantedPersons(filters),
    ]);
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findWantedPersonById(id: string) {
    const wanted = await this.alertsRepository.findWantedPersonById(id);
    if (!wanted) {
      throw new NotFoundException(`Wanted person not found: ${id}`);
    }
    return wanted;
  }

  async createWantedPerson(
    data: {
      personId?: string;
      name: string;
      aliases?: string[];
      charges: string[];
      description?: string;
      reward?: number;
      dangerLevel?: string;
      warrantNumber?: string;
      lastSeenLocation?: string;
      lastSeenDate?: string;
      photoUrl?: string;
    },
    officerId: string,
  ) {
    if (data.warrantNumber) {
      const existing = await this.alertsRepository.findWantedPersonByWarrantNumber(data.warrantNumber);
      if (existing) {
        throw new ConflictException(`Warrant number "${data.warrantNumber}" already in use`);
      }
    }

    // If personId is provided, mark the person as wanted
    if (data.personId) {
      await this.prisma.person.update({
        where: { id: data.personId },
        data: { isWanted: true, wantedSince: new Date() },
      });
    }

    const wanted = await this.alertsRepository.createWantedPerson({
      ...data,
      lastSeenDate: data.lastSeenDate ? new Date(data.lastSeenDate) : undefined,
      createdById: officerId,
    });

    await this.logAudit(officerId, 'create_wanted_person', wanted.id, {
      name: data.name,
      personId: data.personId,
      warrantNumber: data.warrantNumber,
    });

    return wanted;
  }

  async updateWantedPerson(id: string, data: Record<string, any>, officerId: string) {
    const existing = await this.alertsRepository.findWantedPersonById(id);
    if (!existing) {
      throw new NotFoundException(`Wanted person not found: ${id}`);
    }

    if (existing.status === 'captured') {
      throw new BusinessRuleException('Cannot update a captured wanted person record');
    }

    if (data.lastSeenDate) {
      data.lastSeenDate = new Date(data.lastSeenDate);
    }

    const wanted = await this.alertsRepository.updateWantedPerson(id, data);

    await this.logAudit(officerId, 'update_wanted_person', id, {
      changes: Object.keys(data),
    });

    return wanted;
  }

  async captureWantedPerson(
    id: string,
    capturedLocation: string | undefined,
    officerId: string,
  ) {
    const existing = await this.alertsRepository.findWantedPersonById(id);
    if (!existing) {
      throw new NotFoundException(`Wanted person not found: ${id}`);
    }

    if (existing.status !== 'active') {
      throw new BusinessRuleException('Only active wanted persons can be captured');
    }

    const wanted = await this.alertsRepository.updateWantedPerson(id, {
      status: 'captured',
      capturedAt: new Date(),
      capturedLocation,
    });

    // Update linked Person record if exists
    if (existing.personId) {
      await this.prisma.person.update({
        where: { id: existing.personId },
        data: { isWanted: false },
      });
    }

    await this.logAudit(officerId, 'capture_wanted_person', id, {
      name: existing.name,
      personId: existing.personId,
      capturedLocation,
    });

    return wanted;
  }

  // ==================== Active Alerts ====================

  async getActiveAlerts() {
    const [amberAlerts, wantedPersons] = await Promise.all([
      this.alertsRepository.findAllAmberAlerts({ status: 'active' }, 0, 100),
      this.alertsRepository.findAllWantedPersons({ status: 'active' }, 0, 100),
    ]);

    return { amberAlerts, wantedPersons };
  }

  // ==================== Stats ====================

  async getStats() {
    const [
      totalAmber,
      activeAmber,
      totalWanted,
      activeWanted,
      capturedWanted,
    ] = await Promise.all([
      this.prisma.amberAlert.count(),
      this.prisma.amberAlert.count({ where: { status: 'active' } }),
      this.prisma.wantedPerson.count(),
      this.prisma.wantedPerson.count({ where: { status: 'active' } }),
      this.prisma.wantedPerson.count({ where: { status: 'captured' } }),
    ]);

    return {
      amberAlerts: { total: totalAmber, active: activeAmber },
      wantedPersons: { total: totalWanted, active: activeWanted, captured: capturedWanted },
    };
  }

  private async logAudit(
    officerId: string,
    action: string,
    entityId: string,
    details: Record<string, any>,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          entityType: 'alert',
          entityId,
          officerId,
          action,
          success: true,
          details,
        },
      });
    } catch (err) {
      this.logger.error('Audit log write failed', err);
    }
  }
}
