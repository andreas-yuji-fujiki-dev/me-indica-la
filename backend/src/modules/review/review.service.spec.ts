import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ReviewService } from './review.service';
import { mockPrisma, MockPrismaService } from '../prisma/prisma.mock';

describe('ReviewService', () => {
  let service: ReviewService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReviewService, MockPrismaService],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
    jest.clearAllMocks();
  });

  const mockProvider = {
    id: 'prov-1',
    userId: 'user-1',
    deletedAt: null,
  };

  const mockUser = {
    id: 'user-1',
    name: 'Maria',
    avatarUrl: null,
  };

  const mockReview = {
    id: 'rev-1',
    providerId: 'prov-1',
    userId: 'user-1',
    authorName: null,
    rating: 5,
    comment: 'Excelente serviço! Recomendo.',
    isApproved: false,
    createdAt: new Date(),
    user: mockUser,
    provider: {
      id: 'prov-1',
      user: { name: 'Dr. João' },
    },
  };

  // ---------- CREATE ----------
  describe('create', () => {
    it('should create a review and update provider rating', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(mockProvider);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.review.findFirst.mockResolvedValue(null);
      mockPrisma.review.create.mockResolvedValue(mockReview);
      mockPrisma.review.aggregate.mockResolvedValue({
        _avg: { rating: 5 },
        _count: { rating: 1 },
      });
      mockPrisma.provider.update.mockResolvedValue({} as any);

      const result = await service.create({
        providerId: 'prov-1',
        userId: 'user-1',
        rating: 5,
        comment: 'Excelente serviço! Recomendo.',
      });

      expect(result).toEqual(mockReview);
      expect(mockPrisma.provider.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if provider not found', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(null);

      await expect(
        service.create({ providerId: 'invalid', rating: 5 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user already reviewed', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(mockProvider);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.review.findFirst.mockResolvedValue(mockReview);

      await expect(
        service.create({ providerId: 'prov-1', userId: 'user-1', rating: 4 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a review without userId (anonymous)', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(mockProvider);
      mockPrisma.review.create.mockResolvedValue({
        ...mockReview,
        userId: null,
        authorName: 'Visitante',
        user: null,
      });
      mockPrisma.review.aggregate.mockResolvedValue({
        _avg: { rating: 5 },
        _count: { rating: 1 },
      });
      mockPrisma.provider.update.mockResolvedValue({} as any);

      const result = await service.create({
        providerId: 'prov-1',
        authorName: 'Visitante',
        rating: 5,
      });

      expect(result.rating).toBe(5);
      expect(result.authorName).toBe('Visitante');
    });
  });

  // ---------- FIND ALL ----------
  describe('findAll', () => {
    it('should return paginated reviews', async () => {
      mockPrisma.review.findMany.mockResolvedValue([mockReview]);
      mockPrisma.review.count.mockResolvedValue(1);

      const result = await service.findAll('prov-1', 1, 10, {});

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by isApproved', async () => {
      mockPrisma.review.findMany.mockResolvedValue([]);
      mockPrisma.review.count.mockResolvedValue(0);

      await service.findAll(undefined, 1, 10, { isApproved: true });

      expect(mockPrisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isApproved: true }),
        }),
      );
    });

    it('should filter by rating range', async () => {
      mockPrisma.review.findMany.mockResolvedValue([]);
      mockPrisma.review.count.mockResolvedValue(0);

      await service.findAll(undefined, 1, 10, { minRating: 3, maxRating: 5 });

      expect(mockPrisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            rating: { gte: 3, lte: 5 },
          }),
        }),
      );
    });
  });

  // ---------- FIND ONE ----------
  describe('findOne', () => {
    it('should return a review by ID', async () => {
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);

      const result = await service.findOne('rev-1');

      expect(result).toEqual(mockReview);
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.review.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  // ---------- UPDATE ----------
  describe('update', () => {
    it('should update a review and recalculate rating', async () => {
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);
      mockPrisma.review.update.mockResolvedValue({ ...mockReview, rating: 4 });
      mockPrisma.review.aggregate.mockResolvedValue({
        _avg: { rating: 4 },
        _count: { rating: 1 },
      });
      mockPrisma.provider.update.mockResolvedValue({} as any);

      const result = await service.update('rev-1', { rating: 4 });

      expect(result).toBeDefined();
    });
  });

  // ---------- REMOVE ----------
  describe('remove', () => {
    it('should delete a review and update rating', async () => {
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);
      mockPrisma.review.delete.mockResolvedValue(mockReview);
      mockPrisma.review.aggregate.mockResolvedValue({
        _avg: { rating: 0 },
        _count: { rating: 0 },
      });
      mockPrisma.provider.update.mockResolvedValue({} as any);

      const result = await service.remove('rev-1');

      expect(result.message).toContain('deleted');
    });
  });

  // ---------- APPROVE ----------
  describe('approveReview', () => {
    it('should approve a review and recalculate rating', async () => {
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);
      mockPrisma.review.update.mockResolvedValue({ ...mockReview, isApproved: true });
      mockPrisma.review.aggregate.mockResolvedValue({
        _avg: { rating: 5 },
        _count: { rating: 1 },
      });
      mockPrisma.provider.update.mockResolvedValue({} as any);

      const result = await service.approveReview('rev-1');

      expect(result.isApproved).toBe(true);
    });
  });

  // ---------- REJECT ----------
  describe('rejectReview', () => {
    it('should reject (delete) a review', async () => {
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);
      mockPrisma.review.delete.mockResolvedValue(mockReview);
      mockPrisma.review.aggregate.mockResolvedValue({
        _avg: { rating: 0 },
        _count: { rating: 0 },
      });
      mockPrisma.provider.update.mockResolvedValue({} as any);

      const result = await service.rejectReview('rev-1');

      expect(result.message).toContain('rejected');
    });
  });
});