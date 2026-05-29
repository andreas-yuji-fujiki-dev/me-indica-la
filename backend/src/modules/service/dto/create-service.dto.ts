import { IsString, IsOptional, IsArray, IsBoolean, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({ description: 'Nome do serviço', example: 'Médico' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Slug URL amigável', example: 'medico' })
  @IsString()
  slug: string;

  @ApiPropertyOptional({ description: 'Descrição do serviço', example: 'Serviços médicos clínicos e especializados' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Palavras-chave para busca', example: ['médico', 'consulta', 'clínico'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  @ApiPropertyOptional({ description: 'Ativo?', example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Em destaque?', example: false, default: false })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Mais procurado?', example: true, default: false })
  @IsBoolean()
  @IsOptional()
  isMostWanted?: boolean;

  @ApiPropertyOptional({ description: 'Ordem de exibição', example: 1, default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'UUIDs das categorias vinculadas', example: ['uuid-categoria-1'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categoryIds?: string[];
}