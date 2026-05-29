export class EventResponseDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  eventDate: Date;
  whatsapp?: string;
  instagram?: string;
  externalLink?: string;
  location?: string;
  coverImageUrl?: string;
  isActive: boolean;
  isSponsored: boolean;
  createdAt: Date;
  updatedAt: Date;
  city?: {
    id: string;
    name: string;
    slug: string;
    state: string;
  };
  createdByUser?: {
    id: string;
    name: string;
    slug: string;
    avatarUrl?: string;
  };
  createdByProvider?: {
    id: string;
    user: { name: string; slug: string };
  };
  _count?: {
    savedBy: number;
  };
}