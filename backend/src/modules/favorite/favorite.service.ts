import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma, ProviderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoriteService {
  constructor(private readonly prisma: PrismaService) {}

  // Provider favorites
  async addProvider(userId: string, providerId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

    const provider = await this.prisma.provider.findFirst({
      where: { id: providerId, deletedAt: null }
    });
    if (!provider) throw new NotFoundException(`Provider with ID ${providerId} not found`);

    const existing = await this.prisma.favoriteProvider.findUnique({
      where: { userId_providerId: { userId, providerId } }
    });

    if (existing) {
      throw new ConflictException('Provider is already in favorites');
    }

    const favorite = await this.prisma.favoriteProvider.create({
      data: { userId, providerId },
      include: {
        provider: {
          include: {
            user: { select: { name: true, slug: true, avatarUrl: true } },
            City: true
          }
        }
      }
    });

    return favorite;
  }

  async removeProvider(userId: string, providerId: string) {
    const favorite = await this.prisma.favoriteProvider.findUnique({
      where: { userId_providerId: { userId, providerId } }
    });

    if (!favorite) {
      throw new NotFoundException('Provider not found in favorites');
    }

    await this.prisma.favoriteProvider.delete({
      where: { userId_providerId: { userId, providerId } }
    });

    return { message: 'Provider removed from favorites' };
  }

  async listProviders(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      this.prisma.favoriteProvider.findMany({
        where: { userId },
        skip,
        take: limit,
        include: {
          provider: {
            include: {
              user: { select: { name: true, slug: true, avatarUrl: true } },
              City: true,
              services: {
                include: { service: { select: { name: true, slug: true } } }
              },
              _count: { select: { reviews: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.favoriteProvider.count({ where: { userId } })
    ]);

    return {
      data: favorites.map(f => f.provider),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async checkProvider(userId: string, providerId: string) {
    const favorite = await this.prisma.favoriteProvider.findUnique({
      where: { userId_providerId: { userId, providerId } }
    });

    return { isFavorited: !!favorite };
  }

  // Service favorites
  async addService(userId: string, serviceId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, deletedAt: null }
    });
    if (!service) throw new NotFoundException(`Service with ID ${serviceId} not found`);

    const existing = await this.prisma.favoriteService.findUnique({
      where: { userId_serviceId: { userId, serviceId } }
    });

    if (existing) {
      throw new ConflictException('Service is already in favorites');
    }

    const favorite = await this.prisma.favoriteService.create({
      data: { userId, serviceId },
      include: {
        service: {
          include: {
            categories: { include: { category: true } },
            _count: { select: { providers: true } }
          }
        }
      }
    });

    return favorite;
  }

  async removeService(userId: string, serviceId: string) {
    const favorite = await this.prisma.favoriteService.findUnique({
      where: { userId_serviceId: { userId, serviceId } }
    });

    if (!favorite) {
      throw new NotFoundException('Service not found in favorites');
    }

    await this.prisma.favoriteService.delete({
      where: { userId_serviceId: { userId, serviceId } }
    });

    return { message: 'Service removed from favorites' };
  }

  async listServices(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      this.prisma.favoriteService.findMany({
        where: { userId },
        skip,
        take: limit,
        include: {
          service: {
            include: {
              categories: { include: { category: true } },
              _count: {
                select: {
                  providers: {
                    where: {
                      provider: { deletedAt: null, isActive: true, status: 'APPROVED' },
                    },
                  },
                },
              },
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.favoriteService.count({ where: { userId } })
    ]);

    return {
      data: favorites.map(f => f.service),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async checkService(userId: string, serviceId: string) {
    const favorite = await this.prisma.favoriteService.findUnique({
      where: { userId_serviceId: { userId, serviceId } }
    });

    return { isFavorited: !!favorite };
  }

  // Category favorites
  async addCategory(userId: string, categoryId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, deletedAt: null }
    });
    if (!category) throw new NotFoundException(`Category with ID ${categoryId} not found`);

    const existing = await this.prisma.favoriteCategory.findUnique({
      where: { userId_categoryId: { userId, categoryId } }
    });

    if (existing) {
      throw new ConflictException('Category is already in favorites');
    }

    const favorite = await this.prisma.favoriteCategory.create({
      data: { userId, categoryId },
      include: {
        category: true
      }
    });

    return favorite;
  }

  async removeCategory(userId: string, categoryId: string) {
    const favorite = await this.prisma.favoriteCategory.findUnique({
      where: { userId_categoryId: { userId, categoryId } }
    });

    if (!favorite) {
      throw new NotFoundException('Category not found in favorites');
    }

    await this.prisma.favoriteCategory.delete({
      where: { userId_categoryId: { userId, categoryId } }
    });

    return { message: 'Category removed from favorites' };
  }

  async listCategories(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const validServiceCondition: Prisma.ServiceCategoryWhereInput = {
      service: {
        deletedAt: null,
        isActive: true,
        providers: {
          some: { provider: { deletedAt: null, isActive: true, status: ProviderStatus.APPROVED } },
        },
      },
    };

    const [favorites, total] = await Promise.all([
      this.prisma.favoriteCategory.findMany({
        where: { userId },
        skip,
        take: limit,
        include: {
          category: {
            include: {
              _count: {
                select: {
                  services: { where: validServiceCondition },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.favoriteCategory.count({ where: { userId } })
    ]);

    const categories = favorites
      .map(f => (f as any).category)
      .filter((c: any) => (c._count?.services ?? 0) > 0);

    return {
      data: categories,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async checkCategory(userId: string, categoryId: string) {
    const favorite = await this.prisma.favoriteCategory.findUnique({
      where: { userId_categoryId: { userId, categoryId } }
    });

    return { isFavorited: !!favorite };
  }
}
