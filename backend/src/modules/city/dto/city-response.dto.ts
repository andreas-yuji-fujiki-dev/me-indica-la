export class CityResponseDto {
  id: string;
  name: string;
  slug: string;
  state: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    providers: number;
    events: number;
    users: number;
  };
}