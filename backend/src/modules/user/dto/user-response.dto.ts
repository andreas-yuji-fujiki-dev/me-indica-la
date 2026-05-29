import { UserRole, State } from '@prisma/client';

export class UserResponseDto {
  id: string;
  email: string;
  phone?: string;
  name: string;
  slug: string;
  avatarUrl?: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  receiveNewsletter: boolean;
  receivePromotions: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  city?: {
    id: string;
    name: string;
    slug: string;
    state: State;
  };
  providerProfile?: {
    id: string;
    status: string;
    plan: string;
    averageRating: number;
    totalReviews: number;
  };
}