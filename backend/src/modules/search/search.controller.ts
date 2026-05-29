import {Controller,
  Get,
  Query,
  ParseIntPipe,
  DefaultValuePipe} from '@nestjs/common';
import {ApiTags, ApiOperation, ApiResponse, ApiQuery} from '@nestjs/swagger';
import {SearchService} from './search.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Busca unificada', 
    description: 'Busca por prestadores, serviços, categorias e eventos. Retorna resultados agrupados por tipo e uma lista combinada ordenada por relevância (correspondência exata primeiro).' 
  })
  @ApiQuery({ name: 'q', required: true, example: 'médico', description: 'Termo de busca (mínimo 2 caracteres)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'cityId', required: false, description: 'Filtrar por cidade (UUID)' })
  @ApiQuery({ name: 'serviceId', required: false, description: 'Filtrar por serviço (UUID)' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filtrar por categoria (UUID)' })
  @ApiResponse({ status: 200, description: 'Resultados da busca agrupados' })
  searchAll(
    @Query('q') query: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('cityId') cityId?: string,
    @Query('serviceId') serviceId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    const filters = { cityId, serviceId, categoryId };
    return this.searchService.searchAll(query, page, limit, filters);
  }

  @Get('autocomplete')
  @ApiOperation({ 
    summary: 'Autocomplete', 
    description: 'Sugestões para campo de busca. Retorna prestadores, serviços e categorias que correspondem ao termo.' 
  })
  @ApiQuery({ name: 'q', required: true, example: 'méd', description: 'Termo de busca (mínimo 2 caracteres)' })
  @ApiQuery({ name: 'limit', required: false, example: 5, description: 'Máximo de sugestões' })
  @ApiResponse({ status: 200, description: 'Sugestões de autocomplete' })
  autocomplete(
    @Query('q') query: string,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ) {
    return this.searchService.autocomplete(query, limit);
  }
}