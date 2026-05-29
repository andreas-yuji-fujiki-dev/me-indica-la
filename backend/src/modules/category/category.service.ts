import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const existingCategory = await this.prisma.category.findUnique({
      where: { slug: createCategoryDto.slug }
    });

    if (existingCategory) {
      throw new ConflictException(`Category with slug ${createCategoryDto.slug} already exists`);
    }

    const category = await this.prisma.category.create({
      data: createCategoryDto,
      include: {
        _count: {
          select: {
            services: true,
            providerRequests: true
          }
        }
      }
    });

    return category;
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

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        skip,
        take: limit,
        where,
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
              providerRequests: true,
            }
          }
        },
        orderBy: [
          { sortOrder: 'asc' },
          { isFeatured: 'desc' },
          { name: 'asc' }
        ]
      }),
      this.prisma.category.count({ where })
    ]);

    return {
      data: categories,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: {
        services: {
          include: {
            service: {
              include: {
                providers: {
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
                        }
                      }
                    }
                  }
                }
              }
            }
          }
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
            services: true,
            providerRequests: true
          }
        }
      }
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findFirst({
      where: { slug, deletedAt: null },
      include: {
        services: {
          include: {
            service: true
          }
        },
        _count: {
          select: {
            services: true,
            providerRequests: true
          }
        }
      }
    });

    if (!category) {
      throw new NotFoundException(`Category with slug ${slug} not found`);
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null }
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    if (updateCategoryDto.slug) {
      const existingCategory = await this.prisma.category.findFirst({
        where: {
          slug: updateCategoryDto.slug,
          NOT: { id }
        }
      });

      if (existingCategory) {
        throw new ConflictException(`Category with slug ${updateCategoryDto.slug} already exists`);
      }
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        _count: {
          select: {
            services: true,
            providerRequests: true
          }
        }
      }
    });

    return updatedCategory;
  }

  async remove(id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: {
        services: true,
        providerRequests: true
      }
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    if (category.services.length > 0) {
      await this.prisma.serviceCategory.deleteMany({
        where: { categoryId: id }
      });
    }

    if (category.providerRequests.length > 0) {
      await this.prisma.providerRequestCategory.deleteMany({
        where: { categoryId: id }
      });
    }

    await this.prisma.category.delete({ where: { id } });

    return { message: 'Category successfully deleted', categoryId: id };
  }

  async toggleActive(id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null }
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: { isActive: !category.isActive }
    });

    return updatedCategory;
  }

  async toggleFeatured(id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null }
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: { isFeatured: !category.isFeatured }
    });

    return updatedCategory;
  }

  async updateSortOrder(id: string, sortOrder: number) {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null }
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: { sortOrder }
    });

    return updatedCategory;
  }

  async getFeatured() {
    const categories = await this.prisma.category.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        isFeatured: true
      },
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
            }
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    return categories;
  }

  async getServices(id: string, page: number = 1, limit: number = 10, filters?: { search?: string }) {
    const skip = (page - 1) * limit;

    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null }
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    const whereClause: any = { categoryId: id };

    if (filters?.search) {
      whereClause.service = {
        name: { contains: filters.search, mode: 'insensitive' },
      };
    }

    const [services, total] = await Promise.all([
      this.prisma.serviceCategory.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          service: {
            include: {
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
                }
              },
              categories: true,
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
                }
              }
            }
          }
        },
        orderBy: { service: { sortOrder: 'asc' } }
      }),
      this.prisma.serviceCategory.count({ where: { categoryId: id } })
    ]);

    return {
      data: services.map(sc => sc.service),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}