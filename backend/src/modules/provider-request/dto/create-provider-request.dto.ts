import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProviderRequestDto {
  @ApiProperty({ description: 'Nome da empresa ou prestador', example: 'João Silva - Encanador' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'WhatsApp para contato', example: '5511999999999' })
  @IsString()
  @IsOptional()
  whatsapp?: string;

  @ApiPropertyOptional({ description: 'Instagram', example: '@joao.encanador' })
  @IsString()
  @IsOptional()
  instagram?: string;

  @ApiPropertyOptional({ description: 'Localização/Cidade', example: 'São Paulo - SP' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: 'Mensagem ou descrição', example: 'Encanador com 10 anos de experiência, atendo toda a zona sul' })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiPropertyOptional({ description: 'Origem da solicitação', example: 'form', default: 'form' })
  @IsString()
  @IsOptional()
  origin?: string;

  @ApiPropertyOptional({ description: 'UUIDs dos serviços de interesse', example: ['uuid-servico-1'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  serviceIds?: string[];

  @ApiPropertyOptional({ description: 'UUIDs das categorias de interesse', example: ['uuid-categoria-1'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categoryIds?: string[];
}