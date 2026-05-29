import { IsString, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { State } from '@prisma/client';

export class CreateCityDto {
  @ApiProperty({ description: 'Nome da cidade', example: 'São Paulo' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Slug URL amigável', example: 'sao-paulo' })
  @IsString()
  slug: string;

  @ApiProperty({ description: 'Sigla do estado', enum: State, example: 'SP' })
  @IsEnum(State)
  state: State;

  @ApiPropertyOptional({ description: 'Ativa?', example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}