import { PartialType } from '@nestjs/mapped-types';
import { CreateProviderDto } from './create-provider.dto';
import { IsEnum, IsNumber, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import { ProviderStatus, PlanType } from '@prisma/client';

export class UpdateProviderDto extends PartialType(CreateProviderDto) {
  @IsEnum(ProviderStatus)
  @IsOptional()
  status?: ProviderStatus;

  @IsEnum(PlanType)
  @IsOptional()
  plan?: PlanType;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;

  @IsBoolean()
  @IsOptional()
  isFeaturedHome?: boolean;

  @IsBoolean()
  @IsOptional()
  isFeaturedCategory?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  featuredPriority?: number;

  @IsBoolean()
  @IsOptional()
  isAdvertiser?: boolean;

  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  averageRating?: number;
}