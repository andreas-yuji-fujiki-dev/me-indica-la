import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ProviderService } from './provider.service';
import { mockPrisma, MockPrismaService } from '../prisma/prisma.mock';
import { ProviderStatus, PlanType } from '@prisma/client';

describe('ProviderService', () => {
  let service: ProviderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProviderService, MockPrismaService],
    }).compile();

    service = module.get<ProviderService>(ProviderService);
    jest.clearAllMocks();
  });

  const mockUser = {
    id: 'user-1',
    name: 'Dr. João',
    email: 'joao@email.com',
    phone: '11999999999',
    slug: 'dr-joao',
    avatarUrl: null,
    role: 'USER',
    providerProfile: null,
  };

  const mockCity = {
    id: 'city-1',
    name: 'São Paulo',
    slug: 'sao-paulo',
    state: 'SP',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProvider = {
    id: 'prov-1',
    userId: 'user-1',
    description: 'Clínica especializada',
    keywords: ['saúde', 'clínica'],
    whatsappBusiness: '5511999999999',
    instagram: '@drjoao',
    website: null,
    address: 'Rua A, 123',
    coordinates: null,
    logoUrl: null,
    coverImageUrl: null,
    businessLicense: null,
    averageRating: 4.5,
    totalReviews: 10,
    viewsCount: 100,
    whatsappClicks: 20,
    instagramClicks: 15,
    websiteClicks: 5,
    isActive: true,
    isVerified: true,
    isFeaturedHome: true,
    isFeaturedCategory: false,
    featuredPriority: 5,
    isAdvertiser: true,
    status: ProviderStatus.APPROVED,
    plan: PlanType.PREMIUM,
    planExpiresAt: new Date('2027-01-01'),
    businessHours: null,
    cityId: 'city-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    City: mockCity,
    services: [
      {
        service: {
          id: 'svc-1',
          name: 'Médico',
          slug: 'medico',
        },
      },
    ],
    reviews: [],
    galleryImages: [],
    ads: [],
    events: [],
    _count: { reviews: 10, favoritedBy: 5, galleryImages: 3, ads: 1, events: 0 },
  };

  const mockProviderSimple = {
    id: 'prov-1',
    userId: 'user-1',
    isFeaturedHome: true,
    featuredPriority: 5,
    isVerified: true,
    averageRating: 4.5,
    isActive: true,
    deletedAt: null,
    status: ProviderStatus.APPROVED,
    plan: PlanType.PREMIUM,
    City: mockCity,
    user: mockUser,
  };

  // ---------- CREATE ----------
  describe('create', () => {
    it('should create a provider profile and upgrade user role', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.provider.create.mockResolvedValue(mockProvider);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, role: 'PROVIDER' });

      const result = await service.create({
        userId: 'user-1',
        description: 'Clínica especializada',
        whatsappBusiness: '+5511999999999',
        address: 'Rua A, 123',
        coordinates: { lat: -23.561, lng: -46.656 },
        logoUrl: 'https://cdn.com/logo.jpg',
        businessHours: { mon: { open: true, start: '08:00', end: '18:00' } },
        serviceIds: ['svc-1'],
      });

      expect(result).toEqual(mockProvider);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { role: 'PROVIDER' },
        }),
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const minDto = {
        userId: 'invalid',
        description: 'x',
        whatsappBusiness: '+5511999999999',
        address: 'Rua A',
        coordinates: { lat: 0, lng: 0 },
        logoUrl: 'https://cdn.com/logo.jpg',
        businessHours: {},
      };

      await expect(
        service.create(minDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if user already has a provider profile', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        providerProfile: { id: 'prov-1' },
      });

      const minDto = {
        userId: 'user-1',
        description: 'x',
        whatsappBusiness: '+5511999999999',
        address: 'Rua A',
        coordinates: { lat: 0, lng: 0 },
        logoUrl: 'https://cdn.com/logo.jpg',
        businessHours: {},
      };

      await expect(
        service.create(minDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ---------- FIND ALL ----------
  describe('findAll', () => {
    it('should return paginated providers with filters', async () => {
      mockPrisma.provider.findMany.mockResolvedValue([mockProviderSimple]);
      mockPrisma.provider.count.mockResolvedValue(1);

      const result = await service.findAll(1, 10, {
        status: 'APPROVED',
        plan: 'PREMIUM',
        cityId: 'city-1',
        serviceId: 'svc-1',
        isVerified: true,
        isFeaturedHome: true,
        minRating: 4,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should search by user name, description and keywords', async () => {
      mockPrisma.provider.findMany.mockResolvedValue([]);
      mockPrisma.provider.count.mockResolvedValue(0);

      await service.findAll(1, 10, { search: 'joão' });

      expect(mockPrisma.provider.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ description: { contains: 'joão', mode: 'insensitive' } }),
            ]),
          }),
        }),
      );
    });
  });

  // ---------- FIND ONE ----------
  describe('findOne', () => {
    it('should return a provider with all relations and increment views', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(mockProvider);
      mockPrisma.provider.update.mockResolvedValue({ ...mockProvider, viewsCount: 101 });

      const result = await service.findOne('prov-1');

      expect(result).toEqual(mockProvider);
      expect(mockPrisma.provider.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prov-1' },
          data: { viewsCount: { increment: 1 } },
        }),
      );
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  // ---------- FIND BY USER ID ----------
  describe('findByUserId', () => {
    it('should return provider by user ID', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(mockProvider);

      const result = await service.findByUserId('user-1');

      expect(result).toEqual(mockProvider);
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(null);

      await expect(service.findByUserId('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  // ---------- FIND BY SLUG ----------
  describe('findBySlug', () => {
    it('should return provider by user slug', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(mockProvider);

      const result = await service.findBySlug('dr-joao');

      expect(result).toEqual(mockProvider);
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(null);

      await expect(service.findBySlug('inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  // ---------- UPDATE ----------
  describe('update', () => {
    it('should update a provider', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(mockProviderSimple);
      mockPrisma.provider.update.mockResolvedValue(mockProvider);

      const result = await service.update('prov-1', { description: 'Nova descrição' });

      expect(result).toBeDefined();
    });
  });

  // ---------- REMOVE ----------
  describe('remove', () => {
    it('should soft delete a provider', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(mockProviderSimple);
      mockPrisma.provider.update.mockResolvedValue({
        ...mockProvider,
        deletedAt: new Date(),
        isActive: false,
        status: ProviderStatus.SUSPENDED,
      });

      const result = await service.remove('prov-1');

      expect(result.message).toContain('deleted');
    });
  });

  // ---------- APPROVE ----------
  describe('approveProvider', () => {
    it('should approve a provider', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(mockProviderSimple);
      mockPrisma.provider.update.mockResolvedValue({
        ...mockProviderSimple,
        status: ProviderStatus.APPROVED,
        isActive: true,
      } as any);

      const result = await service.approveProvider('prov-1');

      expect(result.status).toBe(ProviderStatus.APPROVED);
      expect(result.isActive).toBe(true);
    });
  });

  // ---------- REJECT ----------
  describe('rejectProvider', () => {
    it('should reject a provider with reason', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(mockProviderSimple);
      mockPrisma.provider.update.mockResolvedValue({
        ...mockProviderSimple,
        status: ProviderStatus.REJECTED,
        isActive: false,
      } as any);

      const result = await service.rejectProvider('prov-1', 'Documentos incompletos');

      expect(result.status).toBe(ProviderStatus.REJECTED);
      expect(result.isActive).toBe(false);
    });
  });

  // ---------- UPDATE PLAN ----------
  describe('updatePlan', () => {
    it('should update plan and set isAdvertiser for non-free plans', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(mockProviderSimple);
      mockPrisma.provider.update.mockResolvedValue({
        ...mockProviderSimple,
        plan: PlanType.PREMIUM,
        isAdvertiser: true,
        planExpiresAt: expect.any(Date),
      } as any);

      const result = await service.updatePlan('prov-1', PlanType.PREMIUM, 365);

      expect(result.isAdvertiser).toBe(true);
    });

    it('should set isAdvertiser false for FREE plan', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(mockProviderSimple);
      mockPrisma.provider.update.mockResolvedValue({
        ...mockProviderSimple,
        plan: PlanType.FREE,
        isAdvertiser: false,
      } as any);

      const result = await service.updatePlan('prov-1', PlanType.FREE);

      expect(result.isAdvertiser).toBe(false);
    });
  });

  // ---------- INCREMENT CLICK ----------
  describe('incrementClick', () => {
    it('should increment whatsapp clicks', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(mockProviderSimple);
      mockPrisma.provider.update.mockResolvedValue({} as any);

      const result = await service.incrementClick('prov-1', 'whatsapp');

      expect(result.success).toBe(true);
      expect(mockPrisma.provider.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prov-1' },
          data: { whatsappClicks: { increment: 1 } },
        }),
      );
    });

    it('should increment instagram clicks', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(mockProviderSimple);
      mockPrisma.provider.update.mockResolvedValue({} as any);

      await service.incrementClick('prov-1', 'instagram');

      expect(mockPrisma.provider.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { instagramClicks: { increment: 1 } },
        }),
      );
    });
  });

  // ---------- TOGGLE FEATURE ----------
  describe('toggleFeature', () => {
    it('should toggle isFeaturedHome', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(mockProviderSimple);
      mockPrisma.provider.update.mockResolvedValue({
        ...mockProviderSimple,
        isFeaturedHome: false,
      } as any);

      const result = await service.toggleFeature('prov-1', 'home');

      expect(result.isFeaturedHome).toBe(false);
    });
  });

  // ---------- GET FEATURED ----------
  describe('getFeatured', () => {
    it('should return featured providers', async () => {
      mockPrisma.provider.findMany.mockResolvedValue([mockProviderSimple]);

      const result = await service.getFeatured(1, 10);

      expect(result).toHaveLength(1);
      expect(mockPrisma.provider.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deletedAt: null,
            isActive: true,
            status: ProviderStatus.APPROVED,
            isFeaturedHome: true,
          },
        }),
      );
    });
  });

  // ---------- GET NEARBY ----------
  describe('getNearby', () => {
    it('should return providers by city', async () => {
      mockPrisma.provider.findMany.mockResolvedValue([mockProviderSimple]);

      const result = await service.getNearby('city-1', 1, 10);

      expect(result).toHaveLength(1);
      expect(mockPrisma.provider.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ cityId: 'city-1' }),
        }),
      );
    });
  });
});