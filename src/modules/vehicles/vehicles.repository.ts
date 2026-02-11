import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import { VehicleFilterDto } from './dto/vehicle-filter.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: VehicleFilterDto) {
    const where: Prisma.VehicleWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.stationId) {
      where.stationId = filters.stationId;
    }
    if (filters.vehicleType) {
      where.vehicleType = filters.vehicleType;
    }
    if (filters.ownerNIN) {
      where.ownerNIN = filters.ownerNIN;
    }
    if (filters.search) {
      where.OR = [
        { licensePlate: { contains: filters.search, mode: 'insensitive' } },
        { ownerName: { contains: filters.search, mode: 'insensitive' } },
        { make: { contains: filters.search, mode: 'insensitive' } },
        { model: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.VehicleOrderByWithRelationInput = {};
    if (filters.sortBy) {
      orderBy[filters.sortBy] = filters.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [data, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        include: { station: { select: { id: true, name: true, code: true } } },
        orderBy,
        skip: filters.skip,
        take: filters.take,
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string) {
    return this.prisma.vehicle.findUnique({
      where: { id },
      include: { station: { select: { id: true, name: true, code: true } } },
    });
  }

  async findByLicensePlate(licensePlate: string) {
    return this.prisma.vehicle.findUnique({
      where: { licensePlate: licensePlate.toUpperCase() },
      include: { station: { select: { id: true, name: true, code: true } } },
    });
  }

  async create(data: CreateVehicleDto) {
    return this.prisma.vehicle.create({
      data: {
        licensePlate: data.licensePlate.toUpperCase(),
        ownerNIN: data.ownerNIN,
        ownerName: data.ownerName,
        vehicleType: data.vehicleType,
        make: data.make,
        model: data.model,
        color: data.color,
        year: data.year,
        stationId: data.stationId,
        notes: data.notes,
        status: 'active',
      },
      include: { station: { select: { id: true, name: true, code: true } } },
    });
  }

  async update(id: string, data: UpdateVehicleDto) {
    return this.prisma.vehicle.update({
      where: { id },
      data: {
        ...(data.licensePlate && { licensePlate: data.licensePlate.toUpperCase() }),
        ...(data.ownerNIN !== undefined && { ownerNIN: data.ownerNIN }),
        ...(data.ownerName !== undefined && { ownerName: data.ownerName }),
        ...(data.vehicleType && { vehicleType: data.vehicleType }),
        ...(data.make !== undefined && { make: data.make }),
        ...(data.model !== undefined && { model: data.model }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.year !== undefined && { year: data.year }),
        ...(data.stationId && { stationId: data.stationId }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: { station: { select: { id: true, name: true, code: true } } },
    });
  }

  async reportStolen(id: string, reportedById: string) {
    return this.prisma.vehicle.update({
      where: { id },
      data: {
        status: 'stolen',
        stolenDate: new Date(),
        stolenReportedBy: reportedById,
        recoveredDate: null,
      },
      include: { station: { select: { id: true, name: true, code: true } } },
    });
  }

  async markRecovered(id: string) {
    return this.prisma.vehicle.update({
      where: { id },
      data: {
        status: 'recovered',
        recoveredDate: new Date(),
      },
      include: { station: { select: { id: true, name: true, code: true } } },
    });
  }

  async markImpounded(id: string) {
    return this.prisma.vehicle.update({
      where: { id },
      data: {
        status: 'impounded',
      },
      include: { station: { select: { id: true, name: true, code: true } } },
    });
  }

  async delete(id: string) {
    return this.prisma.vehicle.delete({
      where: { id },
    });
  }

  async count(filters?: Partial<VehicleFilterDto>) {
    const where: Prisma.VehicleWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.stationId) {
      where.stationId = filters.stationId;
    }

    return this.prisma.vehicle.count({ where });
  }
}
