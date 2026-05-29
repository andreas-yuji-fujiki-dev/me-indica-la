import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProviderEditRequestDto } from './dto/create-provider-edit-request.dto';

@Injectable()
export class ProviderEditRequestService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProviderEditRequestDto) {
    const provider = await this.prisma.provider.findFirst({
      where: { id: dto.providerId, deletedAt: null },
    });

    if (!provider) {
      throw new NotFoundException(`Provider ${dto.providerId} not found`);
    }

    const existing = await this.prisma.providerEditRequest.findFirst({
      where: { providerId: dto.providerId, status: 'PENDING' },
    });

    if (existing) {
      throw new ConflictException('There is already a pending edit request for this provider');
    }

    const { providerId, ...data } = dto;
    return this.prisma.providerEditRequest.create({
      data: { ...data, provider: { connect: { id: providerId } } },
    });
  }

  async findPendingByProvider(providerId: string) {
    return this.prisma.providerEditRequest.findFirst({
      where: { providerId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: string) {
    const req = await this.prisma.providerEditRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException(`Edit request ${id} not found`);
    if (req.status !== 'PENDING') throw new ConflictException('Request is not pending');

    const { providerId, serviceIds, galleryImageUrls, categoryId, businessName, ...fields } = req as any;

    // Fetch provider to get userId for name update
    const provider = await this.prisma.provider.findUnique({ where: { id: providerId }, select: { userId: true } });

    // Build provider update payload
    const updateData: any = {};
    const scalarFields = [
      'description', 'whatsappBusiness', 'instagram', 'website',
      'keywords', 'customCategory', 'customServiceNames', 'address',
      'logoUrl', 'coverImageUrl', 'businessHours', 'cityName', 'cityState',
    ];
    for (const f of scalarFields) {
      if (fields[f] !== undefined && fields[f] !== null) updateData[f] = fields[f];
    }

    if (categoryId !== undefined) {
      if (categoryId) updateData.category = { connect: { id: categoryId } };
      else updateData.category = { disconnect: true };
    }
    if (req.cityId !== undefined && req.cityId !== null) {
      updateData.City = { connect: { id: req.cityId } };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.provider.update({ where: { id: providerId }, data: updateData });

      if (businessName && provider?.userId) {
        await tx.user.update({ where: { id: provider.userId }, data: { name: businessName } });
      }

      if (serviceIds?.length !== undefined) {
        await tx.providerService.deleteMany({ where: { providerId } });
        if (serviceIds.length > 0) {
          await tx.providerService.createMany({
            data: serviceIds.map((sid: string) => ({ providerId, serviceId: sid })),
          });
        }
      }

      if (galleryImageUrls?.length !== undefined) {
        await tx.providerGallery.deleteMany({ where: { providerId } });
        if (galleryImageUrls.length > 0) {
          await tx.providerGallery.createMany({
            data: galleryImageUrls.map((url: string) => ({ providerId, imageUrl: url })),
          });
        }
      }

      await tx.providerEditRequest.update({
        where: { id },
        data: { status: 'APPROVED', reviewedAt: new Date() },
      });
    });

    return { message: 'Edit request approved and applied' };
  }

  async reject(id: string) {
    const req = await this.prisma.providerEditRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException(`Edit request ${id} not found`);
    if (req.status !== 'PENDING') throw new ConflictException('Request is not pending');

    return this.prisma.providerEditRequest.update({
      where: { id },
      data: { status: 'REJECTED', reviewedAt: new Date() },
    });
  }

  async cancel(id: string) {
    const req = await this.prisma.providerEditRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException(`Edit request ${id} not found`);
    if (req.status !== 'PENDING') throw new ConflictException('Request is not pending');

    return this.prisma.providerEditRequest.delete({ where: { id } });
  }

  async findAll(status?: string) {
    return this.prisma.providerEditRequest.findMany({
      where: status ? { status: status as any } : undefined,
      include: { provider: { include: { user: { select: { id: true, name: true, email: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
