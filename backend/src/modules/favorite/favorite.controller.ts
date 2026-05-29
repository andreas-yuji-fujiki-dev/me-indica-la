import {Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus} from '@nestjs/common';
import {ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam} from '@nestjs/swagger';
import {FavoriteService} from './favorite.service';

@ApiTags('Favorites')
@Controller('favorite')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  // Provider favorites
  @Post('provider/:userId/:providerId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Favoritar prestador', description: 'Adiciona um prestador aos favoritos do usuário' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'providerId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Prestador favoritado' })
  @ApiResponse({ status: 409, description: 'Já está nos favoritos' })
  addProvider(
    @Param('userId') userId: string,
    @Param('providerId') providerId: string,
  ) {
    return this.favoriteService.addProvider(userId, providerId);
  }

  @Delete('provider/:userId/:providerId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desfavoritar prestador' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'providerId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Prestador removido dos favoritos' })
  removeProvider(
    @Param('userId') userId: string,
    @Param('providerId') providerId: string,
  ) {
    return this.favoriteService.removeProvider(userId, providerId);
  }

  @Get('provider/:userId')
  @ApiOperation({ summary: 'Listar prestadores favoritos', description: 'Retorna lista paginada de prestadores favoritos do usuário' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Prestadores favoritos' })
  listProviders(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.favoriteService.listProviders(userId, page, limit);
  }

  @Get('provider/:userId/check/:providerId')
  @ApiOperation({ summary: 'Verificar favorito', description: 'Verifica se um prestador está nos favoritos do usuário' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'providerId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Status do favorito' })
  checkProvider(
    @Param('userId') userId: string,
    @Param('providerId') providerId: string,
  ) {
    return this.favoriteService.checkProvider(userId, providerId);
  }

  // Service favorites
  @Post('service/:userId/:serviceId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Favoritar serviço' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'serviceId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Serviço favoritado' })
  addService(
    @Param('userId') userId: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.favoriteService.addService(userId, serviceId);
  }

  @Delete('service/:userId/:serviceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desfavoritar serviço' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'serviceId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Serviço removido dos favoritos' })
  removeService(
    @Param('userId') userId: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.favoriteService.removeService(userId, serviceId);
  }

  @Get('service/:userId')
  @ApiOperation({ summary: 'Listar serviços favoritos' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Serviços favoritos' })
  listServices(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.favoriteService.listServices(userId, page, limit);
  }

  @Get('service/:userId/check/:serviceId')
  @ApiOperation({ summary: 'Verificar serviço favorito' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'serviceId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Status do favorito' })
  checkService(
    @Param('userId') userId: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.favoriteService.checkService(userId, serviceId);
  }

  // Category favorites
  @Post('category/:userId/:categoryId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Favoritar categoria' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'categoryId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Categoria favoritada' })
  @ApiResponse({ status: 409, description: 'Já está nos favoritos' })
  addCategory(
    @Param('userId') userId: string,
    @Param('categoryId') categoryId: string,
  ) {
    return this.favoriteService.addCategory(userId, categoryId);
  }

  @Delete('category/:userId/:categoryId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desfavoritar categoria' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'categoryId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Categoria removida dos favoritos' })
  removeCategory(
    @Param('userId') userId: string,
    @Param('categoryId') categoryId: string,
  ) {
    return this.favoriteService.removeCategory(userId, categoryId);
  }

  @Get('category/:userId')
  @ApiOperation({ summary: 'Listar categorias favoritas' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Categorias favoritas' })
  listCategories(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.favoriteService.listCategories(userId, page, limit);
  }

  @Get('category/:userId/check/:categoryId')
  @ApiOperation({ summary: 'Verificar categoria favorita' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'categoryId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Status do favorito' })
  checkCategory(
    @Param('userId') userId: string,
    @Param('categoryId') categoryId: string,
  ) {
    return this.favoriteService.checkCategory(userId, categoryId);
  }
}
