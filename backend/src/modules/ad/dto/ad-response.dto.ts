export class AdResponseDto {
  id: string;
  providerId?: string;
  title: string;
  imageUrl: string;
  redirectUrl?: string;
  position?: string;
  viewsCount: number;
  clicksCount: number;
  isActive: boolean;
  startsAt?: Date;
  endsAt?: Date;
  createdAt: Date;
  provider?: {
    id: string;
    user: {
      name: string;
      slug: string;
    };
  };
}