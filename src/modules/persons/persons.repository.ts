import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { encryptPII } from '../../common/utils/encryption.util';

export interface PersonFilters {
  gender?: string;
  nationality?: string;
  countryCode?: string;
  isWanted?: boolean;
  createdById?: string;
  search?: string;
}

@Injectable()
export class PersonsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    filters: PersonFilters,
    skip: number,
    take: number,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    const where = this.buildWhere(filters);

    return this.prisma.person.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      include: {
        cases: {
          include: {
            case: {
              select: {
                id: true,
                caseNumber: true,
                title: true,
                status: true,
              },
            },
          },
        },
        createdBy: { select: { id: true, badge: true, name: true } },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.person.findUnique({
      where: { id },
      include: {
        cases: {
          include: {
            case: {
              select: {
                id: true,
                caseNumber: true,
                title: true,
                status: true,
                category: true,
                severity: true,
              },
            },
          },
        },
        createdBy: { select: { id: true, badge: true, name: true } },
        wantedPerson: true,
      },
    });
  }

  async findByNationalId(nationalId: string) {
    return this.prisma.person.findUnique({
      where: { nationalId },
      include: {
        cases: {
          include: {
            case: {
              select: {
                id: true,
                caseNumber: true,
                title: true,
                status: true,
              },
            },
          },
        },
        createdBy: { select: { id: true, badge: true, name: true } },
        wantedPerson: true,
      },
    });
  }

  async search(query: string, skip = 0, take = 20) {
    return this.prisma.person.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { nationalId: { contains: query, mode: 'insensitive' } },
          { aliases: { has: query } },
          { fullName: { contains: query, mode: 'insensitive' } },
        ],
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        cases: {
          include: {
            case: {
              select: {
                id: true,
                caseNumber: true,
                title: true,
                status: true,
              },
            },
          },
        },
        createdBy: { select: { id: true, badge: true, name: true } },
      },
    });
  }

  async create(data: {
    nationalId?: string;
    idType?: string;
    countryCode?: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    aliases?: string[];
    dob?: Date;
    gender?: string;
    nationality?: string;
    address?: string;
    phone?: string;
    email?: string;
    fingerprintHash?: string;
    biometricHash?: string;
    createdById: string;
  }) {
    const { address, phone, email, ...rest } = data;

    return this.prisma.person.create({
      data: {
        ...rest,
        fullName: `${data.firstName} ${data.lastName}`.trim(),
        addressEncrypted: encryptPII(address),
        phoneEncrypted: encryptPII(phone),
        emailEncrypted: encryptPII(email),
      },
      include: {
        createdBy: { select: { id: true, badge: true, name: true } },
      },
    });
  }

  async update(
    id: string,
    data: Partial<{
      nationalId: string;
      idType: string;
      countryCode: string;
      firstName: string;
      lastName: string;
      middleName: string;
      aliases: string[];
      dob: Date;
      gender: string;
      nationality: string;
      address: string;
      phone: string;
      email: string;
      fingerprintHash: string;
      biometricHash: string;
      isWanted: boolean;
      wantedSince: Date;
      isDeceasedOrMissing: boolean;
      riskLevel: string;
    }>,
  ) {
    const { address, phone, email, firstName, lastName, ...rest } = data;

    const updateData: any = { ...rest };

    if (address !== undefined) {
      updateData.addressEncrypted = encryptPII(address);
    }
    if (phone !== undefined) {
      updateData.phoneEncrypted = encryptPII(phone);
    }
    if (email !== undefined) {
      updateData.emailEncrypted = encryptPII(email);
    }
    if (firstName !== undefined) {
      updateData.firstName = firstName;
    }
    if (lastName !== undefined) {
      updateData.lastName = lastName;
    }
    // Recompute fullName if either name part changes
    if (firstName !== undefined || lastName !== undefined) {
      // We need to fetch the current record to merge names properly
      const current = await this.prisma.person.findUnique({
        where: { id },
        select: { firstName: true, lastName: true },
      });
      if (current) {
        const newFirst = firstName ?? current.firstName;
        const newLast = lastName ?? current.lastName;
        updateData.fullName = `${newFirst} ${newLast}`.trim();
      }
    }

    return this.prisma.person.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: { select: { id: true, badge: true, name: true } },
      },
    });
  }

  async count(filters: PersonFilters) {
    const where = this.buildWhere(filters);
    return this.prisma.person.count({ where });
  }

  private buildWhere(filters: PersonFilters) {
    const where: any = {};

    if (filters.gender) where.gender = filters.gender;
    if (filters.nationality) where.nationality = filters.nationality;
    if (filters.countryCode) where.countryCode = filters.countryCode;
    if (filters.isWanted !== undefined) where.isWanted = filters.isWanted;
    if (filters.createdById) where.createdById = filters.createdById;

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { nationalId: { contains: filters.search, mode: 'insensitive' } },
        { fullName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }
}
