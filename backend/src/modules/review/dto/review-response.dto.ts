export class ReviewResponseDto {
  id: string;
  providerId: string;
  userId?: string;
  authorName?: string;
  rating: number;
  comment?: string;
  isApproved: boolean;
  createdAt: Date;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}