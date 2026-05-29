import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import supertest from 'supertest';
const request = supertest;
import { AppModule } from '../src/app.module';
import { mockPrisma } from '../src/modules/prisma/prisma.mock';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { ProviderStatus, PlanType } from '@prisma/client';

describe('API Integration Tests (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  const baseUrl = '/api/v1';

  // Shared mock responses
  const mockCategory = {
    id: 'cat-1', name: 'Saúde', slug: 'saude', description: 'Serviços de saúde',
    icon: null, imageUrl: null, isActive: true, isFeatured: true, sortOrder: 1,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), deletedAt: null,
    _count: { services: 2, providerRequests: 0 },
  };

  const mockService = {
    id: 'svc-1', name: 'Médico', slug: 'medico', description: 'Serviços médicos',
    keywords: ['médico', 'consulta'], isActive: true, isFeatured: true, isMostWanted: true,
    sortOrder: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), deletedAt: null,
    categories: [{ category: { id: 'cat-1', name: 'Saúde', slug: 'saude' } }],
    _count: { providers: 1, favoritedBy: 0, providerRequests: 0 },
  };

  const mockProvider = {
    id: 'prov-1', userId: 'user-1', description: 'Clínica especializada',
    keywords: ['saúde'], whatsappBusiness: '5511999999999', instagram: '@drjoao',
    averageRating: 4.5, totalReviews: 10, viewsCount: 100,
    whatsappClicks: 20, instagramClicks: 15, websiteClicks: 5,
    isActive: true, isVerified: true, isFeaturedHome: true, isFeaturedCategory: false,
    featuredPriority: 5, isAdvertiser: true, status: ProviderStatus.APPROVED, plan: PlanType.PREMIUM,
    planExpiresAt: '2027-01-01T00:00:00.000Z', cityId: 'city-1',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), deletedAt: null,
    City: { id: 'city-1', name: 'São Paulo', slug: 'sao-paulo', state: 'SP', isActive: true },
    user: { id: 'user-1', name: 'Dr. João', email: 'joao@email.com', phone: '11999999999', slug: 'dr-joao', avatarUrl: null },
    services: [{ service: { id: 'svc-1', name: 'Médico', slug: 'medico' } }],
    reviews: [], galleryImages: [], ads: [], events: [],
    _count: { reviews: 10, favoritedBy: 5, galleryImages: 3, ads: 1, events: 0 },
  };

  const mockUser = {
    id: 'user-1', email: 'joao@email.com', phone: '11999999999',
    name: 'João Silva', slug: 'joao-silva', avatarUrl: null,
    role: 'USER', isActive: true, isEmailVerified: false, isPhoneVerified: false,
    receiveNewsletter: false, receivePromotions: false, lastLoginAt: null,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    city: null, providerProfile: null,
  };

  const mockReview = {
    id: 'rev-1', providerId: 'prov-1', userId: 'user-1', authorName: null,
    rating: 5, comment: 'Excelente!', isApproved: false,
    createdAt: new Date().toISOString(),
    user: { id: 'user-1', name: 'João', avatarUrl: null },
  };

  const mockRequest = {
    id: 'req-1', name: 'João Silva', whatsapp: '5511999999999',
    instagram: '@joao', location: 'SP', message: 'Quero cadastrar',
    status: ProviderStatus.PENDING, origin: 'form', notes: null,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    services: [{ providerRequestId: 'req-1', serviceId: 'svc-1', service: { id: 'svc-1', name: 'Médico', slug: 'medico', description: null } }],
    categories: [{ providerRequestId: 'req-1', categoryId: 'cat-1', category: { id: 'cat-1', name: 'Saúde', slug: 'saude', description: null } }],
  };

  const mockAd = {
    id: 'ad-1', providerId: null, title: 'Banner', imageUrl: 'https://img.com/banner.jpg',
    redirectUrl: 'https://empresa.com', position: 'home_top',
    viewsCount: 0, clicksCount: 0, isActive: true,
    startsAt: new Date(Date.now() - 86400000).toISOString(),
    endsAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(), provider: null,
  };

  const mockEvent = {
    id: 'evt-1', name: 'Feira de Saúde', slug: 'feira-de-saude',
    description: 'Evento de saúde', eventDate: new Date(Date.now() + 86400000).toISOString(),
    whatsapp: null, instagram: null, externalLink: null, location: 'Praça Central',
    coverImageUrl: null, cityId: 'city-1',
    isActive: true, isSponsored: false,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), deletedAt: null,
    city: { id: 'city-1', name: 'São Paulo', slug: 'sao-paulo', state: 'SP' },
    createdByUser: null, createdByProvider: null,
    _count: { savedBy: 0 },
  };

  const mockCity = {
    id: 'city-1', name: 'São Paulo', slug: 'sao-paulo', state: 'SP',
    isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    _count: { providers: 5, events: 2, users: 10 },
  };

  // ==================== CATEGORIES ====================
  describe('Categories', () => {
    const path = `${baseUrl}/category`;

    it('POST /category - should create a category', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue(mockCategory);

      const res = await request(app.getHttpServer())
        .post(path)
        .send({ name: 'Saúde', slug: 'saude', description: 'Serviços de saúde' })
        .expect(201);

      expect(res.body.id).toBe('cat-1');
      expect(res.body.name).toBe('Saúde');
    });

    it('POST /category - should reject invalid body', async () => {
      await request(app.getHttpServer())
        .post(path)
        .send({ name: 123 }) // name should be string
        .expect(400);
    });

    it('POST /category - should reject missing required name', async () => {
      await request(app.getHttpServer())
        .post(path)
        .send({ slug: 'teste' })
        .expect(400);
    });

    it('POST /category - should reject non-whitelisted fields', async () => {
      await request(app.getHttpServer())
        .post(path)
        .send({ name: 'Test', slug: 'test', invalidField: 'should fail' })
        .expect(400);
    });

    it('GET /category - should list categories', async () => {
      mockPrisma.category.findMany.mockResolvedValue([mockCategory]);
      mockPrisma.category.count.mockResolvedValue(1);

      const res = await request(app.getHttpServer())
        .get(path)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.total).toBe(1);
    });

    it('GET /category?search=saude - should filter categories', async () => {
      mockPrisma.category.findMany.mockResolvedValue([mockCategory]);
      mockPrisma.category.count.mockResolvedValue(1);

      const res = await request(app.getHttpServer())
        .get(`${path}?search=saude`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
    });

    it('GET /category/featured - should list featured categories', async () => {
      mockPrisma.category.findMany.mockResolvedValue([mockCategory]);

      const res = await request(app.getHttpServer())
        .get(`${path}/featured`)
        .expect(200);

      expect(res.body).toHaveLength(1);
    });

    it('GET /category/:id - should get category by id', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory);

      const res = await request(app.getHttpServer())
        .get(`${path}/cat-1`)
        .expect(200);

      expect(res.body.id).toBe('cat-1');
    });

    it('GET /category/:id - should return 404 for non-existent', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get(`${path}/00000000-0000-0000-0000-000000000000`)
        .expect(404);
    });

    it('GET /category/slug/:slug - should get by slug', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory);

      const res = await request(app.getHttpServer())
        .get(`${path}/slug/saude`)
        .expect(200);

      expect(res.body.slug).toBe('saude');
    });

    it('GET /category/:id/services - should list category services', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory);
      mockPrisma.serviceCategory.findMany.mockResolvedValue([{ service: { id: 'svc-1', name: 'Médico' } }]);
      mockPrisma.serviceCategory.count.mockResolvedValue(1);

      const res = await request(app.getHttpServer())
        .get(`${path}/cat-1/services`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
    });

    it('PATCH /category/:id - should update category', async () => {
      mockPrisma.category.findFirst
        .mockResolvedValueOnce(mockCategory)
        .mockResolvedValueOnce(null);
      mockPrisma.category.update.mockResolvedValue(mockCategory);

      const res = await request(app.getHttpServer())
        .patch(`${path}/cat-1`)
        .send({ name: 'Saúde Atualizado' })
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('DELETE /category/:id - should soft delete', async () => {
      mockPrisma.category.findFirst.mockResolvedValue({ ...mockCategory, services: [], providerRequests: [] });
      mockPrisma.category.update.mockResolvedValue({ ...mockCategory, deletedAt: new Date().toISOString() });

      const res = await request(app.getHttpServer())
        .delete(`${path}/cat-1`)
        .expect(200);

      expect(res.body.message).toContain('deleted');
    });

    it('PATCH /category/:id/toggle-active - should toggle', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory);
      mockPrisma.category.update.mockResolvedValue({ ...mockCategory, isActive: false });

      const res = await request(app.getHttpServer())
        .patch(`${path}/cat-1/toggle-active`)
        .expect(200);

      expect(res.body.isActive).toBe(false);
    });

    it('PATCH /category/:id/toggle-featured - should toggle', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory);
      mockPrisma.category.update.mockResolvedValue({ ...mockCategory, isFeatured: false });

      const res = await request(app.getHttpServer())
        .patch(`${path}/cat-1/toggle-featured`)
        .expect(200);

      expect(res.body.isFeatured).toBe(false);
    });

    it('PATCH /category/:id/sort-order - should update order', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory);
      mockPrisma.category.update.mockResolvedValue({ ...mockCategory, sortOrder: 5 });

      const res = await request(app.getHttpServer())
        .patch(`${path}/cat-1/sort-order`)
        .send({ sortOrder: 5 })
        .expect(200);

      expect(res.body.sortOrder).toBe(5);
    });
  });

  // ==================== SERVICES ====================
  describe('Services', () => {
    const path = `${baseUrl}/service`;

    it('POST /service - should create a service', async () => {
      mockPrisma.service.findUnique.mockResolvedValue(null);
      mockPrisma.service.create.mockResolvedValue(mockService);

      const res = await request(app.getHttpServer())
        .post(path)
        .send({ name: 'Médico', slug: 'medico', categoryIds: ['cat-1'] })
        .expect(201);

      expect(res.body.id).toBe('svc-1');
    });

    it('GET /service - should list services', async () => {
      mockPrisma.service.findMany.mockResolvedValue([mockService]);
      mockPrisma.service.count.mockResolvedValue(1);

      const res = await request(app.getHttpServer())
        .get(path)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
    });

    it('GET /service - should filter by isActive, isFeatured, isMostWanted', async () => {
      mockPrisma.service.findMany.mockResolvedValue([mockService]);
      mockPrisma.service.count.mockResolvedValue(1);

      await request(app.getHttpServer())
        .get(`${path}?isActive=true&isFeatured=true&isMostWanted=true`)
        .expect(200);
    });

    it('GET /service/featured - should list featured', async () => {
      mockPrisma.service.findMany.mockResolvedValue([mockService]);
      const res = await request(app.getHttpServer()).get(`${path}/featured`).expect(200);
      expect(res.body).toHaveLength(1);
    });

    it('GET /service/most-wanted - should list most wanted', async () => {
      mockPrisma.service.findMany.mockResolvedValue([mockService]);
      const res = await request(app.getHttpServer()).get(`${path}/most-wanted`).expect(200);
      expect(res.body).toHaveLength(1);
    });

    it('GET /service/:id - should get by id', async () => {
      mockPrisma.service.findFirst.mockResolvedValue(mockService);
      const res = await request(app.getHttpServer()).get(`${path}/svc-1`).expect(200);
      expect(res.body.id).toBe('svc-1');
    });

    it('GET /service/slug/:slug - should get by slug', async () => {
      mockPrisma.service.findFirst.mockResolvedValue(mockService);
      const res = await request(app.getHttpServer()).get(`${path}/slug/medico`).expect(200);
      expect(res.body.slug).toBe('medico');
    });

    it('GET /service/:id/providers - should list providers', async () => {
      mockPrisma.service.findFirst.mockResolvedValue(mockService);
      mockPrisma.providerService.findMany.mockResolvedValue([{ provider: { id: 'prov-1', user: { name: 'Dr. João' } } }]);
      mockPrisma.providerService.count.mockResolvedValue(1);
      const res = await request(app.getHttpServer()).get(`${path}/svc-1/providers`).expect(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('GET /service/:id/categories - should list categories', async () => {
      mockPrisma.service.findFirst.mockResolvedValue(mockService);
      mockPrisma.serviceCategory.findMany.mockResolvedValue([{ category: { id: 'cat-1', name: 'Saúde', slug: 'saude' } }]);
      const res = await request(app.getHttpServer()).get(`${path}/svc-1/categories`).expect(200);
      expect(res.body).toHaveLength(1);
    });

    it('PATCH /service/:id/toggle-active - should toggle', async () => {
      mockPrisma.service.findFirst.mockResolvedValue(mockService);
      mockPrisma.service.update.mockResolvedValue({ ...mockService, isActive: false });
      const res = await request(app.getHttpServer()).patch(`${path}/svc-1/toggle-active`).expect(200);
      expect(res.body.isActive).toBe(false);
    });

    it('PATCH /service/:id/toggle-featured - should toggle', async () => {
      mockPrisma.service.findFirst.mockResolvedValue(mockService);
      mockPrisma.service.update.mockResolvedValue({ ...mockService, isFeatured: false });
      const res = await request(app.getHttpServer()).patch(`${path}/svc-1/toggle-featured`).expect(200);
      expect(res.body.isFeatured).toBe(false);
    });

    it('PATCH /service/:id/toggle-most-wanted - should toggle', async () => {
      mockPrisma.service.findFirst.mockResolvedValue(mockService);
      mockPrisma.service.update.mockResolvedValue({ ...mockService, isMostWanted: false });
      const res = await request(app.getHttpServer()).patch(`${path}/svc-1/toggle-most-wanted`).expect(200);
      expect(res.body.isMostWanted).toBe(false);
    });

    it('PATCH /service/:id/sort-order - should update order', async () => {
      mockPrisma.service.findFirst.mockResolvedValue(mockService);
      mockPrisma.service.update.mockResolvedValue({ ...mockService, sortOrder: 10 });
      const res = await request(app.getHttpServer()).patch(`${path}/svc-1/sort-order`).send({ sortOrder: 10 }).expect(200);
      expect(res.body.sortOrder).toBe(10);
    });

    it('DELETE /service/:id - should soft delete', async () => {
      mockPrisma.service.findFirst.mockResolvedValue({ ...mockService, categories: [], providers: [], providerRequests: [], favoritedBy: [] });
      mockPrisma.service.update.mockResolvedValue({ ...mockService, deletedAt: new Date().toISOString() });
      const res = await request(app.getHttpServer()).delete(`${path}/svc-1`).expect(200);
      expect(res.body.message).toContain('deleted');
    });
  });

  // ==================== PROVIDERS ====================
  describe('Providers', () => {
    const path = `${baseUrl}/provider`;

    it('POST /provider - should create provider', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', role: 'USER', providerProfile: null });
      mockPrisma.provider.create.mockResolvedValue(mockProvider);
      mockPrisma.user.update.mockResolvedValue({});

      const res = await request(app.getHttpServer())
        .post(path)
        .send({ userId: 'user-1', description: 'Clínica', cityId: 'city-1', serviceIds: ['svc-1'] })
        .expect(201);

      expect(res.body.id).toBe('prov-1');
    });

    it('POST /provider - should reject without userId', async () => {
      await request(app.getHttpServer())
        .post(path)
        .send({ description: 'Test' })
        .expect(400);
    });

    it('GET /provider - should list providers', async () => {
      mockPrisma.provider.findMany.mockResolvedValue([mockProvider]);
      mockPrisma.provider.count.mockResolvedValue(1);

      const res = await request(app.getHttpServer()).get(path).expect(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('GET /provider - should filter by status, city, service', async () => {
      mockPrisma.provider.findMany.mockResolvedValue([mockProvider]);
      mockPrisma.provider.count.mockResolvedValue(1);

      await request(app.getHttpServer())
        .get(`${path}?status=APPROVED&cityId=city-1&serviceId=svc-1`)
        .expect(200);
    });

    it('GET /provider/featured - should list featured', async () => {
      mockPrisma.provider.findMany.mockResolvedValue([mockProvider]);
      const res = await request(app.getHttpServer()).get(`${path}/featured`).expect(200);
      expect(res.body).toHaveLength(1);
    });

    it('GET /provider/nearby/:cityId - should list by city', async () => {
      mockPrisma.provider.findMany.mockResolvedValue([mockProvider]);
      const res = await request(app.getHttpServer()).get(`${path}/nearby/city-1`).expect(200);
      expect(res.body).toHaveLength(1);
    });

    it('GET /provider/:id - should get by id and increment views', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(mockProvider);
      mockPrisma.provider.update.mockResolvedValue({});
      const res = await request(app.getHttpServer()).get(`${path}/prov-1`).expect(200);
      expect(res.body.id).toBe('prov-1');
    });

    it('GET /provider/user/:userId - should get by user id', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(mockProvider);
      const res = await request(app.getHttpServer()).get(`${path}/user/user-1`).expect(200);
      expect(res.body.userId).toBe('user-1');
    });

    it('GET /provider/slug/:slug - should get by slug', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(mockProvider);
      const res = await request(app.getHttpServer()).get(`${path}/slug/dr-joao`).expect(200);
      expect(res.body).toBeDefined();
    });

    it('PATCH /provider/:id/approve - should approve', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(mockProvider);
      mockPrisma.provider.update.mockResolvedValue({ ...mockProvider, status: ProviderStatus.APPROVED });
      const res = await request(app.getHttpServer()).patch(`${path}/prov-1/approve`).expect(200);
      expect(res.body.status).toBe(ProviderStatus.APPROVED);
    });

    it('PATCH /provider/:id/reject - should reject', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(mockProvider);
      mockPrisma.provider.update.mockResolvedValue({ ...mockProvider, status: ProviderStatus.REJECTED });
      const res = await request(app.getHttpServer()).patch(`${path}/prov-1/reject`).send({ reason: 'Docs' }).expect(200);
      expect(res.body.status).toBe(ProviderStatus.REJECTED);
    });

    it('PATCH /provider/:id/plan - should update plan', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(mockProvider);
      mockPrisma.provider.update.mockResolvedValue({ ...mockProvider, plan: PlanType.PREMIUM, isAdvertiser: true });
      const res = await request(app.getHttpServer()).patch(`${path}/prov-1/plan`).send({ plan: 'PREMIUM', expiresInDays: 365 }).expect(200);
      expect(res.body.isAdvertiser).toBe(true);
    });

    it('PATCH /provider/:id/clicks/whatsapp - should increment click', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(mockProvider);
      mockPrisma.provider.update.mockResolvedValue({});
      const res = await request(app.getHttpServer()).patch(`${path}/prov-1/clicks/whatsapp`).expect(200);
      expect(res.body.success).toBe(true);
    });

    it('PATCH /provider/:id/clicks/instagram - should increment click', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(mockProvider);
      mockPrisma.provider.update.mockResolvedValue({});
      const res = await request(app.getHttpServer()).patch(`${path}/prov-1/clicks/instagram`).expect(200);
      expect(res.body.success).toBe(true);
    });

    it('PATCH /provider/:id/clicks/website - should increment click', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(mockProvider);
      mockPrisma.provider.update.mockResolvedValue({});
      const res = await request(app.getHttpServer()).patch(`${path}/prov-1/clicks/website`).expect(200);
      expect(res.body.success).toBe(true);
    });

    it('PATCH /provider/:id/toggle-feature/home - should toggle', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(mockProvider);
      mockPrisma.provider.update.mockResolvedValue({ ...mockProvider, isFeaturedHome: false });
      const res = await request(app.getHttpServer()).patch(`${path}/prov-1/toggle-feature/home`).expect(200);
      expect(res.body.isFeaturedHome).toBe(false);
    });

    it('PATCH /provider/:id/toggle-feature/category - should toggle', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(mockProvider);
      mockPrisma.provider.update.mockResolvedValue({ ...mockProvider, isFeaturedCategory: true });
      const res = await request(app.getHttpServer()).patch(`${path}/prov-1/toggle-feature/category`).expect(200);
      expect(res.body.isFeaturedCategory).toBe(true);
    });

    it('PATCH /provider/:id - should update provider', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(mockProvider);
      mockPrisma.provider.update.mockResolvedValue(mockProvider);
      const res = await request(app.getHttpServer()).patch(`${path}/prov-1`).send({ description: 'New desc' }).expect(200);
      expect(res.body).toBeDefined();
    });

    it('DELETE /provider/:id - should soft delete', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue(mockProvider);
      mockPrisma.provider.update.mockResolvedValue({ ...mockProvider, deletedAt: new Date().toISOString() });
      const res = await request(app.getHttpServer()).delete(`${path}/prov-1`).expect(200);
      expect(res.body.message).toContain('deleted');
    });
  });

  // ==================== PROVIDER REQUESTS ====================
  describe('Provider Requests', () => {
    const path = `${baseUrl}/provider-request`;

    it('POST /provider-request - should create pending request', async () => {
      mockPrisma.providerRequest.create.mockResolvedValue(mockRequest);
      const res = await request(app.getHttpServer())
        .post(path)
        .send({ name: 'João Silva', whatsapp: '5511999999999', serviceIds: ['svc-1'] })
        .expect(201);

      expect(res.body.status).toBe('PENDING');
    });

    it('GET /provider-request - should list requests', async () => {
      mockPrisma.providerRequest.findMany.mockResolvedValue([mockRequest]);
      mockPrisma.providerRequest.count.mockResolvedValue(1);
      const res = await request(app.getHttpServer()).get(path).expect(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('GET /provider-request/pending - should list pending', async () => {
      mockPrisma.providerRequest.findMany.mockResolvedValue([mockRequest]);
      mockPrisma.providerRequest.count.mockResolvedValue(1);
      const res = await request(app.getHttpServer()).get(`${path}/pending`).expect(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('GET /provider-request/stats - should return stats', async () => {
      mockPrisma.providerRequest.count.mockResolvedValueOnce(5).mockResolvedValueOnce(10).mockResolvedValueOnce(3);
      const res = await request(app.getHttpServer()).get(`${path}/stats`).expect(200);
      expect(res.body.total).toBe(18);
    });

    it('PATCH /provider-request/:id/approve - should approve', async () => {
      mockPrisma.providerRequest.findUnique.mockResolvedValue(mockRequest);
      mockPrisma.providerRequest.update.mockResolvedValue({ ...mockRequest, status: ProviderStatus.APPROVED });
      const res = await request(app.getHttpServer()).patch(`${path}/req-1/approve`).expect(200);
      expect(res.body.status).toBe(ProviderStatus.APPROVED);
    });

    it('PATCH /provider-request/:id/reject - should reject', async () => {
      mockPrisma.providerRequest.findUnique.mockResolvedValue(mockRequest);
      mockPrisma.providerRequest.update.mockResolvedValue({ ...mockRequest, status: ProviderStatus.REJECTED });
      const res = await request(app.getHttpServer()).patch(`${path}/req-1/reject`).send({ reason: 'Docs' }).expect(200);
      expect(res.body.status).toBe(ProviderStatus.REJECTED);
    });

    it('DELETE /provider-request/:id - should delete', async () => {
      mockPrisma.providerRequest.findUnique.mockResolvedValue(mockRequest);
      mockPrisma.providerRequest.delete.mockResolvedValue(mockRequest);
      const res = await request(app.getHttpServer()).delete(`${path}/req-1`).expect(200);
      expect(res.body.message).toContain('deleted');
    });
  });

  // ==================== REVIEWS ====================
  describe('Reviews', () => {
    const path = `${baseUrl}/review`;

    it('POST /review - should create review', async () => {
      mockPrisma.provider.findFirst.mockResolvedValue({ id: 'prov-1', deletedAt: null });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', name: 'João', avatarUrl: null });
      mockPrisma.review.findFirst.mockResolvedValue(null);
      mockPrisma.review.create.mockResolvedValue(mockReview);
      mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: 5 }, _count: { rating: 1 } });
      mockPrisma.provider.update.mockResolvedValue({});

      const res = await request(app.getHttpServer())
        .post(path)
        .send({ providerId: 'prov-1', userId: 'user-1', rating: 5, comment: 'Excelente!' })
        .expect(201);

      expect(res.body.id).toBe('rev-1');
    });

    it('POST /review - should reject invalid rating (above 5)', async () => {
      await request(app.getHttpServer())
        .post(path)
        .send({ providerId: 'prov-1', rating: 6 })
        .expect(400);
    });

    it('POST /review - should reject invalid rating (below 1)', async () => {
      await request(app.getHttpServer())
        .post(path)
        .send({ providerId: 'prov-1', rating: 0 })
        .expect(400);
    });

    it('POST /review - should reject short comment', async () => {
      await request(app.getHttpServer())
        .post(path)
        .send({ providerId: 'prov-1', rating: 4, comment: 'OK' })
        .expect(400);
    });

    it('GET /review - should list reviews', async () => {
      mockPrisma.review.findMany.mockResolvedValue([mockReview]);
      mockPrisma.review.count.mockResolvedValue(1);
      const res = await request(app.getHttpServer()).get(path).expect(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('GET /review?providerId=prov-1 - should filter by provider', async () => {
      mockPrisma.review.findMany.mockResolvedValue([mockReview]);
      mockPrisma.review.count.mockResolvedValue(1);
      const res = await request(app.getHttpServer()).get(`${path}?providerId=prov-1`).expect(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('GET /review?minRating=3&maxRating=5 - should filter by rating', async () => {
      mockPrisma.review.findMany.mockResolvedValue([mockReview]);
      mockPrisma.review.count.mockResolvedValue(1);
      const res = await request(app.getHttpServer()).get(`${path}?minRating=3&maxRating=5`).expect(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('PATCH /review/:id/approve - should approve', async () => {
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);
      mockPrisma.review.update.mockResolvedValue({ ...mockReview, isApproved: true });
      mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: 5 }, _count: { rating: 1 } });
      mockPrisma.provider.update.mockResolvedValue({});
      const res = await request(app.getHttpServer()).patch(`${path}/rev-1/approve`).expect(200);
      expect(res.body.isApproved).toBe(true);
    });

    it('PATCH /review/:id/reject - should reject', async () => {
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);
      mockPrisma.review.delete.mockResolvedValue(mockReview);
      mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: 0 }, _count: { rating: 0 } });
      mockPrisma.provider.update.mockResolvedValue({});
      const res = await request(app.getHttpServer()).patch(`${path}/rev-1/reject`).expect(200);
      expect(res.body.message).toContain('rejected');
    });

    it('DELETE /review/:id - should delete', async () => {
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);
      mockPrisma.review.delete.mockResolvedValue(mockReview);
      mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: 0 }, _count: { rating: 0 } });
      mockPrisma.provider.update.mockResolvedValue({});
      const res = await request(app.getHttpServer()).delete(`${path}/rev-1`).expect(200);
      expect(res.body.message).toContain('deleted');
    });
  });

  // ==================== SEARCH ====================
  describe('Search', () => {
    const path = `${baseUrl}/search`;

    it('GET /search?q= - should require q param', async () => {
      await request(app.getHttpServer())
        .get(`${path}?q=a`)
        .expect(200); // short query returns empty
    });

    it('GET /search?q=medico - should search across all types', async () => {
      mockPrisma.provider.findMany.mockResolvedValue([mockProvider]);
      mockPrisma.provider.count.mockResolvedValue(1);
      mockPrisma.service.findMany.mockResolvedValue([mockService]);
      mockPrisma.service.count.mockResolvedValue(1);
      mockPrisma.category.findMany.mockResolvedValue([mockCategory]);
      mockPrisma.category.count.mockResolvedValue(1);
      mockPrisma.event.findMany.mockResolvedValue([mockEvent]);
      mockPrisma.event.count.mockResolvedValue(1);

      const res = await request(app.getHttpServer())
        .get(`${path}?q=medico`)
        .expect(200);

      expect(res.body.total).toBe(4);
      expect(res.body.providers.data).toHaveLength(1);
      expect(res.body.services.data).toHaveLength(1);
      expect(res.body.categories.data).toHaveLength(1);
      expect(res.body.events.data).toHaveLength(1);
      expect(res.body.combined).toHaveLength(4);
    });

    it('GET /search/autocomplete?q=m - should return suggestions', async () => {
      mockPrisma.provider.findMany.mockResolvedValue([]);
      mockPrisma.service.findMany.mockResolvedValue([]);
      mockPrisma.category.findMany.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .get(`${path}/autocomplete?q=m`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ==================== ADS ====================
  describe('Ads', () => {
    const path = `${baseUrl}/ad`;

    it('POST /ad - should create ad', async () => {
      mockPrisma.ad.create.mockResolvedValue(mockAd);
      const res = await request(app.getHttpServer())
        .post(path)
        .send({ title: 'Banner', imageUrl: 'https://img.com/banner.jpg', position: 'home_top' })
        .expect(201);

      expect(res.body.id).toBe('ad-1');
    });

    it('POST /ad - should reject without imageUrl', async () => {
      await request(app.getHttpServer())
        .post(path)
        .send({ title: 'Banner' })
        .expect(400);
    });

    it('GET /ad - should list ads', async () => {
      mockPrisma.ad.findMany.mockResolvedValue([mockAd]);
      mockPrisma.ad.count.mockResolvedValue(1);
      const res = await request(app.getHttpServer()).get(path).expect(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('GET /ad/position/home_top - should get by position', async () => {
      mockPrisma.ad.findMany.mockResolvedValue([mockAd]);
      const res = await request(app.getHttpServer()).get(`${path}/position/home_top`).expect(200);
      expect(res.body).toHaveLength(1);
    });

    it('PATCH /ad/:id/click - should increment click', async () => {
      mockPrisma.ad.findUnique.mockResolvedValue(mockAd);
      mockPrisma.ad.update.mockResolvedValue({});
      const res = await request(app.getHttpServer()).patch(`${path}/ad-1/click`).expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ==================== USERS ====================
  describe('Users', () => {
    const path = `${baseUrl}/user`;

    it('POST /user - should create user', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce(null) // slug check
        .mockResolvedValueOnce(null); // phone check
      mockPrisma.user.create.mockResolvedValue({ ...mockUser, password: undefined });

      const res = await request(app.getHttpServer())
        .post(path)
        .send({ email: 'joao@email.com', password: '123456', name: 'João Silva', slug: 'joao-silva' })
        .expect(201);

      expect(res.body.id).toBe('user-1');
    });

    it('POST /user - should reject invalid email', async () => {
      await request(app.getHttpServer())
        .post(path)
        .send({ email: 'invalid', password: '123456', name: 'Test', slug: 'test' })
        .expect(400);
    });

    it('POST /user - should reject short password', async () => {
      await request(app.getHttpServer())
        .post(path)
        .send({ email: 'test@test.com', password: '123', name: 'Test', slug: 'test' })
        .expect(400);
    });

    it('GET /user - should list users', async () => {
      const userWithoutPassword = { ...mockUser };
      mockPrisma.user.findMany.mockResolvedValue([userWithoutPassword]);
      mockPrisma.user.count.mockResolvedValue(1);
      const res = await request(app.getHttpServer()).get(path).expect(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('GET /user/slug/:slug - should get by slug', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      const res = await request(app.getHttpServer()).get(`${path}/slug/joao-silva`).expect(200);
      expect(res.body.slug).toBe('joao-silva');
    });

    it('GET /user/email/:email - should get by email', async () => {
      const userWithPassword = { ...mockUser, password: 'hashed' };
      mockPrisma.user.findUnique.mockResolvedValue(userWithPassword);
      const res = await request(app.getHttpServer()).get(`${path}/email/joao@email.com`).expect(200);
      expect(res.body.email).toBe('joao@email.com');
    });

    it('PATCH /user/:id/verify-email - should verify', async () => {
      mockPrisma.user.update.mockResolvedValue(mockUser);
      const res = await request(app.getHttpServer()).patch(`${path}/user-1/verify-email`).expect(200);
      expect(res.body).toBeDefined();
    });

    it('PATCH /user/:id/toggle-active - should toggle', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, isActive: false });
      const res = await request(app.getHttpServer()).patch(`${path}/user-1/toggle-active`).expect(200);
      expect(res.body.isActive).toBe(false);
    });

    it('GET /user/:id/stats - should get stats', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        _count: { reviews: 3, favoriteProviders: 2, favoriteServices: 1, eventsSaved: 0, eventsCreated: 0 },
        providerProfile: null,
      });
      const res = await request(app.getHttpServer()).get(`${path}/user-1/stats`).expect(200);
      expect(res.body._count.reviews).toBe(3);
    });
  });

  // ==================== CITIES ====================
  describe('Cities', () => {
    const path = `${baseUrl}/city`;

    it('POST /city - should create city', async () => {
      mockPrisma.city.findUnique.mockResolvedValue(null);
      mockPrisma.city.create.mockResolvedValue(mockCity);
      const res = await request(app.getHttpServer())
        .post(path)
        .send({ name: 'São Paulo', slug: 'sao-paulo', state: 'SP' })
        .expect(201);
      expect(res.body.id).toBe('city-1');
    });

    it('POST /city - should reject invalid state', async () => {
      await request(app.getHttpServer())
        .post(path)
        .send({ name: 'Test', slug: 'test', state: 'INVALID' })
        .expect(400);
    });

    it('GET /city - should list cities', async () => {
      mockPrisma.city.findMany.mockResolvedValue([mockCity]);
      mockPrisma.city.count.mockResolvedValue(1);
      const res = await request(app.getHttpServer()).get(path).expect(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('GET /city/state/SP - should get by state', async () => {
      mockPrisma.city.findMany.mockResolvedValue([mockCity]);
      const res = await request(app.getHttpServer()).get(`${path}/state/SP`).expect(200);
      expect(res.body).toHaveLength(1);
    });

    it('GET /city/slug/:slug - should get by slug', async () => {
      mockPrisma.city.findUnique.mockResolvedValue(mockCity);
      const res = await request(app.getHttpServer()).get(`${path}/slug/sao-paulo`).expect(200);
      expect(res.body.slug).toBe('sao-paulo');
    });
  });

  // ==================== EVENTS ====================
  describe('Events', () => {
    const path = `${baseUrl}/event`;

    it('POST /event - should create event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);
      mockPrisma.event.create.mockResolvedValue(mockEvent);
      const res = await request(app.getHttpServer())
        .post(path)
        .send({
          name: 'Feira de Saúde', slug: 'feira-de-saude',
          eventDate: new Date(Date.now() + 86400000).toISOString(),
          location: 'Praça Central', cityId: 'city-1',
        })
        .expect(201);
      expect(res.body.id).toBe('evt-1');
    });

    it('GET /event - should list events', async () => {
      mockPrisma.event.findMany.mockResolvedValue([mockEvent]);
      mockPrisma.event.count.mockResolvedValue(1);
      const res = await request(app.getHttpServer()).get(path).expect(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('GET /event/upcoming - should list upcoming', async () => {
      mockPrisma.event.findMany.mockResolvedValue([mockEvent]);
      mockPrisma.event.count.mockResolvedValue(1);
      const res = await request(app.getHttpServer()).get(`${path}/upcoming`).expect(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('GET /event/recent - should list recent', async () => {
      mockPrisma.event.findMany.mockResolvedValue([mockEvent]);
      mockPrisma.event.count.mockResolvedValue(1);
      const res = await request(app.getHttpServer()).get(`${path}/recent`).expect(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('GET /event/slug/:slug - should get by slug', async () => {
      mockPrisma.event.findFirst.mockResolvedValue(mockEvent);
      const res = await request(app.getHttpServer()).get(`${path}/slug/feira-de-saude`).expect(200);
      expect(res.body.slug).toBe('feira-de-saude');
    });

    it('PATCH /event/:id/toggle-active - should toggle', async () => {
      mockPrisma.event.findFirst.mockResolvedValue(mockEvent);
      mockPrisma.event.update.mockResolvedValue({ ...mockEvent, isActive: false });
      const res = await request(app.getHttpServer()).patch(`${path}/evt-1/toggle-active`).expect(200);
      expect(res.body.isActive).toBe(false);
    });
  });

  // ==================== FAVORITES ====================
  describe('Favorites', () => {
    it('POST /api/v1/favorite/provider/:userId/:providerId - should add provider favorite', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.provider.findFirst.mockResolvedValue(mockProvider);
      mockPrisma.favoriteProvider.findUnique.mockResolvedValue(null);
      mockPrisma.favoriteProvider.create.mockResolvedValue({ provider: mockProvider });

      const res = await request(app.getHttpServer())
        .post(`${baseUrl}/favorite/provider/user-1/prov-1`)
        .expect(201);
      expect(res.body).toBeDefined();
    });

    it('DELETE /api/v1/favorite/provider/:userId/:providerId - should remove', async () => {
      mockPrisma.favoriteProvider.findUnique.mockResolvedValue({ id: 'fav-1' });
      mockPrisma.favoriteProvider.delete.mockResolvedValue({});
      const res = await request(app.getHttpServer())
        .delete(`${baseUrl}/favorite/provider/user-1/prov-1`)
        .expect(200);
      expect(res.body.message).toContain('removed');
    });

    it('GET /api/v1/favorite/provider/:userId/check/:providerId - should check', async () => {
      mockPrisma.favoriteProvider.findUnique.mockResolvedValue({ id: 'fav-1' });
      const res = await request(app.getHttpServer())
        .get(`${baseUrl}/favorite/provider/user-1/check/prov-1`)
        .expect(200);
      expect(res.body.isFavorited).toBe(true);
    });

    it('POST /api/v1/favorite/service/:userId/:serviceId - should add service favorite', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.service.findFirst.mockResolvedValue(mockService);
      mockPrisma.favoriteService.findUnique.mockResolvedValue(null);
      mockPrisma.favoriteService.create.mockResolvedValue({ service: mockService });

      const res = await request(app.getHttpServer())
        .post(`${baseUrl}/favorite/service/user-1/svc-1`)
        .expect(201);
      expect(res.body).toBeDefined();
    });
  });

  // ==================== DASHBOARD ====================
  describe('Dashboard', () => {
    const path = `${baseUrl}/dashboard`;

    it('GET /dashboard/stats - should return stats', async () => {
      mockPrisma.user.count
        .mockResolvedValueOnce(100); // total users
      mockPrisma.provider.count
        .mockResolvedValueOnce(50)  // total providers
        .mockResolvedValueOnce(5)   // pending
        .mockResolvedValueOnce(40)  // approved
        .mockResolvedValueOnce(10)  // featured
        .mockResolvedValueOnce(20); // verified
      mockPrisma.service.count
        .mockResolvedValueOnce(30);
      mockPrisma.category.count
        .mockResolvedValueOnce(15);
      mockPrisma.city.count
        .mockResolvedValueOnce(10);
      mockPrisma.review.count
        .mockResolvedValueOnce(200);
      mockPrisma.event.count
        .mockResolvedValueOnce(25);
      mockPrisma.ad.count
        .mockResolvedValueOnce(8);
      mockPrisma.providerRequest.count
        .mockResolvedValueOnce(12);

      const res = await request(app.getHttpServer())
        .get(`${path}/stats`)
        .expect(200);

      expect(res.body.users.total).toBe(100);
      expect(res.body.providers.total).toBe(50);
      expect(res.body.services.total).toBe(30);
      expect(res.body.categories.total).toBe(15);
    });

    it('GET /dashboard/plan-distribution - should return plan distribution', async () => {
      for (const _ of ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']) {
        mockPrisma.provider.count.mockResolvedValueOnce(10);
      }
      const res = await request(app.getHttpServer())
        .get(`${path}/plan-distribution`)
        .expect(200);
      expect(res.body).toHaveLength(4);
    });

    it('GET /dashboard/top-providers - should return top', async () => {
      mockPrisma.provider.findMany.mockResolvedValue([mockProvider]);
      const res = await request(app.getHttpServer())
        .get(`${path}/top-providers?limit=5`)
        .expect(200);
      expect(res.body).toHaveLength(1);
    });

    it('GET /dashboard/city-stats - should return city stats', async () => {
      mockPrisma.city.findMany.mockResolvedValue([{
        ...mockCity,
        _count: { providers: 5, events: 2 },
      }]);
      const res = await request(app.getHttpServer())
        .get(`${path}/city-stats`)
        .expect(200);
      expect(res.body).toHaveLength(1);
    });

    it('GET /dashboard/category-stats - should return category stats', async () => {
      mockPrisma.category.findMany.mockResolvedValue([{
        id: 'cat-1', name: 'Saúde', slug: 'saude',
        _count: { services: 3 },
      }]);
      const res = await request(app.getHttpServer())
        .get(`${path}/category-stats`)
        .expect(200);
      expect(res.body).toHaveLength(1);
    });

    it('GET /dashboard/most-clicked - should return most clicked', async () => {
      mockPrisma.provider.findMany.mockResolvedValue([mockProvider]);
      const res = await request(app.getHttpServer())
        .get(`${path}/most-clicked?limit=5`)
        .expect(200);
      expect(res.body).toHaveLength(1);
    });
  });

  // ==================== GENERAL VALIDATION ====================
  describe('General Validation', () => {
    it('GET /api/v1 - should return 404 for root', async () => {
      await request(app.getHttpServer())
        .get(`${baseUrl}`)
        .expect(404);
    });

    it('GET /unknown-route - should return 404', async () => {
      await request(app.getHttpServer())
        .get(`${baseUrl}/unknown-route`)
        .expect(404);
    });

    it('should return 404 for unknown category IDs', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null);
      await request(app.getHttpServer())
        .get(`${baseUrl}/category/invalid-uuid`)
        .expect(404);
    });
  });
});