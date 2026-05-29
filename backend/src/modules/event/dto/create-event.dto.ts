import { IsString, IsOptional, IsUrl, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ description: 'Nome do evento', example: 'Feira de Saúde e Bem-Estar 2026' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Slug URL amigável', example: 'feira-de-saude-2026' })
  @IsString()
  slug: string;

  @ApiPropertyOptional({ description: 'Descrição do evento', example: 'Feira com palestras, exames gratuitos e orientação médica' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Data do evento (ISO8601)', example: '2026-07-15T09:00:00.000Z' })
  @IsDateString()
  eventDate: string;

  @ApiPropertyOptional({ description: 'WhatsApp de contato', example: '5511999999999' })
  @IsString()
  @IsOptional()
  whatsapp?: string;

  @ApiPropertyOptional({ description: 'Instagram do evento', example: '@feira.saude2026' })
  @IsString()
  @IsOptional()
  instagram?: string;

  @ApiPropertyOptional({ description: 'Link externo', example: 'https://feirasaude.com.br' })
  @IsUrl()
  @IsOptional()
  externalLink?: string;

  @ApiPropertyOptional({ description: 'Local do evento', example: 'Praça Central, São Paulo - SP' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: 'URL da imagem de capa', example: 'https://images.com/feira-saude.jpg' })
  @IsUrl()
  @IsOptional()
  coverImageUrl?: string;

  @ApiPropertyOptional({ description: 'UUID da cidade', example: 'uuid-cidade' })
  @IsString()
  @IsOptional()
  cityId?: string;

  @ApiPropertyOptional({ description: 'Ativo?', example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Patrocinado?', example: false, default: false })
  @IsBoolean()
  @IsOptional()
  isSponsored?: boolean;

  @ApiPropertyOptional({ description: 'UUID do usuário criador', example: 'uuid-usuario' })
  @IsString()
  @IsOptional()
  createdByUserId?: string;

  @ApiPropertyOptional({ description: 'UUID do prestador criador', example: 'uuid-prestador' })
  @IsString()
  @IsOptional()
  createdByProviderId?: string;
}