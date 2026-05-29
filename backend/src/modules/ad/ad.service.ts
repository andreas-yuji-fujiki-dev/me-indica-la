import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';

@Injectable()
export class AdService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAdDto: CreateAdDto) {
    const data: any = {
      title: createAdDto.title,
      imageUrl: createAdDto.imageUrl,
      redirectUrl: createAdDto.redirectUrl,
      position: createAdDto.position,
      isActive: createAdDto.isActive ?? true,
      startsAt: createAdDto.startsAt ? new Date(createAdDto.startsAt) : undefined,
      endsAt: createAdDto.endsAt ? new Date(createAdDto.endsAt) : undefined,
    };

    if (createAdDto.providerId) {
      const provider = await this.prisma.provider.findFirst({
        where: { id: createAdDto.providerId, deletedAt: null }
      });

      if (!provider) {
        throw new NotFoundException(`Provider with ID ${createAdDto.providerId} not found`);
      }

      data.provider = { connect: { id: createAdDto.providerId } };
    }

    const ad = await this.prisma.ad.create({
      data,
      include: {
        provider: {
          select: {
            id: true,
            user: {
              select: { name: true, slug: true }
            }
          }
        }
      }
    });

    return ad;
  }

  async findAll(page: number = 1, limit: number = 10, filters?: any) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.position) {
      where.position = filters.position;
    }

    if (filters?.providerId) {
      where.providerId = filters.providerId;
    }

    const now = new Date();

    if (filters?.activeOnly) {
      where.startsAt = { lte: now };
      where.endsAt = { gte: now };
    }

    const [ads, total] = await Promise.all([
      this.prisma.ad.findMany({
        skip,
        take: limit,
        where,
        include: {
          provider: {
            select: {
              id: true,
              user: {
                select: { name: true, slug: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.ad.count({ where })
    ]);

    return {
      data: ads,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: string) {
    const ad = await this.prisma.ad.findUnique({
      where: { id },
      include: {
        provider: {
          select: {
            id: true,
            user: {
              select: { name: true, slug: true }
            }
          }
        }
      }
    });

    if (!ad) {
      throw new NotFoundException(`Ad with ID ${id} not found`);
    }

    return ad;
  }

  async update(id: string, updateAdDto: UpdateAdDto) {
    const ad = await this.prisma.ad.findUnique({ where: { id } });

    if (!ad) {
      throw new NotFoundException(`Ad with ID ${id} not found`);
    }

    const data: any = { ...updateAdDto };

    if (updateAdDto.startsAt) {
      data.startsAt = new Date(updateAdDto.startsAt);
    }

    if (updateAdDto.endsAt) {
      data.endsAt = new Date(updateAdDto.endsAt);
    }

    if (updateAdDto.providerId === null) {
      data.provider = { disconnect: true };
      delete data.providerId;
    } else if (updateAdDto.providerId) {
      data.provider = { connect: { id: updateAdDto.providerId } };
      delete data.providerId;
    }

    const updatedAd = await this.prisma.ad.update({
      where: { id },
      data,
      include: {
        provider: {
          select: {
            id: true,
            user: {
              select: { name: true, slug: true }
            }
          }
        }
      }
    });

    return updatedAd;
  }

  async remove(id: string) {
    const ad = await this.prisma.ad.findUnique({ where: { id } });

    if (!ad) {
      throw new NotFoundException(`Ad with ID ${id} not found`);
    }

    await this.prisma.ad.delete({ where: { id } });

    return {
      message: 'Ad successfully deleted',
      adId: id
    };
  }

  async incrementClick(id: string) {
    const ad = await this.prisma.ad.findUnique({ where: { id } });

    if (!ad) {
      throw new NotFoundException(`Ad with ID ${id} not found`);
    }

    await this.prisma.ad.update({
      where: { id },
      data: { clicksCount: { increment: 1 } }
    });

    return { success: true };
  }

  async getActiveByPosition(position: string) {
    const now = new Date();

    const ads = await this.prisma.ad.findMany({
      where: {
        isActive: true,
        position,
        startsAt: { lte: now },
        endsAt: { gte: now }
      },
      include: {
        provider: {
          select: {
            id: true,
            user: {
              select: { name: true, slug: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return ads;
  }
}