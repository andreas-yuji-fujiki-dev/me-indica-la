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
import {CityService} from './city.service';
import {CreateCityDto} from './dto/create-city.dto';
import {UpdateCityDto} from './dto/update-city.dto';
import {CityResponseDto} from './dto/city-response.dto';

@ApiTags('Cities')
@Controller('city')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar cidade' })
  @ApiBody({ type: CreateCityDto })
  @ApiResponse({ status: 201, description: 'Cidade criada', type: CityResponseDto })
  create(@Body(ValidationPipe) createCityDto: CreateCityDto) {
    return this.cityService.create(createCityDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar cidades', description: 'Retorna lista paginada de cidades' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'isActive', required: false, example: 'true' })
  @ApiQuery({ name: 'state', required: false, example: 'SP', description: 'Filtrar por estado (sigla)' })
  @ApiQuery({ name: 'search', required: false, example: 'são paulo' })
  @ApiResponse({ status: 200, description: 'Lista paginada de cidades' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('isActive') isActive?: string,
    @Query('state') state?: string,
    @Query('search') search?: string,
  ) {
    const filters = {
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      state,
      search,
    };
    return this.cityService.findAll(page, limit, filters);
  }

  @Get('state/:state')
  @ApiOperation({ summary: 'Cidades por estado', description: 'Retorna cidades ativas de um estado' })
  @ApiParam({ name: 'state', example: 'SP', description: 'Sigla do estado (AC, AL, AP, etc.)' })
  @ApiResponse({ status: 200, description: 'Cidades do estado', type: [CityResponseDto] })
  findByState(@Param('state') state: string) {
    return this.cityService.findByState(state);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter cidade por ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Detalhes da cidade' })
  findOne(@Param('id') id: string) {
    return this.cityService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Obter cidade por slug' })
  @ApiParam({ name: 'slug', example: 'sao-paulo' })
  @ApiResponse({ status: 200, description: 'Cidade encontrada' })
  findBySlug(@Param('slug') slug: string) {
    return this.cityService.findBySlug(slug);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar cidade' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ type: UpdateCityDto })
  @ApiResponse({ status: 200, description: 'Cidade atualizada' })
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateCityDto: UpdateCityDto,
  ) {
    return this.cityService.update(id, updateCityDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desativar cidade', description: 'Marca a cidade como inativa (soft delete)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Cidade desativada' })
  remove(@Param('id') id: string) {
    return this.cityService.remove(id);
  }

  @Patch(':id/toggle-active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Alternar ativo/inativo' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  toggleActive(@Param('id') id: string) {
    return this.cityService.toggleActive(id);
  }
}