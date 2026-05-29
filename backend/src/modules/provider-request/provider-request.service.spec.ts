import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ProviderRequestService } from './provider-request.service';
import { mockPrisma, MockPrismaService } from '../prisma/prisma.mock';
import { ProviderStatus } from '@prisma/client';

describe('ProviderRequestService', () => {
  let service: ProviderRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProviderRequestService, MockPrismaService],
    }).compile();

    service = module.get<ProviderRequestService>(ProviderRequestService);
    jest.clearAllMocks();
  });

  const mockRequest = {
    id: 'req-1',
    name: 'João Silva',
    whatsapp: '5511999999999',
    instagram: '@joaosilva',
    location: 'São Paulo - SP',
    message: 'Gostaria de cadastrar minha empresa',
    status: ProviderStatus.PENDING,
    origin: 'form',
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    services: [
      {
        providerRequestId: 'req-1',
        serviceId: 'svc-1',
        service: { id: 'svc-1', name: 'Médico', slug: 'medico', description: null },
      },
    ],
    categories: [
      {
        providerRequestId: 'req-1',
        categoryId: 'cat-1',
        category: { id: 'cat-1', name: 'Saúde', slug: 'saude', description: null },
      },
    ],
  };

  // ---------- CREATE ----------
  describe('create', () => {
    it('should create a provider request with PENDING status', async () => {
      mockPrisma.providerRequest.create.mockResolvedValue(mockRequest);

      const result = await service.create({
        name: 'João Silva',
        whatsapp: '5511999999999',
        serviceIds: ['svc-1'],
        categoryIds: ['cat-1'],
      });

      expect(result).toEqual(mockRequest);
      expect(result.status).toBe(ProviderStatus.PENDING);
      expect(mockPrisma.providerRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'João Silva',
            status: ProviderStatus.PENDING,
          }),
        }),
      );
    });

    it('should create a request without optional relations', async () => {
      mockPrisma.providerRequest.create.mockResolvedValue({
        ...mockRequest,
        name: 'Maria Souza',
        services: [],
        categories: [],
      });

      const result = await service.create({
        name: 'Maria Souza',
        whatsapp: '5511888888888',
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('Maria Souza');
    });
  });

  // ---------- FIND ALL ----------
  describe('findAll', () => {
    it('should return paginated requests', async () => {
      mockPrisma.providerRequest.findMany.mockResolvedValue([mockRequest]);
      mockPrisma.providerRequest.count.mockResolvedValue(1);

      const result = await service.findAll(1, 10, {});

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by status', async () => {
      mockPrisma.providerRequest.findMany.mockResolvedValue([]);
      mockPrisma.providerRequest.count.mockResolvedValue(0);

      await service.findAll(1, 10, { status: 'PENDING' });

      expect(mockPrisma.providerRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PENDING' }),
        }),
      );
    });

    it('should search by name, message and location', async () => {
      mockPrisma.providerRequest.findMany.mockResolvedValue([]);
      mockPrisma.providerRequest.count.mockResolvedValue(0);

      await service.findAll(1, 10, { search: 'João' });

      expect(mockPrisma.providerRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: { contains: 'João', mode: 'insensitive' } },
              { message: { contains: 'João', mode: 'insensitive' } },
              { location: { contains: 'João', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });
  });

  // ---------- FIND ONE ----------
  describe('findOne', () => {
    it('should return a request by ID', async () => {
      mockPrisma.providerRequest.findUnique.mockResolvedValue(mockRequest);

      const result = await service.findOne('req-1');

      expect(result).toEqual(mockRequest);
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.providerRequest.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  // ---------- UPDATE ----------
  describe('update', () => {
    it('should update a request', async () => {
      mockPrisma.providerRequest.findUnique.mockResolvedValue(mockRequest);
      mockPrisma.providerRequest.update.mockResolvedValue({
        ...mockRequest,
        location: 'Rio de Janeiro - RJ',
      });

      const result = await service.update('req-1', { location: 'Rio de Janeiro - RJ' });

      expect(result).toBeDefined();
    });
  });

  // ---------- APPROVE ----------
  describe('approve', () => {
    it('should approve a pending request', async () => {
      mockPrisma.providerRequest.findUnique.mockResolvedValue(mockRequest);
      mockPrisma.providerRequest.update.mockResolvedValue({
        ...mockRequest,
        status: ProviderStatus.APPROVED,
      });

      const result = await service.approve('req-1');

      expect(result.status).toBe(ProviderStatus.APPROVED);
    });

    it('should throw BadRequestException if request is not PENDING', async () => {
      mockPrisma.providerRequest.findUnique.mockResolvedValue({
        ...mockRequest,
        status: ProviderStatus.APPROVED,
      });

      await expect(service.approve('req-1')).rejects.toThrow(BadRequestException);
    });
  });

  // ---------- REJECT ----------
  describe('reject', () => {
    it('should reject a request with notes', async () => {
      mockPrisma.providerRequest.findUnique.mockResolvedValue(mockRequest);
      mockPrisma.providerRequest.update.mockResolvedValue({
        ...mockRequest,
        status: ProviderStatus.REJECTED,
        notes: 'Documentos insuficientes',
      });

      const result = await service.reject('req-1', 'Documentos insuficientes');

      expect(result.status).toBe(ProviderStatus.REJECTED);
    });
  });

  // ---------- REMOVE ----------
  describe('remove', () => {
    it('should delete a request', async () => {
      mockPrisma.providerRequest.findUnique.mockResolvedValue(mockRequest);
      mockPrisma.providerRequest.delete.mockResolvedValue(mockRequest);

      const result = await service.remove('req-1');

      expect(result.message).toContain('deleted');
    });
  });

  // ---------- GET PENDING ----------
  describe('getPending', () => {
    it('should return only pending requests', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValue({
        data: [mockRequest],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });

      const result = await service.getPending(1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe(ProviderStatus.PENDING);
    });
  });

  // ---------- GET STATS ----------
  describe('getStats', () => {
    it('should return request statistics', async () => {
      mockPrisma.providerRequest.count
        .mockResolvedValueOnce(5)  // pending
        .mockResolvedValueOnce(10) // approved
        .mockResolvedValueOnce(3); // rejected

      const result = await service.getStats();

      expect(result).toEqual({
        pending: 5,
        approved: 10,
        rejected: 3,
        total: 18,
      });
    });
  });
});