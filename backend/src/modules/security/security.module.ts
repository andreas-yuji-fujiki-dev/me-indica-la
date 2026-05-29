import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { SecurityMiddleware, AdminMiddleware, OwnershipMiddleware } from './security.middleware';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const expiresIn = configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '900';
        return {
          secret: configService.get<string>('JWT_ACCESS_SECRET') || 'default-secret-change-me',
          signOptions: { expiresIn: parseInt(expiresIn) || 900 },
        };
      },
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10, // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 50, // 50 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 200, // 200 requests per minute
      },
    ]),
  ],
  providers: [
    SecurityMiddleware,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [SecurityMiddleware],
})
export class SecurityModule {}
