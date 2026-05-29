import { Injectable, NestMiddleware, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email: string;
    role: string;
  };
}

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // Security headers
    this.setSecurityHeaders(res);

    // Request size limit
    this.checkRequestSize(req, res, next);

    // Basic security checks
    this.basicSecurityChecks(req, res, next);
  }

  private setSecurityHeaders(res: Response): void {
    // Additional security headers beyond Helmet
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  private checkRequestSize(req: Request, res: Response, next: NextFunction): void {
    // Check content length to prevent large payload attacks
    const contentLength = req.headers['content-length'];
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
      throw new UnauthorizedException('Payload too large');
    }
    next();
  }

  private basicSecurityChecks(req: Request, res: Response, next: NextFunction): void {
    // Check for common attack patterns
    const userAgent = req.headers['user-agent'];
    const url = req.url.toLowerCase();

    // Block common malicious user agents
    const maliciousUserAgents = [
      'sqlmap',
      'nikto',
      'dirb',
      'wpscan',
      'nessus',
      'openvas',
      'burpsuite',
      'owasp',
      'zap',
    ];

    if (userAgent && maliciousUserAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
      throw new ForbiddenException('Forbidden');
    }

    // Block common malicious URLs
    const maliciousPatterns = [
      '../',
      '..\\\\',
      'etc/passwd',
      'boot.ini',
      '.env',
      '.git',
      'wp-admin',
      'phpmyadmin',
      'adminer',
    ];

    if (maliciousPatterns.some(pattern => url.includes(pattern))) {
      throw new ForbiddenException('Forbidden');
    }

    next();
  }
}

@Injectable()
export class AdminMiddleware implements NestMiddleware {
  use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // Check if user is admin
    const user = req.user;
    if (user && user.role !== 'ADMIN') {
      throw new ForbiddenException('Acesso negado: requer papel de administrador');
    }
    next();
  }
}

@Injectable()
export class OwnershipMiddleware implements NestMiddleware {
  constructor(private readonly entityName: string, private readonly idParam: string) {}

  use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // Check if user owns the resource
    const user = req.user;
    const entityId = req.params[this.idParam];

    // This would be implemented with actual database checks
    // For now, just pass through
    next();
  }
}
