import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProviderRequestDto } from './dto/create-provider-request.dto';
import { UpdateProviderRequestDto } from './dto/update-provider-request.dto';
import { ProviderStatus } from '@prisma/client';

@Injectable()
export class ProviderRequestService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateProviderRequestDto) {
    const { serviceIds, categoryIds, ...requestData } = createDto;

    const providerRequest = await this.prisma.providerRequest.create({
      data: {
        ...requestData,
        status: ProviderStatus.PENDING,
        ...(serviceIds && serviceIds.length > 0 && {
          services: {
            create: serviceIds.map(serviceId => ({
              service: { connect: { id: serviceId } }
            }))
          }
        }),
        ...(categoryIds && categoryIds.length > 0 && {
          categories: {
            create: categoryIds.map(categoryId => ({
              category: { connect: { id: categoryId } }
            }))
          }
        })
      },
      include: {
        services: {
          include: {
            service: { select: { id: true, name: true, slug: true } }
          }
        },
        categories: {
          include: {
            category: { select: { id: true, name: true, slug: true } }
          }
        }
      }
    });

    return providerRequest;
  }

  async findAll(page: number = 1, limit: number = 10, filters?: any) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { message: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters?.origin) {
      where.origin = filters.origin;
    }

    const [requests, total] = await Promise.all([
      this.prisma.providerRequest.findMany({
        skip,
        take: limit,
        where,
        include: {
          services: {
            include: {
              service: { select: { id: true, name: true, slug: true } }
            }
          },
          categories: {
            include: {
              category: { select: { id: true, name: true, slug: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.providerRequest.count({ where })
    ]);

    return {
      data: requests,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: string) {
    const request = await this.prisma.providerRequest.findUnique({
      where: { id },
      include: {
        services: {
          include: {
            service: { select: { id: true, name: true, slug: true, description: true } }
          }
        },
        categories: {
          include: {
            category: { select: { id: true, name: true, slug: true, description: true } }
          }
        }
      }
    });

    if (!request) {
      throw new NotFoundException(`Provider request with ID ${id} not found`);
    }

    return request;
  }

  async update(id: string, updateDto: UpdateProviderRequestDto) {
    const request = await this.prisma.providerRequest.findUnique({ where: { id } });

    if (!request) {
      throw new NotFoundException(`Provider request with ID ${id} not found`);
    }

    const { serviceIds, categoryIds, ...updateData } = updateDto;

    const updateOperations: any = { ...updateData };

    if (serviceIds) {
      updateOperations.services = {
        deleteMany: {},
        create: serviceIds.map(serviceId => ({
          service: { connect: { id: serviceId } }
        }))
      };
    }

    if (categoryIds) {
      updateOperations.categories = {
        deleteMany: {},
        create: categoryIds.map(categoryId => ({
          category: { connect: { id: categoryId } }
        }))
      };
    }

    const updatedRequest = await this.prisma.providerRequest.update({
      where: { id },
      data: updateOperations,
      include: {
        services: {
          include: {
            service: { select: { id: true, name: true, slug: true } }
          }
        },
        categories: {
          include: {
            category: { select: { id: true, name: true, slug: true } }
          }
        }
      }
    });

    return updatedRequest;
  }

  async approve(id: string) {
    const request = await this.prisma.providerRequest.findUnique({
      where: { id },
      include: {
        services: { include: { service: true } },
        categories: { include: { category: true } }
      }
    });

    if (!request) {
      throw new NotFoundException(`Provider request with ID ${id} not found`);
    }

    if (request.status !== ProviderStatus.PENDING) {
      throw new BadRequestException(`Request is already ${request.status}`);
    }

    const updatedRequest = await this.prisma.providerRequest.update({
      where: { id },
      data: { status: ProviderStatus.APPROVED }
    });

    return updatedRequest;
  }

  async reject(id: string, reason?: string) {
    const request = await this.prisma.providerRequest.findUnique({ where: { id } });

    if (!request) {
      throw new NotFoundException(`Provider request with ID ${id} not found`);
    }

    const updatedRequest = await this.prisma.providerRequest.update({
      where: { id },
      data: {
        status: ProviderStatus.REJECTED,
        notes: reason || undefined
      }
    });

    return updatedRequest;
  }

  async remove(id: string) {
    const request = await this.prisma.providerRequest.findUnique({ where: { id } });

    if (!request) {
      throw new NotFoundException(`Provider request with ID ${id} not found`);
    }

    await this.prisma.providerRequest.delete({ where: { id } });

    return {
      message: 'Provider request successfully deleted',
      requestId: id
    };
  }

  async getPending(page: number = 1, limit: number = 10) {
    return this.findAll(page, limit, { status: ProviderStatus.PENDING });
  }

  async getStats() {
    const [pending, approved, rejected] = await Promise.all([
      this.prisma.providerRequest.count({ where: { status: ProviderStatus.PENDING } }),
      this.prisma.providerRequest.count({ where: { status: ProviderStatus.APPROVED } }),
      this.prisma.providerRequest.count({ where: { status: ProviderStatus.REJECTED } })
    ]);

    return { pending, approved, rejected, total: pending + approved + rejected };
  }
}