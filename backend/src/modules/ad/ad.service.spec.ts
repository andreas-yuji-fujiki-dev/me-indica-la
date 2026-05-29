import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdService } from './ad.service';
import { mockPrisma, MockPrismaService } from '../prisma/prisma.mock';

describe('AdService', () => {
  let service: AdService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdService, MockPrismaService],
    }).compile();

    service = module.get<AdService>(AdService);
    jest.clearAllMocks();
  });

  const mockAd = {
    id: 'ad-1',
    providerId: null,
    title: 'Anúncio Empresa X',
    imageUrl: 'https://example.com/banner.jpg',
    redirectUrl: 'https://empresax.com',
    position: 'home_top',
    viewsCount: 100,
    clicksCount: 10,
    isActive: true,
    startsAt: new Date('2026-01-01'),
    endsAt: new Date('2026-12-31'),
    createdAt: new Date(),
    provider: null,
  };

  // ---------- CREATE ----------
  describe('create', () => {
    it('should create an ad successfully', async () => {
      mockPrisma.ad.create.mockResolvedValue(mockAd);

      const result = await service.create({
        title: 'Anúncio Empresa X',
        imageUrl: 'https://example.com/banner.jpg',
        position: 'home_top',
      });

      expect(result).toEqual(mockAd);
    });

    it('should connect to provider if providerId is provided', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue({ id: 'prov-1', deletedAt: null });
      mockPrisma.ad.create.mockResolvedValue({ ...mockAd, providerId: 'prov-1' });

      const result = await service.create({
        title: 'Anúncio',
        imageUrl: 'https://example.com/banner.jpg',
        providerId: 'prov-1',
      });

      expect(result.providerId).toBe('prov-1');
    });

    it('should throw NotFoundException if provider not found', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(null);

      await expect(
        service.create({
          title: 'Anúncio',
          imageUrl: 'https://example.com/banner.jpg',
          providerId: 'invalid',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------- FIND ALL ----------
  describe('findAll', () => {
    it('should return paginated ads', async () => {
      mockPrisma.ad.findMany.mockResolvedValue([mockAd]);
      mockPrisma.ad.count.mockResolvedValue(1);

      const result = await service.findAll(1, 10, {});

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by isActive and position', async () => {
      mockPrisma.ad.findMany.mockResolvedValue([]);
      mockPrisma.ad.count.mockResolvedValue(0);

      await service.findAll(1, 10, { isActive: true, position: 'home_top' });

      expect(mockPrisma.ad.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true, position: 'home_top' }),
        }),
      );
    });

    it('should apply activeOnly filter with date range', async () => {
      mockPrisma.ad.findMany.mockResolvedValue([]);
      mockPrisma.ad.count.mockResolvedValue(0);

      await service.findAll(1, 10, { activeOnly: true });

      expect(mockPrisma.ad.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startsAt: { lte: expect.any(Date) },
            endsAt: { gte: expect.any(Date) },
          }),
        }),
      );
    });
  });

  // ---------- FIND ONE ----------
  describe('findOne', () => {
    it('should return an ad by ID', async () => {
      mockPrisma.ad.findUnique.mockResolvedValue(mockAd);

      const result = await service.findOne('ad-1');

      expect(result).toEqual(mockAd);
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.ad.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  // ---------- UPDATE ----------
  describe('update', () => {
    it('should update an ad', async () => {
      mockPrisma.ad.findUnique.mockResolvedValue(mockAd);
      mockPrisma.ad.update.mockResolvedValue({ ...mockAd, title: 'Novo Título' });

      const result = await service.update('ad-1', { title: 'Novo Título' });

      expect(result).toBeDefined();
    });

    it('should disconnect provider if providerId is null', async () => {
      const adWithProvider = { ...mockAd, providerId: 'prov-1' };
      mockPrisma.ad.findUnique.mockResolvedValue(adWithProvider);
      mockPrisma.ad.update.mockResolvedValue({ ...adWithProvider, providerId: null });

      await service.update('ad-1', { providerId: null } as any);

      expect(mockPrisma.ad.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ provider: { disconnect: true } }),
        }),
      );
    });
  });

  // ---------- REMOVE ----------
  describe('remove', () => {
    it('should delete an ad', async () => {
      mockPrisma.ad.findUnique.mockResolvedValue(mockAd);
      mockPrisma.ad.delete.mockResolvedValue(mockAd);

      const result = await service.remove('ad-1');

      expect(result.message).toContain('deleted');
    });
  });

  // ---------- INCREMENT CLICK ----------
  describe('incrementClick', () => {
    it('should increment click count', async () => {
      mockPrisma.ad.findUnique.mockResolvedValue(mockAd);
      mockPrisma.ad.update.mockResolvedValue({} as any);

      const result = await service.incrementClick('ad-1');

      expect(result.success).toBe(true);
      expect(mockPrisma.ad.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ad-1' },
          data: { clicksCount: { increment: 1 } },
        }),
      );
    });
  });

  // ---------- GET ACTIVE BY POSITION ----------
  describe('getActiveByPosition', () => {
    it('should return active ads for a position within date range', async () => {
      mockPrisma.ad.findMany.mockResolvedValue([mockAd]);

      const result = await service.getActiveByPosition('home_top');

      expect(result).toHaveLength(1);
      expect(mockPrisma.ad.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: true,
            position: 'home_top',
            startsAt: { lte: expect.any(Date) },
            endsAt: { gte: expect.any(Date) },
          },
        }),
      );
    });
  });
});