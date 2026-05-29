import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Email do usuário', example: 'joao@email.com' })
  @IsEmail()
  @IsString()
  email: string;

  @ApiProperty({ description: 'Senha do usuário', example: 'minhaSenha123' })
  @IsString()
  @MinLength(6)
  password: string;
}
