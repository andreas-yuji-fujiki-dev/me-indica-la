import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { ProviderStatus, PlanType, UserRole } from '@prisma/client';

@Injectable()
export class ProviderService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProviderDto: CreateProviderDto) {
    const { userId, serviceIds, cityId, categoryId, galleryImageUrls, ...providerData } = createProviderDto;
  
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { providerProfile: true }
    });
  
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
  
    if (user.providerProfile) {
      if (!user.providerProfile.deletedAt) {
        throw new ConflictException(`User already has a provider profile`);
      }
      // Soft-deleted provider (cancelled request) — hard-delete it to allow re-registration
      await this.prisma.provider.delete({ where: { id: user.providerProfile.id } });
    }
  
    const provider = await this.prisma.provider.create({
      data: {
        ...providerData,
        user: {
          connect: { id: userId }
        },
        ...(cityId && {
          City: { connect: { id: cityId } }
        }),
        ...(categoryId && {
          category: { connect: { id: categoryId } }
        }),
        ...(serviceIds && serviceIds.length > 0 && {
          services: {
            create: serviceIds.map(serviceId => ({
              service: { connect: { id: serviceId } }
            }))
          }
        })
      },
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
        services: {
          include: {
            service: true
          }
        },
        City: true
      }
    });
  
    if (galleryImageUrls && galleryImageUrls.length > 0) {
      await this.prisma.providerGallery.createMany({
        data: galleryImageUrls.map((url) => ({ providerId: provider.id, imageUrl: url })),
      });
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { role: UserRole.PROVIDER }
    });

    return provider;
  }

  async findAll(page: number = 1, limit: number = 10, filters?: any) {
    const skip = (page - 1) * limit;
    
    const where: any = { deletedAt: null };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
    }

    if (filters?.plan) {
      where.plan = filters.plan;
    }

    if (filters?.cityId) {
      where.cityId = filters.cityId;
    }

    if (filters?.isFeaturedHome !== undefined) {
      where.isFeaturedHome = filters.isFeaturedHome;
    }

    if (filters?.search) {
      where.OR = [
        { user: { name: { contains: filters.search, mode: 'insensitive' } } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { keywords: { has: filters.search } }
      ];
    }

    if (filters?.minRating) {
      where.averageRating = { gte: filters.minRating };
    }

    if (filters?.serviceId) {
      where.services = { some: { serviceId: filters.serviceId } };
    }

    const [providers, total] = await Promise.all([
      this.prisma.provider.findMany({
        skip,
        take: limit,
        where,
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
          services: {
            include: {
              service: true
            }
          },
          _count: {
            select: {
              reviews: true,
              favoritedBy: true,
              galleryImages: true
            }
          }
        },
        orderBy: [
          { featuredPriority: 'desc' },
          { isFeaturedHome: 'desc' },
          { averageRating: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      this.prisma.provider.count({ where })
    ]);

    return {
      data: providers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: string) {
    const provider = await this.prisma.provider.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            slug: true,
            city: true
          }
        },
        City: true,
        category: true,
        services: {
          include: {
            service: {
              include: {
                categories: {
                  include: {
                    category: true
                  }
                }
              }
            }
          }
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true
              }
            }
          }
        },
        galleryImages: {
          orderBy: { createdAt: 'desc' }
        },
        ads: {
          where: { isActive: true }
        },
        events: {
          where: { 
            isActive: true,
            eventDate: { gte: new Date() }
          },
          orderBy: { eventDate: 'asc' },
          take: 5
        },
        _count: {
          select: {
            reviews: true,
            favoritedBy: true,
            galleryImages: true,
            ads: true,
            events: true
          }
        }
      }
    });

    if (!provider) {
      throw new NotFoundException(`Provider with ID ${id} not found`);
    }

    await this.prisma.provider.update({
      where: { id },
      data: { viewsCount: { increment: 1 } }
    });

    return provider;
  }

  async findByUserId(userId: string) {
    const provider = await this.prisma.provider.findFirst({
      where: { userId, deletedAt: null },
      include: {
        user: true,
        City: true,
        services: {
          include: {
            service: true
          }
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true
              }
            }
          }
        },
        galleryImages: true
      }
    });

    if (!provider) {
      throw new NotFoundException(`Provider for user ${userId} not found`);
    }

    return provider;
  }

  async findBySlug(slug: string) {
    const provider = await this.prisma.provider.findFirst({
      where: {
        user: { slug },
        deletedAt: null
      },
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
        services: {
          include: {
            service: true
          }
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true
              }
            }
          }
        },
        galleryImages: true,
        _count: {
          select: {
            reviews: true,
            favoritedBy: true
          }
        }
      }
    });

    if (!provider) {
      throw new NotFoundException(`Provider with slug ${slug} not found`);
    }

    return provider;
  }

  async update(id: string, updateProviderDto: UpdateProviderDto) {
    const provider = await this.prisma.provider.findFirst({
      where: { id, deletedAt: null },
      include: { services: true }
    });

    if (!provider) {
      throw new NotFoundException(`Provider with ID ${id} not found`);
    }

    const { serviceIds, galleryImageUrls, categoryId, ...updateData } = updateProviderDto as any;

    const updateOperations: any = { ...updateData };

    if (serviceIds !== undefined) {
      updateOperations.services = {
        deleteMany: {},
        create: serviceIds.map((serviceId: string) => ({
          service: { connect: { id: serviceId } }
        }))
      };
    }

    if (categoryId !== undefined) {
      if (categoryId) {
        updateOperations.category = { connect: { id: categoryId } };
      } else {
        updateOperations.category = { disconnect: true };
      }
      delete updateOperations.categoryId;
    }

    const updatedProvider = await this.prisma.provider.update({
      where: { id },
      data: updateOperations,
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
        services: {
          include: {
            service: true
          }
        }
      }
    });

    if (galleryImageUrls !== undefined) {
      await this.prisma.providerGallery.deleteMany({ where: { providerId: id } });
      if (galleryImageUrls.length > 0) {
        await this.prisma.providerGallery.createMany({
          data: galleryImageUrls.map((url: string) => ({ providerId: id, imageUrl: url })),
        });
      }
    }

    return updatedProvider;
  }

  async remove(id: string) {
    const provider = await this.prisma.provider.findFirst({
      where: { id, deletedAt: null }
    });

    if (!provider) {
      throw new NotFoundException(`Provider with ID ${id} not found`);
    }

    const deletedProvider = await this.prisma.provider.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        status: ProviderStatus.SUSPENDED
      }
    });

    return {
      message: 'Provider profile successfully deleted',
      providerId: deletedProvider.id
    };
  }

  async approveProvider(id: string) {
    const provider = await this.prisma.provider.findFirst({
      where: { id, deletedAt: null }
    });

    if (!provider) {
      throw new NotFoundException(`Provider with ID ${id} not found`);
    }

    const updatedProvider = await this.prisma.provider.update({
      where: { id },
      data: {
        status: ProviderStatus.APPROVED,
        isActive: true
      }
    });

    return updatedProvider;
  }

  async rejectProvider(id: string, reason?: string) {
    const provider = await this.prisma.provider.findFirst({
      where: { id, deletedAt: null }
    });

    if (!provider) {
      throw new NotFoundException(`Provider with ID ${id} not found`);
    }

    const updatedProvider = await this.prisma.provider.update({
      where: { id },
      data: {
        status: ProviderStatus.REJECTED,
        isActive: false
      }
    });

    return updatedProvider;
  }

  async updatePlan(id: string, plan: PlanType, expiresInDays?: number) {
    const provider = await this.prisma.provider.findFirst({
      where: { id, deletedAt: null }
    });

    if (!provider) {
      throw new NotFoundException(`Provider with ID ${id} not found`);
    }

    const planExpiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    const updatedProvider = await this.prisma.provider.update({
      where: { id },
      data: {
        plan,
        planExpiresAt,
        isAdvertiser: plan !== PlanType.FREE
      }
    });

    return updatedProvider;
  }

  async incrementClick(id: string, type: 'whatsapp' | 'instagram' | 'website') {
    const provider = await this.prisma.provider.findFirst({
      where: { id, deletedAt: null }
    });

    if (!provider) {
      throw new NotFoundException(`Provider with ID ${id} not found`);
    }

    const clickField = {
      whatsapp: 'whatsappClicks',
      instagram: 'instagramClicks',
      website: 'websiteClicks'
    }[type];

    const updatedProvider = await this.prisma.provider.update({
      where: { id },
      data: { [clickField]: { increment: 1 } }
    });

    return { success: true, type };
  }

  async toggleFeature(id: string, feature: 'home' | 'category') {
    const provider = await this.prisma.provider.findFirst({
      where: { id, deletedAt: null }
    });

    if (!provider) {
      throw new NotFoundException(`Provider with ID ${id} not found`);
    }

    const field = feature === 'home' ? 'isFeaturedHome' : 'isFeaturedCategory';
    const currentValue = provider[field];

    const updatedProvider = await this.prisma.provider.update({
      where: { id },
      data: { [field]: !currentValue }
    });

    return updatedProvider;
  }

  async getFeatured(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const providers = await this.prisma.provider.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        status: ProviderStatus.APPROVED,
        isFeaturedHome: true
      },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            slug: true
          }
        },
        City: true,
        services: {
          include: {
            service: true
          }
        },
        _count: {
          select: {
            reviews: true
          }
        }
      },
      orderBy: [
        { featuredPriority: 'desc' },
        { averageRating: 'desc' }
      ]
    });

    return providers;
  }

  async getNearby(cityId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const providers = await this.prisma.provider.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        status: ProviderStatus.APPROVED,
        cityId
      },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            slug: true
          }
        },
        City: true,
        services: {
          include: {
            service: true
          }
        },
        _count: {
          select: {
            reviews: true
          }
        }
      },
      orderBy: [
        { isVerified: 'desc' },
        { averageRating: 'desc' }
      ]
    });

    return providers;
  }
}