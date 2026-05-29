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
import {EventService} from './event.service';
import {CreateEventDto} from './dto/create-event.dto';
import {UpdateEventDto} from './dto/update-event.dto';
import {EventResponseDto} from './dto/event-response.dto';

@ApiTags('Events')
@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar evento', description: 'Cria um novo evento' })
  @ApiBody({ type: CreateEventDto })
  @ApiResponse({ status: 201, description: 'Evento criado', type: EventResponseDto })
  create(@Body(ValidationPipe) createEventDto: CreateEventDto) {
    return this.eventService.create(createEventDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar eventos', description: 'Retorna lista paginada de eventos com filtros' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'isActive', required: false, example: 'true' })
  @ApiQuery({ name: 'isSponsored', required: false, example: 'true' })
  @ApiQuery({ name: 'cityId', required: false, description: 'Filtrar por cidade (UUID)' })
  @ApiQuery({ name: 'search', required: false, example: 'feira' })
  @ApiQuery({ name: 'upcoming', required: false, example: 'true', description: 'Apenas eventos futuros' })
  @ApiQuery({ name: 'past', required: false, example: 'true', description: 'Apenas eventos passados' })
  @ApiResponse({ status: 200, description: 'Lista paginada de eventos' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('isActive') isActive?: string,
    @Query('isSponsored') isSponsored?: string,
    @Query('cityId') cityId?: string,
    @Query('search') search?: string,
    @Query('upcoming') upcoming?: string,
    @Query('past') past?: string,
  ) {
    const filters = {
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      isSponsored: isSponsored === 'true' ? true : isSponsored === 'false' ? false : undefined,
      cityId,
      search,
      upcoming: upcoming === 'true',
      past: past === 'true',
    };
    return this.eventService.findAll(page, limit, filters);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Eventos futuros', description: 'Retorna eventos futuros ativos' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Eventos futuros' })
  getUpcoming(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.eventService.getUpcoming(page, limit);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Eventos recentes', description: 'Retorna eventos passados (já realizados)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Eventos passados' })
  getRecent(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.eventService.getRecent(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter evento por ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Detalhes do evento' })
  findOne(@Param('id') id: string) {
    return this.eventService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Obter evento por slug' })
  @ApiParam({ name: 'slug', example: 'feira-de-saude-2026' })
  @ApiResponse({ status: 200, description: 'Evento encontrado' })
  findBySlug(@Param('slug') slug: string) {
    return this.eventService.findBySlug(slug);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar evento' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ type: UpdateEventDto })
  @ApiResponse({ status: 200, description: 'Evento atualizado' })
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateEventDto: UpdateEventDto,
  ) {
    return this.eventService.update(id, updateEventDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover evento', description: 'Soft delete do evento' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Evento removido' })
  remove(@Param('id') id: string) {
    return this.eventService.remove(id);
  }

  @Patch(':id/toggle-active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Alternar ativo/inativo' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  toggleActive(@Param('id') id: string) {
    return this.eventService.toggleActive(id);
  }
}