import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServiceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createServiceDto: CreateServiceDto) {
    const { categoryIds, ...serviceData } = createServiceDto;

    const existingService = await this.prisma.service.findUnique({
      where: { slug: serviceData.slug }
    });

    if (existingService) {
      throw new ConflictException(`Service with slug ${serviceData.slug} already exists`);
    }

    const service = await this.prisma.service.create({
      data: {
        ...serviceData,
        ...(categoryIds && categoryIds.length > 0 && {
          categories: {
            create: categoryIds.map(categoryId => ({
              category: { connect: { id: categoryId } }
            }))
          }
        })
      },
      include: {
        categories: {
          include: {
            category: true
          }
        },
        _count: {
          select: {
            providers: true,
            favoritedBy: true,
            providerRequests: true
          }
        }
      }
    });

    return service;
  }

  async findAll(page: number = 1, limit: number = 10, filters?: any) {
    const skip = (page - 1) * limit;
    
    const where: any = { deletedAt: null };

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.isFeatured !== undefined) {
      where.isFeatured = filters.isFeatured;
    }

    if (filters?.isMostWanted !== undefined) {
      where.isMostWanted = filters.isMostWanted;
    }

    if (filters?.categoryId) {
      where.categories = { some: { categoryId: filters.categoryId } };
    }

    if (filters?.hasActiveProviders) {
      where.providers = {
        some: {
          provider: {
            deletedAt: null,
            isActive: true,
            status: 'APPROVED',
          },
        },
      };
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { keywords: { has: filters.search } }
      ];
    }

    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        skip,
        take: limit,
        where,
        include: {
          categories: {
            include: {
              category: true
            }
          },
          _count: {
            select: {
              providers: true,
              favoritedBy: true,
              providerRequests: true
            }
          }
        },
        orderBy: [
          { isMostWanted: 'desc' },
          { isFeatured: 'desc' },
          { sortOrder: 'asc' },
          { name: 'asc' }
        ]
      }),
      this.prisma.service.count({ where })
    ]);

    return {
      data: services,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, deletedAt: null },
      include: {
        categories: {
          include: {
            category: true
          }
        },
        providers: {
          where: {
            provider: {
              deletedAt: null,
              isActive: true,
              status: 'APPROVED',
            },
          },
          include: {
            provider: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    avatarUrl: true,
                    slug: true
                  }
                },
                City: true,
                _count: {
                  select: {
                    reviews: true,
                    favoritedBy: true
                  }
                }
              }
            }
          },
          take: 20
        },
        favoritedBy: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true
              }
            }
          },
          take: 10
        },
        providerRequests: {
          include: {
            providerRequest: true
          },
          orderBy: { providerRequest: { createdAt: 'desc' } },
          take: 10
        },
        _count: {
          select: {
            providers: true,
            favoritedBy: true,
            providerRequests: true
          }
        }
      }
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return service;
  }

  async findBySlug(slug: string) {
    const service = await this.prisma.service.findFirst({
      where: { slug, deletedAt: null },
      include: {
        categories: {
          include: {
            category: true
          }
        },
        providers: {
          where: {
            provider: {
              deletedAt: null,
              isActive: true,
              status: 'APPROVED',
            },
          },
          include: {
            provider: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                    slug: true
                  }
                },
                City: true
              }
            }
          },
          take: 20
        },
        _count: {
          select: {
            providers: true,
            favoritedBy: true
          }
        }
      }
    });

    if (!service) {
      throw new NotFoundException(`Service with slug ${slug} not found`);
    }

    return service;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto) {
    const service = await this.prisma.service.findFirst({
      where: { id, deletedAt: null },
      include: { categories: true }
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    const { categoryIds, ...updateData } = updateServiceDto;

    if (updateData.slug) {
      const existingService = await this.prisma.service.findFirst({
        where: {
          slug: updateData.slug,
          NOT: { id }
        }
      });

      if (existingService) {
        throw new ConflictException(`Service with slug ${updateData.slug} already exists`);
      }
    }

    const updateOperations: any = { ...updateData };

    if (categoryIds) {
      updateOperations.categories = {
        deleteMany: {},
        create: categoryIds.map(categoryId => ({
          category: { connect: { id: categoryId } }
        }))
      };
    }

    const updatedService = await this.prisma.service.update({
      where: { id },
      data: updateOperations,
      include: {
        categories: {
          include: {
            category: true
          }
        },
        _count: {
          select: {
            providers: true,
            favoritedBy: true,
            providerRequests: true
          }
        }
      }
    });

    return updatedService;
  }

  async remove(id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, deletedAt: null },
      include: {
        categories: true,
        providers: true,
        providerRequests: true,
        favoritedBy: true
      }
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    if (service.categories.length > 0) {
      await this.prisma.serviceCategory.deleteMany({
        where: { serviceId: id }
      });
    }

    if (service.providers.length > 0) {
      await this.prisma.providerService.deleteMany({
        where: { serviceId: id }
      });
    }

    if (service.providerRequests.length > 0) {
      await this.prisma.providerRequestService.deleteMany({
        where: { serviceId: id }
      });
    }

    if (service.favoritedBy.length > 0) {
      await this.prisma.favoriteService.deleteMany({
        where: { serviceId: id }
      });
    }

    await this.prisma.service.delete({ where: { id } });

    return { message: 'Service successfully deleted', serviceId: id };
  }

  async toggleActive(id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, deletedAt: null }
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    const updatedService = await this.prisma.service.update({
      where: { id },
      data: { isActive: !service.isActive }
    });

    return updatedService;
  }

  async toggleFeatured(id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, deletedAt: null }
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    const updatedService = await this.prisma.service.update({
      where: { id },
      data: { isFeatured: !service.isFeatured }
    });

    return updatedService;
  }

  async toggleMostWanted(id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, deletedAt: null }
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    const updatedService = await this.prisma.service.update({
      where: { id },
      data: { isMostWanted: !service.isMostWanted }
    });

    return updatedService;
  }

  async updateSortOrder(id: string, sortOrder: number) {
    const service = await this.prisma.service.findFirst({
      where: { id, deletedAt: null }
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    const updatedService = await this.prisma.service.update({
      where: { id },
      data: { sortOrder }
    });

    return updatedService;
  }

  async getFeatured() {
    const services = await this.prisma.service.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        isFeatured: true
      },
      include: {
        categories: {
          include: {
            category: true
          }
        },
        _count: {
          select: {
            providers: true
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    return services;
  }

  async getMostWanted() {
    const services = await this.prisma.service.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        isMostWanted: true
      },
      include: {
        categories: {
          include: {
            category: true
          }
        },
        providers: {
          include: {
            provider: {
              include: {
                user: {
                  select: {
                    name: true,
                    avatarUrl: true,
                    slug: true
                  }
                },
                City: true
              }
            }
          },
          take: 5
        },
        _count: {
          select: {
            providers: true
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    return services;
  }

  async getProviders(id: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const service = await this.prisma.service.findFirst({
      where: { id, deletedAt: null }
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    const [providers, total] = await Promise.all([
      this.prisma.providerService.findMany({
        where: { serviceId: id },
        skip,
        take: limit,
        include: {
          provider: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                  avatarUrl: true,
                  slug: true
                }
              },
              City: true,
              reviews: {
                take: 5,
                orderBy: { createdAt: 'desc' }
              },
              _count: {
                select: {
                  reviews: true,
                  favoritedBy: true
                }
              }
            }
          }
        },
        orderBy: {
          provider: {
            averageRating: 'desc'
          }
        }
      }),
      this.prisma.providerService.count({ where: { serviceId: id } })
    ]);

    return {
      data: providers.map(ps => ps.provider),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getCategories(id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, deletedAt: null }
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    const categories = await this.prisma.serviceCategory.findMany({
      where: { serviceId: id },
      include: {
        category: true
      }
    });

    return categories.map(sc => sc.category);
  }
}