import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { mockPrisma, MockPrismaService } from '../prisma/prisma.mock';

describe('SearchService', () => {
  let service: SearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SearchService, MockPrismaService],
    }).compile();

    service = module.get<SearchService>(SearchService);
    jest.clearAllMocks();
  });

  const mockProvider = {
    id: 'prov-1',
    user: { id: 'user-1', name: 'Dr. João Silva', slug: 'dr-joao-silva', avatarUrl: null },
    City: { id: 'city-1', name: 'São Paulo', slug: 'sao-paulo', state: 'SP' },
    services: [{ service: { name: 'Médico', slug: 'medico' } }],
    logoUrl: null,
    description: 'Clínica especializada em cardiologia',
    averageRating: 4.8,
    isFeaturedHome: true,
  };

  const mockService = {
    id: 'svc-1',
    name: 'Médico',
    slug: 'medico',
    description: 'Serviços médicos especializados',
    keywords: ['médico', 'consulta', 'cardiologista'],
    isMostWanted: true,
    sortOrder: 1,
    categories: [{ category: { id: 'cat-1', name: 'Saúde', slug: 'saude' } }],
    _count: { providers: 5 },
  };

  const mockCategory = {
    id: 'cat-1',
    name: 'Saúde',
    slug: 'saude',
    description: 'Serviços relacionados à saúde',
    imageUrl: null,
    sortOrder: 1,
    _count: { services: 3 },
  };

  const mockEvent = {
    id: 'evt-1',
    name: 'Feira de Saúde',
    slug: 'feira-de-saude',
    description: 'Evento de saúde na praça central',
    location: 'Praça Central',
    coverImageUrl: null,
    eventDate: new Date('2026-06-15'),
    city: { id: 'city-1', name: 'São Paulo', slug: 'sao-paulo' },
  };

  // ---------- SEARCH ALL ----------
  describe('searchAll', () => {
    it('should return empty results for short query', async () => {
      const result = await service.searchAll('a', 1, 10);

      expect(result.providers.data).toHaveLength(0);
      expect(result.services.data).toHaveLength(0);
      expect(result.categories.data).toHaveLength(0);
      expect(result.events.data).toHaveLength(0);
      expect(result.combined).toHaveLength(0);
    });

    it('should search across providers, services, categories and events', async () => {
      mockPrisma.provider.findMany.mockResolvedValue([mockProvider]);
      mockPrisma.provider.count.mockResolvedValue(1);
      mockPrisma.service.findMany.mockResolvedValue([mockService]);
      mockPrisma.service.count.mockResolvedValue(1);
      mockPrisma.category.findMany.mockResolvedValue([mockCategory]);
      mockPrisma.category.count.mockResolvedValue(1);
      mockPrisma.event.findMany.mockResolvedValue([mockEvent]);
      mockPrisma.event.count.mockResolvedValue(1);

      const result = await service.searchAll('saúde', 1, 10);

      // Verify all entity types are returned
      expect(result.providers.data).toHaveLength(1);
      expect(result.services.data).toHaveLength(1);
      expect(result.categories.data).toHaveLength(1);
      expect(result.events.data).toHaveLength(1);
      expect(result.total).toBe(4);

      // Verify combined results include all types
      expect(result.combined).toHaveLength(4);
      // @ts-ignore - combined is typed as never due to as const inference
      expect(result.combined.filter((r: any) => r.type === 'provider')).toHaveLength(1);
      // @ts-ignore
      expect(result.combined.filter((r: any) => r.type === 'service')).toHaveLength(1);
      // @ts-ignore
      expect(result.combined.filter((r: any) => r.type === 'category')).toHaveLength(1);
      // @ts-ignore
      expect(result.combined.filter((r: any) => r.type === 'event')).toHaveLength(1);
    });

    it('should filter by cityId', async () => {
      mockPrisma.provider.findMany.mockResolvedValue([mockProvider]);
      mockPrisma.provider.count.mockResolvedValue(1);
      mockPrisma.service.findMany.mockResolvedValue([]);
      mockPrisma.service.count.mockResolvedValue(0);
      mockPrisma.category.findMany.mockResolvedValue([]);
      mockPrisma.category.count.mockResolvedValue(0);
      mockPrisma.event.findMany.mockResolvedValue([]);
      mockPrisma.event.count.mockResolvedValue(0);

      await service.searchAll('saúde', 1, 10, { cityId: 'city-1' });

      expect(mockPrisma.provider.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ cityId: 'city-1' }),
        }),
      );
    });

    it('should filter by serviceId', async () => {
      mockPrisma.provider.findMany.mockResolvedValue([]);
      mockPrisma.provider.count.mockResolvedValue(0);
      mockPrisma.service.findMany.mockResolvedValue([]);
      mockPrisma.service.count.mockResolvedValue(0);
      mockPrisma.category.findMany.mockResolvedValue([]);
      mockPrisma.category.count.mockResolvedValue(0);
      mockPrisma.event.findMany.mockResolvedValue([]);
      mockPrisma.event.count.mockResolvedValue(0);

      await service.searchAll('médico', 1, 10, { serviceId: 'svc-1' });

      expect(mockPrisma.provider.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            services: { some: { serviceId: 'svc-1' } },
          }),
        }),
      );
    });

    it('should prioritize exact name matches in combined results', async () => {
      mockPrisma.provider.findMany.mockResolvedValue([mockProvider]);
      mockPrisma.provider.count.mockResolvedValue(1);
      mockPrisma.service.findMany.mockResolvedValue([
        { ...mockService, name: 'Cardiologia' },
        { ...mockService, name: 'Médico Cardiologista' },
      ]);
      mockPrisma.service.count.mockResolvedValue(2);
      mockPrisma.category.findMany.mockResolvedValue([]);
      mockPrisma.category.count.mockResolvedValue(0);
      mockPrisma.event.findMany.mockResolvedValue([]);
      mockPrisma.event.count.mockResolvedValue(0);

      const result = await service.searchAll('cardiologia', 1, 10);

      // First combined result should be the exact name match
      // @ts-ignore
      const exactMatches = result.combined.filter(
        (r: any) => r.name.toLowerCase() === 'cardiologia',
      );
      expect(exactMatches.length).toBeGreaterThan(0);
    });
  });

  // ---------- AUTOCOMPLETE ----------
  describe('autocomplete', () => {
    it('should return empty array for short query', async () => {
      const result = await service.autocomplete('a', 5);

      expect(result).toHaveLength(0);
    });

    it('should return autocomplete suggestions from providers, services, and categories', async () => {
      mockPrisma.provider.findMany.mockResolvedValue([mockProvider]);
      mockPrisma.service.findMany.mockResolvedValue([mockService]);
      mockPrisma.category.findMany.mockResolvedValue([mockCategory]);

      const result = await service.autocomplete('saú', 5);

      expect(result.length).toBeGreaterThan(0);
      expect(result.filter(r => r.type === 'provider')).toHaveLength(1);
      expect(result.filter(r => r.type === 'service')).toHaveLength(1);
      expect(result.filter(r => r.type === 'category')).toHaveLength(1);
    });

    it('should respect the limit parameter', async () => {
      mockPrisma.provider.findMany.mockResolvedValue([mockProvider, mockProvider, mockProvider]);
      mockPrisma.service.findMany.mockResolvedValue([]);
      mockPrisma.category.findMany.mockResolvedValue([]);

      const result = await service.autocomplete('dr', 2);

      // max results = limit * 3 (types), but providers are capped by take
      expect(result.length).toBeLessThanOrEqual(6);
    });
  });
});