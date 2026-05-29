import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [
      totalUsers,
      totalProviders,
      totalServices,
      totalCategories,
      totalCities,
      totalReviews,
      totalEvents,
      totalAds,
      pendingProviders,
      approvedProviders,
      pendingRequests,
      featuredProviders,
      verifiedProviders
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.provider.count({ where: { deletedAt: null } }),
      this.prisma.service.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.category.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.city.count({ where: { isActive: true } }),
      this.prisma.review.count({ where: { isApproved: true } }),
      this.prisma.event.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.ad.count({ where: { isActive: true } }),
      this.prisma.provider.count({ where: { status: 'PENDING' } }),
      this.prisma.provider.count({ where: { status: 'APPROVED' } }),
      this.prisma.providerRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.provider.count({ where: { isFeaturedHome: true } }),
      this.prisma.provider.count({ where: { isVerified: true } })
    ]);

    return {
      users: {
        total: totalUsers,
        withProviderProfile: totalProviders
      },
      providers: {
        total: totalProviders,
        pending: pendingProviders,
        approved: approvedProviders,
        featured: featuredProviders,
        verified: verifiedProviders
      },
      services: {
        total: totalServices
      },
      categories: {
        total: totalCategories
      },
      cities: {
        total: totalCities
      },
      reviews: {
        total: totalReviews
      },
      events: {
        total: totalEvents
      },
      ads: {
        total: totalAds
      },
      pendingRequests: {
        total: pendingRequests
      }
    };
  }

  async getMonthlyStats(year: number) {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    const results = await Promise.all(
      months.map(async (month) => {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        const [newUsers, newProviders, newReviews, newRequests] = await Promise.all([
          this.prisma.user.count({
            where: { createdAt: { gte: startDate, lte: endDate } }
          }),
          this.prisma.provider.count({
            where: { createdAt: { gte: startDate, lte: endDate } }
          }),
          this.prisma.review.count({
            where: { createdAt: { gte: startDate, lte: endDate } }
          }),
          this.prisma.providerRequest.count({
            where: { createdAt: { gte: startDate, lte: endDate } }
          })
        ]);

        return {
          month,
          newUsers,
          newProviders,
          newReviews,
          newRequests
        };
      })
    );

    return results;
  }

  async getTopProviders(limit: number = 10) {
    const providers = await this.prisma.provider.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        status: 'APPROVED'
      },
      take: limit,
      orderBy: [
        { viewsCount: 'desc' },
        { averageRating: 'desc' }
      ],
      include: {
        user: { select: { name: true, slug: true, avatarUrl: true } },
        City: true,
        _count: {
          select: {
            reviews: true,
            favoritedBy: true
          }
        }
      }
    });

    return providers;
  }

  async getMostClickedProviders(limit: number = 10) {
    const providers = await this.prisma.provider.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        status: 'APPROVED'
      },
      take: limit,
      orderBy: [
        { whatsappClicks: 'desc' }
      ],
      include: {
        user: { select: { name: true, slug: true, avatarUrl: true } },
        _count: {
          select: { reviews: true }
        }
      }
    });

    return providers;
  }

  async getPlanDistribution() {
    const plans = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'] as const;
    
    const distribution = await Promise.all(
      plans.map(async (plan) => {
        const count = await this.prisma.provider.count({
          where: { plan }
        });
        return { plan, count };
      })
    );

    return distribution;
  }

  async getCityStats() {
    const cities = await this.prisma.city.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            providers: true,
            events: true
          }
        }
      },
      orderBy: {
        providers: { _count: 'desc' }
      },
      take: 20
    });

    return cities.map(c => ({
      id: c.id,
      name: c.name,
      state: c.state,
      providersCount: c._count.providers,
      eventsCount: c._count.events
    }));
  }

  async getCategoryStats() {
    const categories = await this.prisma.category.findMany({
      where: { deletedAt: null, isActive: true },
      include: {
        _count: {
          select: { services: true }
        }
      },
      orderBy: {
        services: { _count: 'desc' }
      }
    });

    return categories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      servicesCount: c._count.services
    }));
  }
}