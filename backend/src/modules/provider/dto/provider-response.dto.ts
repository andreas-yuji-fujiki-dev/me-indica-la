import { ProviderStatus, PlanType, State } from '@prisma/client';

export class ProviderResponseDto {
  id: string;
  userId: string;
  description?: string;
  keywords: string[];
  whatsappBusiness?: string;
  instagram?: string;
  website?: string;
  address?: string;
  coordinates?: any;
  logoUrl?: string;
  coverImageUrl?: string;
  businessLicense?: string;
  averageRating: number;
  totalReviews: number;
  viewsCount: number;
  whatsappClicks: number;
  instagramClicks: number;
  websiteClicks: number;
  isActive: boolean;
  isVerified: boolean;
  isFeaturedHome: boolean;
  isFeaturedCategory: boolean;
  featuredPriority: number;
  isAdvertiser: boolean;
  status: ProviderStatus;
  plan: PlanType;
  planExpiresAt?: Date;
  businessHours?: any;
  createdAt: Date;
  updatedAt: Date;
  city?: {
    id: string;
    name: string;
    slug: string;
    state: State;
  };
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
    slug: string;
  };
  services?: Array<{
    serviceId: string;
    service: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  _count?: {
    reviews: number;
    favoritedBy: number;
    galleryImages: number;
    ads: number;
    events: number;
  };
}