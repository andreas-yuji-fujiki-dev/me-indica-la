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
import {CategoryService} from './category.service';
import {CreateCategoryDto} from './dto/create-category.dto';
import {UpdateCategoryDto} from './dto/update-category.dto';
import {CategoryResponseDto} from './dto/category-response.dto';

@ApiTags('Categories')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar categoria', description: 'Cria uma nova categoria de serviço' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({ status: 201, description: 'Categoria criada', type: CategoryResponseDto })
  @ApiResponse({ status: 409, description: 'Slug já existe' })
  create(@Body(ValidationPipe) createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Listar categorias', 
    description: 'Retorna lista paginada de categorias com filtros opcionais' 
  })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Itens por página' })
  @ApiQuery({ name: 'isActive', required: false, example: 'true', description: 'Filtrar por ativo/inativo' })
  @ApiQuery({ name: 'isFeatured', required: false, example: 'true', description: 'Filtrar por destaque' })
  @ApiQuery({ name: 'search', required: false, example: 'saúde', description: 'Buscar por nome ou descrição' })
  @ApiResponse({ status: 200, description: 'Lista paginada de categorias' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('isActive') isActive?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('search') search?: string,
  ) {
    const filters = {
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
      search,
    };
    return this.categoryService.findAll(page, limit, filters);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Listar categorias em destaque', description: 'Retorna categorias marcadas como destaque e ativas' })
  @ApiResponse({ status: 200, description: 'Categorias em destaque', type: [CategoryResponseDto] })
  getFeatured() {
    return this.categoryService.getFeatured();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter categoria por ID', description: 'Retorna detalhes completos de uma categoria' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'UUID da categoria' })
  @ApiResponse({ status: 200, description: 'Detalhes da categoria', type: CategoryResponseDto })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Obter categoria por slug', description: 'Retorna categoria pelo slug (URL amigável)' })
  @ApiParam({ name: 'slug', example: 'saude', description: 'Slug da categoria' })
  @ApiResponse({ status: 200, description: 'Categoria encontrada', type: CategoryResponseDto })
  @ApiResponse({ status: 404, description: 'Slug não encontrado' })
  findBySlug(@Param('slug') slug: string) {
    return this.categoryService.findBySlug(slug);
  }

  @Get(':id/services')
  @ApiOperation({ summary: 'Listar serviços da categoria', description: 'Retorna serviços vinculados a uma categoria' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'UUID da categoria' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false, example: 'corte', description: 'Filtrar por nome do serviço' })
  @ApiResponse({ status: 200, description: 'Serviços da categoria' })
  getServices(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.categoryService.getServices(id, page, limit, { search });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar categoria', description: 'Atualiza os dados de uma categoria existente' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiResponse({ status: 200, description: 'Categoria atualizada', type: CategoryResponseDto })
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover categoria', description: 'Soft delete: marca como deletado e inativo' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Categoria removida' })
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }

  @Patch(':id/toggle-active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Alternar ativo/inativo', description: 'Inverte o status isActive da categoria' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Status alternado' })
  toggleActive(@Param('id') id: string) {
    return this.categoryService.toggleActive(id);
  }

  @Patch(':id/toggle-featured')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Alternar destaque', description: 'Inverte o status isFeatured da categoria' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Destaque alternado' })
  toggleFeatured(@Param('id') id: string) {
    return this.categoryService.toggleFeatured(id);
  }

  @Patch(':id/sort-order')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar ordem', description: 'Atualiza a ordem de exibição da categoria' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ schema: { type: 'object', properties: { sortOrder: { type: 'integer', example: 1 } } } })
  @ApiResponse({ status: 200, description: 'Ordem atualizada' })
  updateSortOrder(
    @Param('id') id: string,
    @Body('sortOrder', ParseIntPipe) sortOrder: number,
  ) {
    return this.categoryService.updateSortOrder(id, sortOrder);
  }
}