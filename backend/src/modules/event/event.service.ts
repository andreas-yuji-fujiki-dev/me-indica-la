import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createEventDto: CreateEventDto) {
    const existing = await this.prisma.event.findUnique({
      where: { slug: createEventDto.slug }
    });

    if (existing) {
      throw new ConflictException(`Event with slug ${createEventDto.slug} already exists`);
    }

    const data: any = {
      name: createEventDto.name,
      slug: createEventDto.slug,
      description: createEventDto.description,
      eventDate: new Date(createEventDto.eventDate),
      whatsapp: createEventDto.whatsapp,
      instagram: createEventDto.instagram,
      externalLink: createEventDto.externalLink,
      location: createEventDto.location,
      coverImageUrl: createEventDto.coverImageUrl,
      isActive: createEventDto.isActive ?? true,
      isSponsored: createEventDto.isSponsored ?? false,
    };

    if (createEventDto.cityId) {
      data.city = { connect: { id: createEventDto.cityId } };
    }

    if (createEventDto.createdByUserId) {
      data.createdByUser = { connect: { id: createEventDto.createdByUserId } };
    }

    if (createEventDto.createdByProviderId) {
      data.createdByProvider = { connect: { id: createEventDto.createdByProviderId } };
    }

    const event = await this.prisma.event.create({
      data,
      include: {
        city: { select: { id: true, name: true, slug: true, state: true } },
        createdByUser: { select: { id: true, name: true, slug: true, avatarUrl: true } },
        createdByProvider: { select: { id: true, user: { select: { name: true, slug: true } } } },
        _count: { select: { savedBy: true } }
      }
    });

    return event;
  }

  async findAll(page: number = 1, limit: number = 10, filters?: any) {
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.isSponsored !== undefined) {
      where.isSponsored = filters.isSponsored;
    }

    if (filters?.cityId) {
      where.cityId = filters.cityId;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters?.upcoming) {
      where.eventDate = { gte: new Date() };
    }

    if (filters?.past) {
      where.eventDate = { lt: new Date() };
    }

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        skip,
        take: limit,
        where,
        include: {
          city: { select: { id: true, name: true, slug: true, state: true } },
          createdByUser: { select: { id: true, name: true, slug: true, avatarUrl: true } },
          _count: { select: { savedBy: true } }
        },
        orderBy: [
          { isSponsored: 'desc' },
          { eventDate: filters?.past ? 'desc' : 'asc' }
        ]
      }),
      this.prisma.event.count({ where })
    ]);

    return {
      data: events,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, deletedAt: null },
      include: {
        city: { select: { id: true, name: true, slug: true, state: true } },
        createdByUser: { select: { id: true, name: true, slug: true, avatarUrl: true } },
        createdByProvider: { select: { id: true, user: { select: { name: true, slug: true } } } },
        savedBy: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } }
          },
          take: 10
        },
        _count: { select: { savedBy: true } }
      }
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async findBySlug(slug: string) {
    const event = await this.prisma.event.findFirst({
      where: { slug, deletedAt: null },
      include: {
        city: { select: { id: true, name: true, slug: true, state: true } },
        createdByUser: { select: { id: true, name: true, slug: true, avatarUrl: true } },
        _count: { select: { savedBy: true } }
      }
    });

    if (!event) {
      throw new NotFoundException(`Event with slug ${slug} not found`);
    }

    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto) {
    const event = await this.prisma.event.findFirst({
      where: { id, deletedAt: null }
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    if (updateEventDto.slug) {
      const existing = await this.prisma.event.findFirst({
        where: {
          slug: updateEventDto.slug,
          NOT: { id }
        }
      });

      if (existing) {
        throw new ConflictException(`Event with slug ${updateEventDto.slug} already exists`);
      }
    }

    const data: any = { ...updateEventDto };

    if (updateEventDto.eventDate) {
      data.eventDate = new Date(updateEventDto.eventDate);
    }

    if (updateEventDto.cityId) {
      data.city = { connect: { id: updateEventDto.cityId } };
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data,
      include: {
        city: { select: { id: true, name: true, slug: true, state: true } },
        _count: { select: { savedBy: true } }
      }
    });

    return updatedEvent;
  }

  async remove(id: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, deletedAt: null }
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    await this.prisma.event.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false
      }
    });

    return {
      message: 'Event successfully deleted',
      eventId: id
    };
  }

  async getUpcoming(page: number = 1, limit: number = 10) {
    return this.findAll(page, limit, { isActive: true, upcoming: true });
  }

  async getRecent(page: number = 1, limit: number = 10) {
    return this.findAll(page, limit, { isActive: true, past: true });
  }

  async toggleActive(id: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, deletedAt: null }
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: { isActive: !event.isActive }
    });

    return updatedEvent;
  }
}