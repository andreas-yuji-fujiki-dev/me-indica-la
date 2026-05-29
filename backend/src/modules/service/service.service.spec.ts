import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ServiceService } from './service.service';
import { mockPrisma, MockPrismaService } from '../prisma/prisma.mock';

describe('ServiceService', () => {
  let service: ServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceService, MockPrismaService],
    }).compile();

    service = module.get<ServiceService>(ServiceService);
    jest.clearAllMocks();
  });

  const mockService = {
    id: 'svc-1',
    name: 'Médico',
    slug: 'medico',
    description: 'Serviços médicos',
    keywords: ['médico', 'consulta'],
    isActive: true,
    isFeatured: true,
    isMostWanted: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    categories: [
      {
        category: {
          id: 'cat-1',
          name: 'Saúde',
          slug: 'saude',
        },
      },
    ],
    providers: [],
    providerRequests: [],
    favoritedBy: [],
    _count: { providers: 0, favoritedBy: 0, providerRequests: 0 },
  };

  // ---------- CREATE ----------
  describe('create', () => {
    it('should create a service with categories', async () => {
      mockPrisma.service.findUnique.mockResolvedValue(null);
      mockPrisma.service.create.mockResolvedValue(mockService);

      const result = await service.create({
        name: 'Médico',
        slug: 'medico',
        description: 'Serviços médicos',
        categoryIds: ['cat-1'],
      });

      expect(result).toEqual(mockService);
      expect(mockPrisma.service.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if slug exists', async () => {
      mockPrisma.service.findUnique.mockResolvedValue(mockService);

      await expect(
        service.create({ name: 'Médico', slug: 'medico' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ---------- FIND ALL ----------
  describe('findAll', () => {
    it('should return paginated services with filters', async () => {
      mockPrisma.service.findMany.mockResolvedValue([mockService]);
      mockPrisma.service.count.mockResolvedValue(1);

      const result = await service.findAll(1, 10, {
        isActive: true,
        isMostWanted: true,
        categoryId: 'cat-1',
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(mockPrisma.service.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            isMostWanted: true,
            categories: { some: { categoryId: 'cat-1' } },
          }),
        }),
      );
    });

    it('should search by name, description and keywords', async () => {
      mockPrisma.service.findMany.mockResolvedValue([]);
      mockPrisma.service.count.mockResolvedValue(0);

      await service.findAll(1, 10, { search: 'médico' });

      expect(mockPrisma.service.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ keywords: { has: 'médico' } }),
            ]),
          }),
        }),
      );
    });
  });

  // ---------- FIND ONE ----------
  describe('findOne', () => {
    it('should return a service by ID with full details', async () => {
      mockPrisma.service.findFirst.mockResolvedValue(mockService);

      const result = await service.findOne('svc-1');

      expect(result).toEqual(mockService);
      expect(result.categories).toBeDefined();
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.service.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  // ---------- FIND BY SLUG ----------
  describe('findBySlug', () => {
    it('should return a service by slug', async () => {
      mockPrisma.service.findFirst.mockResolvedValue(mockService);

      const result = await service.findBySlug('medico');

      expect(result).toEqual(mockService);
    });
  });

  // ---------- GET FEATURED ----------
  describe('getFeatured', () => {
    it('should return active featured services', async () => {
      mockPrisma.service.findMany.mockResolvedValue([mockService]);

      const result = await service.getFeatured();

      expect(result).toHaveLength(1);
      expect(mockPrisma.service.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null, isActive: true, isFeatured: true },
        }),
      );
    });
  });

  // ---------- GET MOST WANTED ----------
  describe('getMostWanted', () => {
    it('should return most wanted services with providers', async () => {
      mockPrisma.service.findMany.mockResolvedValue([mockService]);

      const result = await service.getMostWanted();

      expect(result).toHaveLength(1);
      expect(mockPrisma.service.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null, isActive: true, isMostWanted: true },
        }),
      );
    });
  });

  // ---------- GET PROVIDERS ----------
  describe('getProviders', () => {
    const mockProviderRelation = {
      provider: {
        id: 'prov-1',
        user: { id: 'user-1', name: 'Dr. João', email: 'joao@email.com', phone: '11999999999', avatarUrl: null, slug: 'dr-joao' },
        City: { id: 'city-1', name: 'São Paulo', slug: 'sao-paulo', state: 'SP' },
        reviews: [],
        _count: { reviews: 5, favoritedBy: 3 },
        averageRating: 4.5,
      },
    };

    it('should return paginated providers for a service', async () => {
      mockPrisma.service.findFirst.mockResolvedValue(mockService);
      mockPrisma.providerService.findMany.mockResolvedValue([mockProviderRelation]);
      mockPrisma.providerService.count.mockResolvedValue(1);

      const result = await service.getProviders('svc-1', 1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should throw NotFoundException if service not found', async () => {
      mockPrisma.service.findFirst.mockResolvedValue(null);

      await expect(service.getProviders('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ---------- GET CATEGORIES ----------
  describe('getCategories', () => {
    it('should return categories for a service', async () => {
      mockPrisma.service.findFirst.mockResolvedValue(mockService);
      mockPrisma.serviceCategory.findMany.mockResolvedValue([
        { category: { id: 'cat-1', name: 'Saúde', slug: 'saude', description: null, icon: null, imageUrl: null, isActive: true, isFeatured: false, sortOrder: 0, createdAt: new Date(), updatedAt: new Date(), deletedAt: null } },
      ]);

      const result = await service.getCategories('svc-1');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Saúde');
    });
  });

  // ---------- UPDATE ----------
  describe('update', () => {
    it('should update a service', async () => {
      mockPrisma.service.findFirst.mockResolvedValue(mockService);
      mockPrisma.service.update.mockResolvedValue(mockService);

      const result = await service.update('svc-1', { name: 'Clínico Geral' });

      expect(result).toBeDefined();
    });
  });

  // ---------- REMOVE ----------
  describe('remove', () => {
    it('should soft delete a service', async () => {
      mockPrisma.service.findFirst.mockResolvedValue({
        ...mockService,
        categories: [],
        providers: [],
        providerRequests: [],
        favoritedBy: [],
      });
      mockPrisma.service.update.mockResolvedValue({ ...mockService, deletedAt: new Date(), isActive: false });

      const result = await service.remove('svc-1');

      expect(result.message).toContain('deleted');
    });
  });

  // ---------- TOGGLES ----------
  describe('toggles', () => {
    it('should toggle isActive', async () => {
      mockPrisma.service.findFirst.mockResolvedValue(mockService);
      mockPrisma.service.update.mockResolvedValue({ ...mockService, isActive: false });
      expect((await service.toggleActive('svc-1')).isActive).toBe(false);
    });

    it('should toggle isFeatured', async () => {
      mockPrisma.service.findFirst.mockResolvedValue(mockService);
      mockPrisma.service.update.mockResolvedValue({ ...mockService, isFeatured: false });
      expect((await service.toggleFeatured('svc-1')).isFeatured).toBe(false);
    });

    it('should toggle isMostWanted', async () => {
      mockPrisma.service.findFirst.mockResolvedValue(mockService);
      mockPrisma.service.update.mockResolvedValue({ ...mockService, isMostWanted: false });
      expect((await service.toggleMostWanted('svc-1')).isMostWanted).toBe(false);
    });
  });

  describe('updateSortOrder', () => {
    it('should update sort order', async () => {
      mockPrisma.service.findFirst.mockResolvedValue(mockService);
      mockPrisma.service.update.mockResolvedValue({ ...mockService, sortOrder: 10 });
      expect((await service.updateSortOrder('svc-1', 10)).sortOrder).toBe(10);
    });
  });
});