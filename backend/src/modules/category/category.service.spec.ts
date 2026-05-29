import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CategoryService } from './category.service';
import { mockPrisma, MockPrismaService } from '../prisma/prisma.mock';

describe('CategoryService', () => {
  let service: CategoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoryService, MockPrismaService],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    jest.clearAllMocks();
  });

  const mockCategory = {
    id: 'cat-1',
    name: 'Saúde',
    slug: 'saude',
    description: 'Serviços de saúde',
    icon: 'medical-icon',
    imageUrl: null,
    isActive: true,
    isFeatured: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockFullCategory = {
    ...mockCategory,
    services: [
      {
        service: {
          id: 'svc-1',
          name: 'Médico',
          slug: 'medico',
          providers: [],
          categories: [],
          description: null,
          keywords: [],
          isActive: true,
          isFeatured: false,
          isMostWanted: false,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      },
    ],
    providerRequests: [],
    _count: { services: 1, providerRequests: 0 },
  };

  // ---------- CREATE ----------
  describe('create', () => {
    it('should create a category successfully', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue(mockCategory);

      const result = await service.create({
        name: 'Saúde',
        slug: 'saude',
        description: 'Serviços de saúde',
        icon: 'medical-icon',
      });

      expect(result).toEqual(mockCategory);
      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
        where: { slug: 'saude' },
      });
      expect(mockPrisma.category.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if slug already exists', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);

      await expect(
        service.create({ name: 'Saúde', slug: 'saude' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ---------- FIND ALL ----------
  describe('findAll', () => {
    it('should return paginated categories', async () => {
      mockPrisma.category.findMany.mockResolvedValue([mockFullCategory]);
      mockPrisma.category.count.mockResolvedValue(1);

      const result = await service.findAll(1, 10, {});

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should filter by isActive', async () => {
      mockPrisma.category.findMany.mockResolvedValue([]);
      mockPrisma.category.count.mockResolvedValue(0);

      await service.findAll(1, 10, { isActive: true });

      expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });

    it('should search by name or description', async () => {
      mockPrisma.category.findMany.mockResolvedValue([]);
      mockPrisma.category.count.mockResolvedValue(0);

      await service.findAll(1, 10, { search: 'saude' });

      expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: { contains: 'saude', mode: 'insensitive' } }),
            ]),
          }),
        }),
      );
    });
  });

  // ---------- FIND ONE ----------
  describe('findOne', () => {
    it('should return a category by ID', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockFullCategory);

      const result = await service.findOne('cat-1');

      expect(result).toEqual(mockFullCategory);
      expect(result.services).toBeDefined();
    });

    it('should throw NotFoundException if category not found', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ---------- FIND BY SLUG ----------
  describe('findBySlug', () => {
    it('should return a category by slug', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockFullCategory);

      const result = await service.findBySlug('saude');

      expect(result).toEqual(mockFullCategory);
    });

    it('should throw NotFoundException if slug not found', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null);

      await expect(service.findBySlug('inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  // ---------- GET FEATURED ----------
  describe('getFeatured', () => {
    it('should return only active and featured categories', async () => {
      mockPrisma.category.findMany.mockResolvedValue([mockFullCategory]);

      const result = await service.getFeatured();

      expect(result).toHaveLength(1);
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null, isActive: true, isFeatured: true },
        }),
      );
    });
  });

  // ---------- GET SERVICES ----------
  describe('getServices', () => {
    it('should return paginated services for a category', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory);
      mockPrisma.serviceCategory.findMany.mockResolvedValue([
        { service: mockFullCategory.services[0].service },
      ]);
      mockPrisma.serviceCategory.count.mockResolvedValue(1);

      const result = await service.getServices('cat-1', 1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should throw NotFoundException if category not found', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null);

      await expect(service.getServices('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ---------- UPDATE ----------
  describe('update', () => {
    it('should update a category', async () => {
      mockPrisma.category.findFirst
        .mockResolvedValueOnce(mockCategory)   // first call: check existence
        .mockResolvedValueOnce(null);           // second call: check slug conflict
      mockPrisma.category.update.mockResolvedValue(mockCategory);

      const result = await service.update('cat-1', { name: 'Saúde Atualizado' });

      expect(result).toBeDefined();
      expect(mockPrisma.category.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if category not found', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null);

      await expect(service.update('invalid-id', { name: 'Novo' })).rejects.toThrow(NotFoundException);
    });
  });

  // ---------- REMOVE (soft delete) ----------
  describe('remove', () => {
    it('should soft delete a category', async () => {
      mockPrisma.category.findFirst.mockResolvedValue({
        ...mockCategory,
        services: [],
        providerRequests: [],
      });
      mockPrisma.category.update.mockResolvedValue({
        ...mockCategory,
        deletedAt: new Date(),
        isActive: false,
      });

      const result = await service.remove('cat-1');

      expect(result.message).toContain('deleted');
      expect(mockPrisma.category.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cat-1' },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
    });

    it('should throw NotFoundException if category not found', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ---------- TOGGLE ACTIVE ----------
  describe('toggleActive', () => {
    it('should toggle isActive', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory);
      mockPrisma.category.update.mockResolvedValue({
        ...mockCategory,
        isActive: false,
      });

      const result = await service.toggleActive('cat-1');

      expect(result.isActive).toBe(false);
    });
  });

  // ---------- TOGGLE FEATURED ----------
  describe('toggleFeatured', () => {
    it('should toggle isFeatured', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory);
      mockPrisma.category.update.mockResolvedValue({
        ...mockCategory,
        isFeatured: false,
      });

      const result = await service.toggleFeatured('cat-1');

      expect(result.isFeatured).toBe(false);
    });
  });

  // ---------- UPDATE SORT ORDER ----------
  describe('updateSortOrder', () => {
    it('should update sortOrder', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory);
      mockPrisma.category.update.mockResolvedValue({
        ...mockCategory,
        sortOrder: 5,
      });

      const result = await service.updateSortOrder('cat-1', 5);

      expect(result.sortOrder).toBe(5);
    });
  });
});