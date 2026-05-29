import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, 'password'>;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<Omit<User, 'password'> | null> {
    try {
      const user = await this.userService.findByEmail(email);

      if (!user) {
        // Delay to prevent user enumeration
        await new Promise(resolve => setTimeout(resolve, 1000));
        return null;
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Conta desativada');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        // Delay to prevent brute force timing attacks
        await new Promise(resolve => setTimeout(resolve, 1000));
        return null;
      }

      // Remove password from return
      const { password: _, ...result } = user;
      return result;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Delay to prevent user enumeration
      await new Promise(resolve => setTimeout(resolve, 1000));
      return null;
    }
  }

  async login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string; user: Omit<User, 'password'> }> {
    const user = await this.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    await this.userService.updateLastLogin(user.id);

    const accessToken = this.jwtService.sign({ sub: user.id });
    const refreshToken = this.jwtService.sign({ sub: user.id }, { expiresIn: '7d' });

    return { accessToken, refreshToken, user };
  }

  async refreshTokens(refreshToken: string): Promise<LoginResponse> {
    try {
      const payload = this.jwtService.verify<TokenPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.userService.findOne(payload.sub);

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Usuário inválido ou inativo');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Token de refresh inválido ou expirado');
    }
  }

  async logout(userId: string): Promise<{ message: string }> {
    // In a real implementation, you would add the token to a blacklist
    // For now, we'll just return success
    return { message: 'Logout realizado com sucesso' };
  }

  private generateTokens(user: Omit<User, 'password'>): LoginResponse {
    const accessTokenPayload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const refreshTokenPayload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(accessTokenPayload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET') || 'default-secret',
      expiresIn: parseInt(this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '900'),
    });

    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'default-refresh-secret',
      expiresIn: parseInt(this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '604800'),
    });

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  async register(createUserDto: any): Promise<any> {
    try {
      return await this.userService.create(createUserDto);
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('already exists')) {
        throw new ConflictException(error.message);
      }
      throw new BadRequestException('Erro ao criar usuário');
    }
  }

  async validateToken(token: string): Promise<TokenPayload> {
    try {
      return this.jwtService.verify<TokenPayload>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
    } catch (error) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  // Método para gerar token CSRF
  generateCsrfToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

