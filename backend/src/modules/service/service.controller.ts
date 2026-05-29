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
  ValidationPipe} from '@nestjs/common';
import {ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody} from '@nestjs/swagger';
import {ServiceService} from './service.service';
import {CreateServiceDto} from './dto/create-service.dto';
import {UpdateServiceDto} from './dto/update-service.dto';
import {ServiceResponseDto} from './dto/service-response.dto';

@ApiTags('Services')
@Controller('service')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar serviço', description: 'Cria um novo serviço vinculado a categorias' })
  @ApiBody({ type: CreateServiceDto })
  @ApiResponse({ status: 201, description: 'Serviço criado', type: ServiceResponseDto })
  @ApiResponse({ status: 409, description: 'Slug já existe' })
  create(@Body(ValidationPipe) createServiceDto: CreateServiceDto) {
    return this.serviceService.create(createServiceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar serviços', description: 'Retorna lista paginada de serviços com filtros' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'isActive', required: false, example: 'true' })
  @ApiQuery({ name: 'isFeatured', required: false, example: 'true' })
  @ApiQuery({ name: 'isMostWanted', required: false, example: 'true' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filtrar por categoria (UUID)' })
  @ApiQuery({ name: 'hasActiveProviders', required: false, description: 'Apenas serviços com pelo menos um prestador ativo' })
  @ApiQuery({ name: 'search', required: false, example: 'médico' })
  @ApiResponse({ status: 200, description: 'Lista paginada de serviços' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('isActive') isActive?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('isMostWanted') isMostWanted?: string,
    @Query('categoryId') categoryId?: string,
    @Query('hasActiveProviders') hasActiveProviders?: string,
    @Query('search') search?: string,
  ) {
    const filters = {
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
      isMostWanted: isMostWanted === 'true' ? true : isMostWanted === 'false' ? false : undefined,
      categoryId,
      hasActiveProviders: hasActiveProviders === 'true' ? true : undefined,
      search,
    };
    return this.serviceService.findAll(page, limit, filters);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Serviços em destaque', description: 'Retorna serviços ativos marcados como destaque' })
  @ApiResponse({ status: 200, description: 'Serviços em destaque', type: [ServiceResponseDto] })
  getFeatured() {
    return this.serviceService.getFeatured();
  }

  @Get('most-wanted')
  @ApiOperation({ summary: 'Serviços mais procurados', description: 'Retorna serviços marcados como "mais procurados"' })
  @ApiResponse({ status: 200, description: 'Serviços mais procurados', type: [ServiceResponseDto] })
  getMostWanted() {
    return this.serviceService.getMostWanted();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter serviço por ID', description: 'Retorna detalhes completos de um serviço' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Detalhes do serviço', type: ServiceResponseDto })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  findOne(@Param('id') id: string) {
    return this.serviceService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Obter serviço por slug', description: 'Retorna serviço pelo slug (URL amigável)' })
  @ApiParam({ name: 'slug', example: 'medico' })
  @ApiResponse({ status: 200, description: 'Serviço encontrado' })
  findBySlug(@Param('slug') slug: string) {
    return this.serviceService.findBySlug(slug);
  }

  @Get(':id/providers')
  @ApiOperation({ summary: 'Listar prestadores do serviço', description: 'Retorna prestadores vinculados a um serviço (núcleo da navegação Categoria > Serviço > Prestador)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Prestadores do serviço' })
  getProviders(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.serviceService.getProviders(id, page, limit);
  }

  @Get(':id/categories')
  @ApiOperation({ summary: 'Categorias do serviço', description: 'Retorna as categorias vinculadas ao serviço' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Categorias do serviço' })
  getCategories(@Param('id') id: string) {
    return this.serviceService.getCategories(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar serviço', description: 'Atualiza dados de um serviço existente' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ type: UpdateServiceDto })
  @ApiResponse({ status: 200, description: 'Serviço atualizado' })
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateServiceDto: UpdateServiceDto,
  ) {
    return this.serviceService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover serviço', description: 'Soft delete do serviço' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Serviço removido' })
  remove(@Param('id') id: string) {
    return this.serviceService.remove(id);
  }

  @Patch(':id/toggle-active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Alternar ativo/inativo' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  toggleActive(@Param('id') id: string) {
    return this.serviceService.toggleActive(id);
  }

  @Patch(':id/toggle-featured')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Alternar destaque' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  toggleFeatured(@Param('id') id: string) {
    return this.serviceService.toggleFeatured(id);
  }

  @Patch(':id/toggle-most-wanted')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Alternar "mais procurado"' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  toggleMostWanted(@Param('id') id: string) {
    return this.serviceService.toggleMostWanted(id);
  }

  @Patch(':id/sort-order')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar ordem de exibição' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ schema: { type: 'object', properties: { sortOrder: { type: 'integer', example: 1 } } } })
  updateSortOrder(
    @Param('id') id: string,
    @Body('sortOrder', ParseIntPipe) sortOrder: number,
  ) {
    return this.serviceService.updateSortOrder(id, sortOrder);
  }
}