import { 
    IsEmail, 
    IsString, 
    IsOptional, 
    IsBoolean, 
    IsEnum,
    MinLength,
    MaxLength
  } from 'class-validator';
  import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
  import { UserRole } from '@prisma/client';
  
  export class CreateUserDto {
    @ApiProperty({ description: 'Email do usuário', example: 'joao.silva@email.com' })
    @IsEmail()
    @IsString()
    email: string;
  
    @ApiPropertyOptional({ description: 'Telefone com DDD', example: '5511999999999' })
    @IsString()
    @IsOptional()
    phone?: string;
  
    @ApiProperty({ description: 'Senha (mínimo 6 caracteres)', example: 'minhaSenha123', minLength: 6, maxLength: 100 })
    @IsString()
    @MinLength(6)
    @MaxLength(100)
    password: string;
  
    @ApiProperty({ description: 'Nome completo', example: 'João Silva', minLength: 2, maxLength: 100 })
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name: string;
  
    @ApiProperty({ description: 'Slug URL amigável', example: 'joao-silva' })
    @IsString()
    slug: string;
  
    @ApiPropertyOptional({ description: 'URL do avatar', example: 'https://images.com/avatar.jpg' })
    @IsString()
    @IsOptional()
    avatarUrl?: string;
  
    @ApiPropertyOptional({ description: 'UUID da cidade', example: 'uuid-cidade' })
    @IsString()
    @IsOptional()
    cityId?: string;
  
    @ApiPropertyOptional({ description: 'Papel do usuário', enum: UserRole, default: UserRole.USER })
    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;
  
    @ApiPropertyOptional({ description: 'Usuário ativo?', example: true, default: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
  
    @ApiPropertyOptional({ description: 'Receber newsletter?', example: false, default: false })
    @IsBoolean()
    @IsOptional()
    receiveNewsletter?: boolean;
  
    @ApiPropertyOptional({ description: 'Receber promoções?', example: false, default: false })
    @IsBoolean()
    @IsOptional()
    receivePromotions?: boolean;
  }