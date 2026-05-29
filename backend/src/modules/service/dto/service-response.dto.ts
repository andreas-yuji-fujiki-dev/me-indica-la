export class ServiceResponseDto {
    id: string;
    name: string;
    slug: string;
    description?: string;
    keywords: string[];
    isActive: boolean;
    isFeatured: boolean;
    isMostWanted: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
    categories?: Array<{
      categoryId: string;
      category: {
        id: string;
        name: string;
        slug: string;
      };
    }>;
    providers?: Array<{
      providerId: string;
      provider: {
        id: string;
        user: {
          name: string;
          avatarUrl?: string;
          slug: string;
        };
        averageRating: number;
      };
    }>;
    _count?: {
      providers: number;
      favoritedBy: number;
      providerRequests: number;
    };
  }