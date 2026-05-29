import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async searchAll(
    query: string,
    page: number = 1,
    limit: number = 10,
    filters?: any
  ) {
    const hasFilters = filters?.serviceId || filters?.cityId || filters?.categoryId;
    const hasQuery = query && query.trim().length >= 2;

    if (!hasQuery && !hasFilters) {
      return {
        providers: { data: [], meta: { total: 0, page, limit, totalPages: 0 } },
        services: { data: [], meta: { total: 0, page, limit, totalPages: 0 } },
        categories: { data: [], meta: { total: 0, page, limit, totalPages: 0 } },
        events: { data: [], meta: { total: 0, page, limit, totalPages: 0 } },
        combined: []
      };
    }

    const skip = (page - 1) * limit;
    const searchTerm = hasQuery ? query.trim() : '';

    // ──────────────────────────────────────────────
    // PROVIDERS
    // ──────────────────────────────────────────────
    const providerWhere: any = {
      deletedAt: null,
      isActive: true,
      status: 'APPROVED',
    };

    if (hasQuery) {
      providerWhere.OR = [
        { user: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { address: { contains: searchTerm, mode: 'insensitive' } },
        { keywords: { hasSome: [searchTerm] } },
        { cityName: { contains: searchTerm, mode: 'insensitive' } },
        { cityState: { contains: searchTerm, mode: 'insensitive' } },
        { City: { name: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    if (filters?.cityId) {
      providerWhere.AND = providerWhere.AND ?? [];
      providerWhere.AND.push({
        OR: [
          { cityId: filters.cityId },
          { address: 'Somente Online' },
        ],
      });
    }

    // serviceId e/ou categoryId nos providers
    if (filters?.serviceId || filters?.categoryId) {
      const providerServiceConditions: any[] = [];

      if (filters?.serviceId) {
        providerServiceConditions.push({ serviceId: filters.serviceId });
      }

      if (filters?.categoryId) {
        providerServiceConditions.push({
          service: {
            categories: {
              some: { categoryId: filters.categoryId },
            },
          },
        });
      }

      if (providerServiceConditions.length === 1) {
        providerWhere.services = { some: providerServiceConditions[0] };
      } else {
        providerWhere.services = {
          some: {
            AND: providerServiceConditions,
          },
        };
      }
    }

    const [providers, providersTotal] = await Promise.all([
      this.prisma.provider.findMany({
        where: providerWhere,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, slug: true, avatarUrl: true } },
          City: true,
          services: { include: { service: { select: { name: true, slug: true } } } }
        },
        orderBy: [
          { isFeaturedHome: 'desc' },
          { averageRating: 'desc' }
        ]
      }),
      this.prisma.provider.count({ where: providerWhere })
    ]);

    // ──────────────────────────────────────────────
    // SERVICES
    // ──────────────────────────────────────────────
    const serviceWhere: any = {
      deletedAt: null,
      isActive: true,
      providers: {
        some: {
          provider: {
          deletedAt: null,
          isActive: true,
          status: 'APPROVED',
        },
        },
      },
    };

    if (hasQuery) {
      serviceWhere.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { keywords: { hasSome: [searchTerm] } },
      ];
    }

    if (filters?.serviceId) {
      serviceWhere.id = filters.serviceId;
    }

    if (filters?.categoryId) {
      // se categoryId está setado, filtra serviços que pertencem à categoria
      serviceWhere.categories = {
        some: { categoryId: filters.categoryId },
      };
    }

    if (filters?.cityId) {
      serviceWhere.providers = {
        some: {
          provider: {
            deletedAt: null,
            isActive: true,
            status: 'APPROVED',
            OR: [
              { cityId: filters.cityId },
              { address: 'Somente Online' },
            ],
          },
        },
      };
    }

    const [services, servicesTotal] = await Promise.all([
      this.prisma.service.findMany({
        where: serviceWhere,
        skip,
        take: limit,
        include: {
          categories: { include: { category: { select: { id: true, name: true, slug: true } } } },
          _count: {
            select: {
              providers: {
                where: {
                  provider: {
                    deletedAt: null,
                    isActive: true,
                    status: 'APPROVED',
                  },
                },
              },
            },
          }
        },
        orderBy: [
          { isMostWanted: 'desc' },
          { sortOrder: 'asc' }
        ]
      }),
      this.prisma.service.count({ where: serviceWhere })
    ]);


    // ──────────────────────────────────────────────
    // CATEGORIES
    // ──────────────────────────────────────────────
    const baseCategoryServiceHasActiveProviders = {
      service: {
        deletedAt: null,
        isActive: true,
        providers: {
          some: {
            provider: {
              deletedAt: null,
              isActive: true,
              status: 'APPROVED',
            },
          },
        },
      },
    };

    const categoryWhere: any = {
      deletedAt: null,
      isActive: true,
      services: {
        some: baseCategoryServiceHasActiveProviders,
      },
    };

    if (hasQuery) {
      categoryWhere.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    if (filters?.categoryId) {
      categoryWhere.id = filters.categoryId;
    }

    if (filters?.serviceId || filters?.cityId) {
      const extraServiceConditions: any[] = [];

      if (filters?.serviceId) {
        extraServiceConditions.push({
          serviceId: filters.serviceId,
        });
      }

      if (filters?.cityId) {
        extraServiceConditions.push({
          service: {
            providers: {
              some: {
                provider: {
                  OR: [
                    { cityId: filters.cityId },
                    { address: 'Somente Online' },
                  ],
                },
              },
            },
          },
        });
      }

      categoryWhere.services = {
        some: {
          AND: [
            baseCategoryServiceHasActiveProviders,
            ...extraServiceConditions,
          ],
        },
      };
    }

    const [categories, categoriesTotal] = await Promise.all([
      this.prisma.category.findMany({
        where: categoryWhere,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              services: {
                where: {
                  service: {
                    deletedAt: null,
                    isActive: true,
                    providers: {
                      some: {
                        provider: {
                          deletedAt: null,
                          isActive: true,
                          status: 'APPROVED',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
      }),
      this.prisma.category.count({ where: categoryWhere })
    ]);

    // ──────────────────────────────────────────────
    // EVENTS
    // ──────────────────────────────────────────────
    const eventWhere: any = {
      deletedAt: null,
      isActive: true,
    };

    if (hasQuery) {
      eventWhere.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { location: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }

    if (filters?.cityId) {
      eventWhere.cityId = filters.cityId;
    }

    const [events, eventsTotal] = hasQuery || filters?.cityId
      ? await Promise.all([
          this.prisma.event.findMany({
            where: eventWhere,
            skip,
            take: limit,
            include: { city: { select: { id: true, name: true, slug: true } } },
            orderBy: { eventDate: 'asc' }
          }),
          this.prisma.event.count({ where: eventWhere })
        ])
      : [[], 0];

    // Build combined results for backwards compatibility
    const combined = [
      ...providers.map(p => ({
        type: 'provider' as const,
        id: p.id,
        name: p.user.name,
        slug: p.user.slug,
        image: p.logoUrl || p.user.avatarUrl,
        description: p.description,
        city: p.City?.name,
        rating: p.averageRating,
        matchType: 'provider'
      })),
      ...services.map(s => ({
        type: 'service' as const,
        id: s.id,
        name: s.name,
        slug: s.slug,
        image: null,
        description: s.description,
        city: null,
        rating: null,
        matchType: 'service'
      })),
      ...categories.map(c => ({
        type: 'category' as const,
        id: c.id,
        name: c.name,
        slug: c.slug,
        image: c.imageUrl,
        description: c.description,
        city: null,
        rating: null,
        matchType: 'category'
      })),
      ...events.map(e => ({
        type: 'event' as const,
        id: e.id,
        name: e.name,
        slug: e.slug,
        image: e.coverImageUrl,
        description: e.description,
        city: e.city?.name,
        rating: null,
        matchType: 'event'
      }))
    ];

    combined.sort((a, b) => {
      const aExact = a.name.toLowerCase() === searchTerm.toLowerCase() ? 0 : 1;
      const bExact = b.name.toLowerCase() === searchTerm.toLowerCase() ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      return 0;
    });

    return {
      providers: {
        data: providers,
        meta: { total: providersTotal, page, limit, totalPages: Math.ceil(providersTotal / limit) }
      },
      services: {
        data: services,
        meta: { total: servicesTotal, page, limit, totalPages: Math.ceil(servicesTotal / limit) }
      },
      categories: {
        data: categories,
        meta: { total: categoriesTotal, page, limit, totalPages: Math.ceil(categoriesTotal / limit) }
      },
      events: {
        data: events,
        meta: { total: eventsTotal, page, limit, totalPages: Math.ceil(eventsTotal / limit) }
      },
      combined,
      total: providersTotal + servicesTotal + categoriesTotal + eventsTotal
    };
  }

  async autocomplete(query: string, limit: number = 5) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = query.trim();

    const [providers, services, categories] = await Promise.all([
      this.prisma.provider.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          status: 'APPROVED',
          user: { name: { contains: searchTerm, mode: 'insensitive' } }
        },
        take: limit,
        include: {
          user: { select: { name: true, slug: true, avatarUrl: true } }
        },
        orderBy: [{ isFeaturedHome: 'desc' }, { averageRating: 'desc' }]
      }),
      this.prisma.service.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          name: { contains: searchTerm, mode: 'insensitive' }
        },
        take: limit,
        orderBy: [{ isMostWanted: 'desc' }, { sortOrder: 'asc' }]
      }),
      this.prisma.category.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          name: { contains: searchTerm, mode: 'insensitive' }
        },
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
      })
    ]);

    return [
      ...providers.map(p => ({
        type: 'provider' as const,
        id: p.id,
        name: p.user.name,
        slug: p.user.slug,
        image: p.logoUrl || p.user.avatarUrl,
        label: p.user.name
      })),
      ...services.map(s => ({
        type: 'service' as const,
        id: s.id,
        name: s.name,
        slug: s.slug,
        image: null,
        label: s.name
      })),
      ...categories.map(c => ({
        type: 'category' as const,
        id: c.id,
        name: c.name,
        slug: c.slug,
        image: c.imageUrl,
        label: c.name
      }))
    ].slice(0, limit * 3);
  }
}

