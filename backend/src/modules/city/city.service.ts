import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';

@Injectable()
export class CityService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCityDto: CreateCityDto) {
    const existing = await this.prisma.city.findUnique({
      where: { slug: createCityDto.slug }
    });

    if (existing) {
      throw new ConflictException(`City with slug ${createCityDto.slug} already exists`);
    }

    const city = await this.prisma.city.create({
      data: createCityDto,
      include: {
        _count: {
          select: {
            providers: true,
            events: true,
            users: true
          }
        }
      }
    });

    return city;
  }

  async findAll(page: number = 1, limit: number = 10, filters?: any) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.state) {
      where.state = filters.state;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const [cities, total] = await Promise.all([
      this.prisma.city.findMany({
        skip,
        take: limit,
        where,
        include: {
          _count: {
            select: {
              providers: true,
              events: true,
              users: true
            }
          }
        },
        orderBy: [
          { name: 'asc' }
        ]
      }),
      this.prisma.city.count({ where })
    ]);

    return {
      data: cities,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: string) {
    const city = await this.prisma.city.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            providers: true,
            events: true,
            users: true
          }
        }
      }
    });

    if (!city) {
      throw new NotFoundException(`City with ID ${id} not found`);
    }

    return city;
  }

  async findBySlug(slug: string) {
    const city = await this.prisma.city.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            providers: true,
            events: true,
            users: true
          }
        }
      }
    });

    if (!city) {
      throw new NotFoundException(`City with slug ${slug} not found`);
    }

    return city;
  }

  async findByState(state: string) {
    const cities = await this.prisma.city.findMany({
      where: { state: state as any, isActive: true },
      include: {
        _count: {
          select: {
            providers: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return cities;
  }

  async update(id: string, updateCityDto: UpdateCityDto) {
    const city = await this.prisma.city.findUnique({ where: { id } });

    if (!city) {
      throw new NotFoundException(`City with ID ${id} not found`);
    }

    if (updateCityDto.slug) {
      const existing = await this.prisma.city.findFirst({
        where: {
          slug: updateCityDto.slug,
          NOT: { id }
        }
      });

      if (existing) {
        throw new ConflictException(`City with slug ${updateCityDto.slug} already exists`);
      }
    }

    const updatedCity = await this.prisma.city.update({
      where: { id },
      data: {
        ...updateCityDto,
        ...(updateCityDto.isActive === true ? { deletedAt: null } : {}),
      },
      include: {
        _count: {
          select: {
            providers: true,
            events: true,
            users: true
          }
        }
      }
    });

    return updatedCity;
  }

  async remove(id: string) {
    const city = await this.prisma.city.findUnique({ where: { id } });

    if (!city) {
      throw new NotFoundException(`City with ID ${id} not found`);
    }

    await this.prisma.city.delete({ where: { id } });

    return {
      message: 'City successfully deactivated',
      cityId: id
    };
  }

  async toggleActive(id: string) {
    const city = await this.prisma.city.findUnique({ where: { id } });

    if (!city) {
      throw new NotFoundException(`City with ID ${id} not found`);
    }

    const updatedCity = await this.prisma.city.update({
      where: { id },
      data: { isActive: !city.isActive }
    });

    return updatedCity;
  }
}