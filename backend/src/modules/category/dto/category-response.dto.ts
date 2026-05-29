export class CategoryResponseDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;

  createdAt: Date;
  updatedAt: Date;

  _count?: {
    services: number;
    providerRequests: number;
  };
}