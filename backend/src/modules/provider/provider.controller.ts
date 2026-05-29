import {Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException} from '@nestjs/common';
import {ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody, ApiConsumes} from '@nestjs/swagger';
import {FileInterceptor} from '@nestjs/platform-express';
import {diskStorage} from 'multer';
import {extname, join} from 'path';
import {mkdirSync} from 'fs';
import {ProviderService} from './provider.service';
import {CreateProviderDto} from './dto/create-provider.dto';
import {UpdateProviderDto} from './dto/update-provider.dto';
import {ProviderResponseDto} from './dto/provider-response.dto';
import {PlanType} from '@prisma/client';

@ApiTags('Providers')
@Controller('provider')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  @Post('upload/logo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload de logo do prestador' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'URL da logo salva' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'images', 'providers', 'logo-picture');
          mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          cb(null, `logo-${Date.now()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(new BadRequestException('Apenas imagens são aceitas'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');
    const baseUrl = process.env.API_URL || 'http://localhost:3001';
    return { url: `${baseUrl}/uploads/images/providers/logo-picture/${file.filename}` };
  }

  @Post('upload/banner')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload de banner do prestador' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'URL do banner salvo' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'images', 'providers', 'banners');
          mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          cb(null, `banner-${Date.now()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(new BadRequestException('Apenas imagens são aceitas'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadBanner(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');
    const baseUrl = process.env.API_URL || 'http://localhost:3001';
    return { url: `${baseUrl}/uploads/images/providers/banners/${file.filename}` };
  }

  @Post('upload/gallery')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload de imagem para galeria do prestador' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'URL da imagem salva' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'images', 'providers', 'gallery');
          mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          cb(null, `gallery-${Date.now()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(new BadRequestException('Apenas imagens são aceitas'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadGalleryImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');
    const baseUrl = process.env.API_URL || 'http://localhost:3001';
    return { url: `${baseUrl}/uploads/images/providers/gallery/${file.filename}` };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar perfil de prestador', description: 'Cria um perfil de prestador vinculado a um usuário existente' })
  @ApiBody({ type: CreateProviderDto })
  @ApiResponse({ status: 201, description: 'Perfil criado', type: ProviderResponseDto })
  @ApiResponse({ status: 409, description: 'Usuário já possui perfil de prestador' })
  create(@Body(ValidationPipe) createProviderDto: CreateProviderDto) {
    return this.providerService.create(createProviderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar prestadores', description: 'Retorna lista paginada de prestadores com múltiplos filtros' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] })
  @ApiQuery({ name: 'plan', required: false, enum: ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'] })
  @ApiQuery({ name: 'cityId', required: false, description: 'Filtrar por cidade (UUID)' })
  @ApiQuery({ name: 'serviceId', required: false, description: 'Filtrar por serviço (UUID)' })
  @ApiQuery({ name: 'search', required: false, example: 'joão' })
  @ApiQuery({ name: 'minRating', required: false, example: '4', description: 'Nota mínima (0-5)' })
  @ApiQuery({ name: 'isVerified', required: false, example: 'true' })
  @ApiQuery({ name: 'isActive', required: false, example: 'true' })
  @ApiQuery({ name: 'isFeaturedHome', required: false, example: 'true' })
  @ApiResponse({ status: 200, description: 'Lista paginada de prestadores' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('plan') plan?: string,
    @Query('cityId') cityId?: string,
    @Query('serviceId') serviceId?: string,
    @Query('search') search?: string,
    @Query('minRating') minRating?: string,
    @Query('isVerified') isVerified?: string,
    @Query('isActive') isActive?: string,
    @Query('isFeaturedHome') isFeaturedHome?: string,
  ) {
    const filters = {
      status,
      plan,
      cityId,
      serviceId,
      search,
      minRating: minRating ? parseFloat(minRating) : undefined,
      isVerified: isVerified === 'true' ? true : isVerified === 'false' ? false : undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      isFeaturedHome: isFeaturedHome === 'true' ? true : isFeaturedHome === 'false' ? false : undefined,
    };
    return this.providerService.findAll(page, limit, filters);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Prestadores em destaque (home)', description: 'Retorna prestadores marcados como destaque na página inicial' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Prestadores em destaque' })
  getFeatured(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.providerService.getFeatured(page, limit);
  }

  @Get('nearby/:cityId')
  @ApiOperation({ summary: 'Prestadores por cidade', description: 'Retorna prestadores ativos em uma cidade específica' })
  @ApiParam({ name: 'cityId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Prestadores da cidade' })
  getNearby(
    @Param('cityId') cityId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.providerService.getNearby(cityId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe do prestador', description: 'Retorna informações completas do prestador (incrementa view)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Detalhes do prestador', type: ProviderResponseDto })
  @ApiResponse({ status: 404, description: 'Prestador não encontrado' })
  findOne(@Param('id') id: string) {
    return this.providerService.findOne(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Perfil do prestador por usuário', description: 'Retorna o perfil de prestador vinculado a um usuário' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Perfil encontrado' })
  findByUserId(@Param('userId') userId: string) {
    return this.providerService.findByUserId(userId);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Perfil do prestador por slug', description: 'Retorna perfil pelo slug do usuário' })
  @ApiParam({ name: 'slug', example: 'dr-joao' })
  @ApiResponse({ status: 200, description: 'Perfil encontrado' })
  findBySlug(@Param('slug') slug: string) {
    return this.providerService.findBySlug(slug);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar prestador', description: 'Atualiza dados do perfil de prestador' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ type: UpdateProviderDto })
  @ApiResponse({ status: 200, description: 'Perfil atualizado' })
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateProviderDto: UpdateProviderDto,
  ) {
    return this.providerService.update(id, updateProviderDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover prestador', description: 'Soft delete do perfil de prestador' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Perfil removido' })
  remove(@Param('id') id: string) {
    return this.providerService.remove(id);
  }

  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprovar prestador', description: 'Aprova o cadastro do prestador (status APPROVED + isActive true)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Prestador aprovado' })
  approveProvider(@Param('id') id: string) {
    return this.providerService.approveProvider(id);
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rejeitar prestador', description: 'Rejeita o cadastro do prestador com motivo opcional' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ schema: { type: 'object', properties: { reason: { type: 'string', example: 'Documentos incompletos' } } } })
  @ApiResponse({ status: 200, description: 'Prestador rejeitado' })
  rejectProvider(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.providerService.rejectProvider(id, reason);
  }

  @Patch(':id/plan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar plano', description: 'Atualiza o plano de assinatura do prestador' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ schema: { type: 'object', properties: { plan: { type: 'string', enum: ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'] }, expiresInDays: { type: 'integer', example: 365 } } } })
  @ApiResponse({ status: 200, description: 'Plano atualizado' })
  updatePlan(
    @Param('id') id: string,
    @Body('plan') plan: PlanType,
    @Body('expiresInDays') expiresInDays?: number,
  ) {
    return this.providerService.updatePlan(id, plan, expiresInDays);
  }

  @Patch(':id/clicks/:type')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar clique', description: 'Incrementa contador de cliques no WhatsApp, Instagram ou website' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'type', enum: ['whatsapp', 'instagram', 'website'] })
  @ApiResponse({ status: 200, description: 'Clique registrado' })
  incrementClick(
    @Param('id') id: string,
    @Param('type') type: 'whatsapp' | 'instagram' | 'website',
  ) {
    return this.providerService.incrementClick(id, type);
  }

  @Patch(':id/toggle-feature/:feature')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Alternar destaque', description: 'Ativa/desativa destaque na home ou na categoria' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'feature', enum: ['home', 'category'] })
  @ApiResponse({ status: 200, description: 'Destaque alternado' })
  toggleFeature(
    @Param('id') id: string,
    @Param('feature') feature: 'home' | 'category',
  ) {
    return this.providerService.toggleFeature(id, feature);
  }
}