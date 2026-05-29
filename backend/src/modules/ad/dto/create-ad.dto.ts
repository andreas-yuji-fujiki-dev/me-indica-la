import { IsString, IsOptional, IsUrl, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAdDto {
  @ApiPropertyOptional({ description: 'UUID do prestador vinculado (opcional)', example: 'uuid-prestador' })
  @IsString()
  @IsOptional()
  providerId?: string;

  @ApiProperty({ description: 'Título do anúncio', example: 'OdontoClínica - 50% OFF na primeira consulta' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'URL da imagem/banner do anúncio', example: 'https://images.com/banner-odonto.jpg' })
  @IsUrl()
  imageUrl: string;

  @ApiPropertyOptional({ description: 'URL de destino ao clicar', example: 'https://odontoclinica.com.br' })
  @IsUrl()
  @IsOptional()
  redirectUrl?: string;

  @ApiPropertyOptional({ description: 'Posição no site', example: 'home_top' })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiPropertyOptional({ description: 'Ativo?', example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Data de início (ISO8601)', example: '2026-06-01T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @ApiPropertyOptional({ description: 'Data de fim (ISO8601)', example: '2026-07-01T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  endsAt?: string;
}