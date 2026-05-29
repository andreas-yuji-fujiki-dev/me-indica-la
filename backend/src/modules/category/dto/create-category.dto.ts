import { IsString, IsOptional, IsUrl, IsBoolean, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Nome da categoria', example: 'Saúde' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Slug URL amigável', example: 'saude' })
  @IsString()
  slug: string;

  @ApiPropertyOptional({ description: 'Descrição da categoria', example: 'Serviços relacionados à saúde, bem-estar e cuidados pessoais' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Ícone da categoria', example: 'medical-cross' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ description: 'URL da imagem', example: 'https://images.com/saude.jpg' })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Ativo?', example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Em destaque?', example: false, default: false })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Ordem de exibição', example: 1, default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}