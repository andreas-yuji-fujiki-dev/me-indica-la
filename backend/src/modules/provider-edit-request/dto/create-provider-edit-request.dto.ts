import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateProviderEditRequestDto {
  @IsString()
  providerId: string;

  @IsOptional() @IsString()
  businessName?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  whatsappBusiness?: string;

  @IsOptional() @IsString()
  instagram?: string;

  @IsOptional() @IsString()
  website?: string;

  @IsOptional() @IsArray()
  keywords?: string[];

  @IsOptional() @IsString()
  categoryId?: string;

  @IsOptional() @IsString()
  customCategory?: string;

  @IsOptional() @IsArray()
  serviceIds?: string[];

  @IsOptional() @IsArray()
  customServiceNames?: string[];

  @IsOptional() @IsString()
  address?: string;

  @IsOptional() @IsString()
  cityId?: string;

  @IsOptional() @IsString()
  cityName?: string;

  @IsOptional() @IsString()
  cityState?: string;

  @IsOptional() @IsString()
  logoUrl?: string;

  @IsOptional() @IsString()
  coverImageUrl?: string;

  @IsOptional() @IsArray()
  galleryImageUrls?: string[];

  @IsOptional()
  businessHours?: any;
}
