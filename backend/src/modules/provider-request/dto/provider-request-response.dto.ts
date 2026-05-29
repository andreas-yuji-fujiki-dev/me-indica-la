import { ProviderStatus } from '@prisma/client';

export class ProviderRequestResponseDto {
  id: string;
  name: string;
  whatsapp?: string;
  instagram?: string;
  location?: string;
  message?: string;
  status: ProviderStatus;
  origin?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  services?: Array<{
    serviceId: string;
    service: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  categories?: Array<{
    categoryId: string;
    category: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
}