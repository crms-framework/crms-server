import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { VehiclesRepository } from './vehicles.repository';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleFilterDto } from './dto/vehicle-filter.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  constructor(
    private readonly vehiclesRepository: VehiclesRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(filters: VehicleFilterDto) {
    const { data, total } = await this.vehiclesRepository.findAll(filters);
    return new PaginatedResponseDto(
      data,
      total,
      filters.page || 1,
      filters.limit || 20,
    );
  }

  async findById(id: string) {
    const vehicle = await this.vehiclesRepository.findById(id);
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID "${id}" not found`);
    }
    return vehicle;
  }

  async findByLicensePlate(licensePlate: string) {
    const vehicle = await this.vehiclesRepository.findByLicensePlate(licensePlate);
    if (!vehicle) {
      throw new NotFoundException(
        `Vehicle with license plate "${licensePlate}" not found`,
      );
    }
    return vehicle;
  }

  async create(data: CreateVehicleDto, officerId: string) {
    const existing = await this.vehiclesRepository.findByLicensePlate(
      data.licensePlate,
    );
    if (existing) {
      throw new BadRequestException(
        `Vehicle with license plate "${data.licensePlate}" already exists`,
      );
    }

    const vehicle = await this.vehiclesRepository.create(data);

    await this.createAuditLog({
      entityType: 'vehicle',
      entityId: vehicle.id,
      officerId,
      action: 'create',
      details: {
        licensePlate: vehicle.licensePlate,
        vehicleType: vehicle.vehicleType,
        stationId: vehicle.stationId,
      },
    });

    this.logger.log(
      `Vehicle created: ${vehicle.licensePlate} by officer ${officerId}`,
    );

    return vehicle;
  }

  async update(id: string, data: UpdateVehicleDto, officerId: string) {
    const existing = await this.vehiclesRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Vehicle with ID "${id}" not found`);
    }

    if (data.licensePlate && data.licensePlate.toUpperCase() !== existing.licensePlate) {
      const duplicate = await this.vehiclesRepository.findByLicensePlate(
        data.licensePlate,
      );
      if (duplicate) {
        throw new BadRequestException(
          `Vehicle with license plate "${data.licensePlate}" already exists`,
        );
      }
    }

    const vehicle = await this.vehiclesRepository.update(id, data);

    await this.createAuditLog({
      entityType: 'vehicle',
      entityId: id,
      officerId,
      action: 'update',
      details: { updatedFields: Object.keys(data) },
    });

    return vehicle;
  }

  async reportStolen(id: string, officerId: string, notes?: string) {
    const vehicle = await this.vehiclesRepository.findById(id);
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID "${id}" not found`);
    }

    if (vehicle.status === 'stolen') {
      throw new BadRequestException('Vehicle is already reported as stolen');
    }

    const updated = await this.vehiclesRepository.reportStolen(id, officerId);

    if (notes) {
      await this.vehiclesRepository.update(id, { notes });
    }

    await this.createAuditLog({
      entityType: 'vehicle',
      entityId: id,
      officerId,
      action: 'report_stolen',
      details: {
        licensePlate: vehicle.licensePlate,
        previousStatus: vehicle.status,
        notes,
      },
    });

    this.logger.warn(
      `Vehicle reported stolen: ${vehicle.licensePlate} by officer ${officerId}`,
    );

    return updated;
  }

  async markRecovered(id: string, officerId: string) {
    const vehicle = await this.vehiclesRepository.findById(id);
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID "${id}" not found`);
    }

    if (vehicle.status !== 'stolen') {
      throw new BadRequestException(
        'Only stolen vehicles can be marked as recovered',
      );
    }

    const updated = await this.vehiclesRepository.markRecovered(id);

    await this.createAuditLog({
      entityType: 'vehicle',
      entityId: id,
      officerId,
      action: 'mark_recovered',
      details: {
        licensePlate: vehicle.licensePlate,
        stolenDate: vehicle.stolenDate,
        recoveredDate: updated.recoveredDate,
      },
    });

    this.logger.log(
      `Vehicle recovered: ${vehicle.licensePlate} by officer ${officerId}`,
    );

    return updated;
  }

  async markImpounded(id: string, officerId: string) {
    const vehicle = await this.vehiclesRepository.findById(id);
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID "${id}" not found`);
    }

    if (vehicle.status === 'impounded') {
      throw new BadRequestException('Vehicle is already impounded');
    }

    const updated = await this.vehiclesRepository.markImpounded(id);

    await this.createAuditLog({
      entityType: 'vehicle',
      entityId: id,
      officerId,
      action: 'mark_impounded',
      details: {
        licensePlate: vehicle.licensePlate,
        previousStatus: vehicle.status,
      },
    });

    this.logger.log(
      `Vehicle impounded: ${vehicle.licensePlate} by officer ${officerId}`,
    );

    return updated;
  }

  private async createAuditLog(data: {
    entityType: string;
    entityId: string;
    officerId: string;
    action: string;
    details: Record<string, any>;
  }) {
    await this.prisma.auditLog.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        officerId: data.officerId,
        action: data.action,
        details: data.details,
        success: true,
      },
    });
  }
}
