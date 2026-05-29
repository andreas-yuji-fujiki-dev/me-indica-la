import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createReviewDto: CreateReviewDto) {
    const provider = await this.prisma.provider.findFirst({
      where: { id: createReviewDto.providerId, deletedAt: null }
    });

    if (!provider) {
      throw new NotFoundException(`Provider with ID ${createReviewDto.providerId} not found`);
    }

    // If userId provided, check user exists
    if (createReviewDto.userId) {
      const user = await this.prisma.user.findUnique({ where: { id: createReviewDto.userId } });
      if (!user) {
        throw new NotFoundException(`User with ID ${createReviewDto.userId} not found`);
      }

      // Check if user already reviewed this provider
      const existingReview = await this.prisma.review.findFirst({
        where: { providerId: createReviewDto.providerId, userId: createReviewDto.userId }
      });

      if (existingReview) {
        throw new BadRequestException('User has already reviewed this provider');
      }
    }

    const review = await this.prisma.review.create({
      data: createReviewDto,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });

    // Update provider average rating
    await this.updateProviderRating(createReviewDto.providerId);

    return review;
  }

  async findAll(
    providerId?: string,
    page: number = 1,
    limit: number = 10,
    filters?: any
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (providerId) {
      where.providerId = providerId;
    }

    if (filters?.isApproved !== undefined) {
      where.isApproved = filters.isApproved;
    }

    if (filters?.minRating) {
      where.rating = { gte: filters.minRating };
    }

    if (filters?.maxRating) {
      where.rating = { ...where.rating, lte: filters.maxRating };
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        skip,
        take: limit,
        where,
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true }
          },
          provider: {
            select: {
              id: true,
              user: { select: { name: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.review.count({ where })
    ]);

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        provider: {
          select: {
            id: true,
            user: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return review;
  }

  async update(id: string, updateReviewDto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id } });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    const updatedReview = await this.prisma.review.update({
      where: { id },
      data: updateReviewDto,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });

    // Update provider rating if rating changed
    if (updateReviewDto.rating) {
      await this.updateProviderRating(review.providerId);
    }

    return updatedReview;
  }

  async remove(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    const providerId = review.providerId;

    await this.prisma.review.delete({ where: { id } });

    // Update provider rating after deletion
    await this.updateProviderRating(providerId);

    return {
      message: 'Review successfully deleted',
      reviewId: id
    };
  }

  async approveReview(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    const updatedReview = await this.prisma.review.update({
      where: { id },
      data: { isApproved: true }
    });

    await this.updateProviderRating(review.providerId);

    return updatedReview;
  }

  async rejectReview(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    await this.prisma.review.delete({ where: { id } });

    await this.updateProviderRating(review.providerId);

    return {
      message: 'Review rejected and removed',
      reviewId: id
    };
  }

  private async updateProviderRating(providerId: string) {
    const result = await this.prisma.review.aggregate({
      where: { providerId, isApproved: true },
      _avg: { rating: true },
      _count: { rating: true }
    });

    await this.prisma.provider.update({
      where: { id: providerId },
      data: {
        averageRating: result._avg.rating || 0,
        totalReviews: result._count.rating
      }
    });
  }
}