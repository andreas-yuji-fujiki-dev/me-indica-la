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
import {ProviderRequestService} from './provider-request.service';
import {CreateProviderRequestDto} from './dto/create-provider-request.dto';
import {UpdateProviderRequestDto} from './dto/update-provider-request.dto';
import {ProviderRequestResponseDto} from './dto/provider-request-response.dto';

@ApiTags('Provider Requests')
@Controller('provider-request')
export class ProviderRequestController {
  constructor(private readonly providerRequestService: ProviderRequestService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Solicitar cadastro', description: 'Cria uma solicitação de cadastro de prestador (status PENDING). O cadastro só será publicado após aprovação manual.' })
  @ApiBody({ type: CreateProviderRequestDto })
  @ApiResponse({ status: 201, description: 'Solicitação criada como pendente', type: ProviderRequestResponseDto })
  create(@Body(ValidationPipe) createDto: CreateProviderRequestDto) {
    return this.providerRequestService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar solicitações', description: 'Retorna lista paginada de solicitações de cadastro (uso administrativo)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  @ApiQuery({ name: 'search', required: false, example: 'joão' })
  @ApiQuery({ name: 'origin', required: false, example: 'form', description: 'Filtrar por origem (ex: form, import)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de solicitações' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('origin') origin?: string,
  ) {
    const filters = { status, search, origin };
    return this.providerRequestService.findAll(page, limit, filters);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Solicitações pendentes', description: 'Retorna apenas solicitações com status PENDING' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Solicitações pendentes' })
  getPending(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.providerRequestService.getPending(page, limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas', description: 'Retorna contagem de solicitações por status (útil para dashboard)' })
  @ApiResponse({ status: 200, description: 'Estatísticas', schema: { properties: { pending: { type: 'integer' }, approved: { type: 'integer' }, rejected: { type: 'integer' }, total: { type: 'integer' } } } })
  getStats() {
    return this.providerRequestService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter solicitação por ID', description: 'Retorna detalhes de uma solicitação de cadastro' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Detalhes da solicitação' })
  findOne(@Param('id') id: string) {
    return this.providerRequestService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar solicitação', description: 'Atualiza dados de uma solicitação existente' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ type: UpdateProviderRequestDto })
  @ApiResponse({ status: 200, description: 'Solicitação atualizada' })
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateDto: UpdateProviderRequestDto,
  ) {
    return this.providerRequestService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover solicitação', description: 'Exclui permanentemente uma solicitação' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Solicitação removida' })
  remove(@Param('id') id: string) {
    return this.providerRequestService.remove(id);
  }

  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprovar solicitação', description: 'Aprova a solicitação de cadastro (status APPROVED)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Solicitação aprovada' })
  approve(@Param('id') id: string) {
    return this.providerRequestService.approve(id);
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rejeitar solicitação', description: 'Rejeita a solicitação de cadastro com motivo opcional' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ schema: { type: 'object', properties: { reason: { type: 'string', example: 'Dados insuficientes' } } } })
  @ApiResponse({ status: 200, description: 'Solicitação rejeitada' })
  reject(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.providerRequestService.reject(id, reason);
  }
}