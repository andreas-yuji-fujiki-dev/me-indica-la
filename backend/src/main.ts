import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import * as csurf from 'csurf';
import { ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: false,
    bodyParser: true,
    cors: false, // Desabilitar CORS padrão para configurar manualmente
  });

  const configService = app.get(ConfigService);

  // === SEGURANÇA HTTP ===

  // Helmet: protege contra XSS, clickjacking, MIME sniffing, etc.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: ["'self'", 'https:'],
          objectSrc: ["'none'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false, // necessário para Swagger UI
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      crossOriginResourcePolicy: { policy: 'same-site' },
      originAgentCluster: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xContentTypeOptions: true,
      xDnsPrefetchControl: true,
      xDownloadOptions: true,
      xFrameOptions: { action: 'deny' },
      xPoweredBy: false,
      xssFilter: true,
    }),
  );

  // Cookie Parser para CSRF e sessões
  app.use(cookieParser(configService.get<string>('COOKIE_SECRET') || 'default-cookie-secret'));

  // CSRF Protection (desabilitado para APIs, mas mantido para referência)
  // app.use(csurf({ cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' } }));

  // CORS restritivo - apenas origens autorizadas
  const allowedOrigins = configService.get<string>('CORS_ORIGIN')
    ? configService.get<string>('CORS_ORIGIN')!.split(',').map(o => o.trim())
    : ['http://localhost:3000', 'https://meindicala.com'];

  app.enableCors({
    origin: (origin, callback) => {
      // Em desenvolvimento, permitir todas origens
      if (!origin || configService.get<string>('NODE_ENV') !== 'production') {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Origem não permitida pelo CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    credentials: true,
    maxAge: 3600,
    exposedHeaders: ['Content-Disposition'],
  });

  // Limite de tamanho do corpo da requisição
  app.use((req, res, next) => {
    req.setTimeout(30000); // 30 segundos
    res.setTimeout(30000); // 30 segundos
    next();
  });

  // === VALIDAÇÃO GLOBAL ===
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,                  // remove campos não declarados no DTO
      forbidNonWhitelisted: true,       // REJEITA campos não declarados
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: configService.get<string>('NODE_ENV') === 'production', // esconde detalhes em prod
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  // === RATE LIMITING GLOBAL ===
  // Configurado no SecurityModule

  // Static file serving for uploads
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger - desabilitado em produção por segurança
  if (configService.get<string>('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Me Indica Lá - API')
      .setDescription(
        'Guia Digital de Negócios e Prestadores de Serviço\n\n' +
        '## Fluxo de Navegação\n' +
        '**Categoria → Serviço → Prestador**\n\n' +
        '1. `GET /category` → lista categorias ativas\n' +
        '2. `GET /category/{id}/services` → serviços da categoria\n' +
        '3. `GET /service/{id}/providers` → prestadores do serviço\n' +
        '4. `GET /provider/{id}` → detalhe completo do prestador\n\n' +
        '## Cadastro de Prestador\n' +
        '1. `POST /provider-request` → cria solicitação pendente\n' +
        '2. `PATCH /provider-request/{id}/approve` → aprovação manual\n' +
        '3. `POST /provider` → cria perfil de prestador (requer usuário)',
      )
      .setVersion('1.0')
      .addServer(configService.get<string>('API_URL') || 'http://localhost:3001', 'Development server')
      .addTag('Categories', 'Gerenciamento de categorias de serviços')
      .addTag('Services', 'Gerenciamento de serviços')
      .addTag('Providers', 'Gerenciamento de prestadores')
      .addTag('Users', 'Gerenciamento de usuários')
      .addTag('Cities', 'Gerenciamento de cidades')
      .addTag('Reviews', 'Avaliações e comentários')
      .addTag('Ads', 'Anúncios e publicidade')
      .addTag('Events', 'Eventos')
      .addTag('Provider Requests', 'Solicitações de cadastro de prestadores')
      .addTag('Favorites', 'Favoritos de usuários')
      .addTag('Search', 'Busca unificada')
      .addTag('Dashboard', 'Painel administrativo')
      .addTag('Authentication', 'Autenticação e autorização')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Tratamento de erros global
  app.use((err: any, req: any, res: any, next: any) => {
    if (configService.get<string>('NODE_ENV') === 'production') {
      // Em produção, não expor detalhes do erro
      console.error('Error:', err.message);
      res.status(500).json({
        statusCode: 500,
        message: 'Erro interno do servidor',
        timestamp: new Date().toISOString(),
      });
    } else {
      // Em desenvolvimento, mostrar detalhes do erro
      console.error('Error:', err.stack);
      res.status(err.status || 500).json({
        statusCode: err.status || 500,
        message: err.message || 'Erro interno do servidor',
        error: err.name,
        timestamp: new Date().toISOString(),
        ...(configService.get<string>('NODE_ENV') !== 'production' && { stack: err.stack }),
      });
    }
  });

  const port = configService.get<number>('PORT') || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);

  // Log Swagger URL after server starts
  if (configService.get<string>('NODE_ENV') !== 'production') {
    console.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
  }
}
bootstrap();

