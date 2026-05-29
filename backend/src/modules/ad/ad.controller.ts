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
import {AdService} from './ad.service';
import {CreateAdDto} from './dto/create-ad.dto';
import {UpdateAdDto} from './dto/update-ad.dto';
import {AdResponseDto} from './dto/ad-response.dto';

@ApiTags('Ads')
@Controller('ad')
export class AdController {
  constructor(private readonly adService: AdService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar anúncio', description: 'Cria um novo anúncio/publicidade' })
  @ApiBody({ type: CreateAdDto })
  @ApiResponse({ status: 201, description: 'Anúncio criado', type: AdResponseDto })
  create(@Body(ValidationPipe) createAdDto: CreateAdDto) {
    return this.adService.create(createAdDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar anúncios', description: 'Retorna lista paginada de anúncios' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'isActive', required: false, example: 'true' })
  @ApiQuery({ name: 'position', required: false, example: 'home_top', description: 'Filtrar por posição' })
  @ApiQuery({ name: 'providerId', required: false, description: 'Filtrar por prestador (UUID)' })
  @ApiQuery({ name: 'activeOnly', required: false, example: 'true', description: 'Apenas anúncios dentro do período de validade' })
  @ApiResponse({ status: 200, description: 'Lista paginada de anúncios' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('isActive') isActive?: string,
    @Query('position') position?: string,
    @Query('providerId') providerId?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    const filters = {
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      position,
      providerId,
      activeOnly: activeOnly === 'true',
    };
    return this.adService.findAll(page, limit, filters);
  }

  @Get('position/:position')
  @ApiOperation({ summary: 'Anúncios por posição', description: 'Retorna anúncios ativos dentro do período para uma posição específica' })
  @ApiParam({ name: 'position', example: 'home_top', description: 'Posição do anúncio (ex: home_top, home_bottom, sidebar)' })
  @ApiResponse({ status: 200, description: 'Anúncios ativos na posição' })
  getActiveByPosition(@Param('position') position: string) {
    return this.adService.getActiveByPosition(position);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter anúncio por ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Detalhes do anúncio' })
  findOne(@Param('id') id: string) {
    return this.adService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar anúncio' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ type: UpdateAdDto })
  @ApiResponse({ status: 200, description: 'Anúncio atualizado' })
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateAdDto: UpdateAdDto,
  ) {
    return this.adService.update(id, updateAdDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover anúncio' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Anúncio removido' })
  remove(@Param('id') id: string) {
    return this.adService.remove(id);
  }

  @Patch(':id/click')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar clique', description: 'Incrementa o contador de cliques do anúncio' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Clique registrado' })
  incrementClick(@Param('id') id: string) {
    return this.adService.incrementClick(id);
  }
}