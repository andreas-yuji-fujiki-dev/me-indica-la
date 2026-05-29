import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ProviderStatus } from '@prisma/client';
import { CreateProviderRequestDto } from './create-provider-request.dto';

export class UpdateProviderRequestDto extends PartialType(CreateProviderRequestDto) {
  @IsEnum(ProviderStatus)
  @IsOptional()
  status?: ProviderStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}