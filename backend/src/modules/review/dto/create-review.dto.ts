import { IsString, IsInt, IsOptional, IsBoolean, Min, Max, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ description: 'UUID do prestador avaliado', example: 'uuid-prestador' })
  @IsString()
  providerId: string;

  @ApiPropertyOptional({ description: 'UUID do usuário (opcional para avaliação anônima)', example: 'uuid-usuario' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Nome do autor (se avaliação anônima)', example: 'Maria Souza' })
  @IsString()
  @IsOptional()
  authorName?: string;

  @ApiProperty({ description: 'Nota (1 a 5)', example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Comentário (mínimo 10 caracteres)', example: 'Excelente atendimento! Profissional muito atencioso e competente.' })
  @IsString()
  @IsOptional()
  @MinLength(10)
  @MaxLength(1000)
  comment?: string;

  @ApiPropertyOptional({ description: 'Aprovado para exibição?', example: false, default: false })
  @IsBoolean()
  @IsOptional()
  isApproved?: boolean;
}