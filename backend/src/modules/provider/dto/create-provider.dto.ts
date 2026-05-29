import {
    IsString,
    IsOptional,
    IsArray,
    IsUrl,
    IsObject,
  } from 'class-validator';
  import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

  export class CreateProviderDto {
    @ApiProperty({ description: 'UUID do usuário proprietário', example: 'uuid-usuario' })
    @IsString()
    userId: string;

    @ApiProperty({ description: 'Descrição do prestador', example: 'Clínica especializada em cardiologia há 15 anos' })
    @IsString()
    description: string;

    @ApiProperty({ description: 'WhatsApp Business (com DDI)', example: '+5511999999999' })
    @IsString()
    whatsappBusiness: string;

    @ApiProperty({ description: 'Endereço completo', example: 'Av. Paulista, 1000, São Paulo - SP' })
    @IsString()
    address: string;

    @ApiPropertyOptional({ description: 'Coordenadas geográficas', example: { lat: -23.561, lng: -46.656 } })
    @IsObject()
    @IsOptional()
    coordinates?: any;

    @ApiProperty({ description: 'URL da logo', example: 'https://cdn.com/logo.jpg' })
    @IsString()
    logoUrl: string;

    @ApiPropertyOptional({ description: 'UUID da cidade', example: 'uuid-cidade' })
    @IsString()
    @IsOptional()
    cityId?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    cityName?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    cityState?: string;

    @ApiProperty({ description: 'Horários de funcionamento' })
    @IsObject()
    businessHours: any;

    @ApiPropertyOptional({ description: 'Palavras-chave para busca', example: ['cardiologia', 'coração'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    keywords?: string[];

    @ApiPropertyOptional({ description: 'Instagram', example: '@drjoao.cardiologista' })
    @IsString()
    @IsOptional()
    instagram?: string;

    @ApiPropertyOptional({ description: 'Website', example: 'https://drjoao.com.br' })
    @IsUrl()
    @IsOptional()
    website?: string;

    @ApiPropertyOptional({ description: 'URL da imagem de capa', example: 'https://cdn.com/capa.jpg' })
    @IsString()
    @IsOptional()
    coverImageUrl?: string;

    @ApiPropertyOptional({ description: 'Número do alvará/licença', example: 'ALV-2025-12345' })
    @IsString()
    @IsOptional()
    businessLicense?: string;

    @ApiPropertyOptional({ description: 'UUIDs dos serviços prestados', example: ['uuid-servico-1'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    serviceIds?: string[];

    @ApiPropertyOptional({ description: 'UUID da categoria principal', example: 'uuid-categoria' })
    @IsString()
    @IsOptional()
    categoryId?: string;

    @ApiPropertyOptional({ description: 'Categoria personalizada (quando não está na lista)', example: 'Consultoria Jurídica' })
    @IsString()
    @IsOptional()
    customCategory?: string;

    @ApiPropertyOptional({ description: 'Serviços personalizados (quando não estão na lista)', example: ['Assessoria Tributária'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    customServiceNames?: string[];

    @ApiPropertyOptional({ description: 'URLs das imagens da galeria', example: ['https://cdn.com/img1.jpg'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    galleryImageUrls?: string[];
  }
