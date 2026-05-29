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
import {ReviewService} from './review.service';
import {CreateReviewDto} from './dto/create-review.dto';
import {UpdateReviewDto} from './dto/update-review.dto';
import {ReviewResponseDto} from './dto/review-response.dto';

@ApiTags('Reviews')
@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar avaliação', description: 'Cria uma avaliação para um prestador. Pode ser anônima (sem userId) ou vinculada a um usuário.' })
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({ status: 201, description: 'Avaliação criada', type: ReviewResponseDto })
  @ApiResponse({ status: 400, description: 'Usuário já avaliou este prestador' })
  create(@Body(ValidationPipe) createReviewDto: CreateReviewDto) {
    return this.reviewService.create(createReviewDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar avaliações', description: 'Retorna lista paginada de avaliações com filtros' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'providerId', required: false, description: 'Filtrar por prestador (UUID)' })
  @ApiQuery({ name: 'isApproved', required: false, example: 'true', description: 'Filtrar por aprovação' })
  @ApiQuery({ name: 'minRating', required: false, example: '3', description: 'Nota mínima (1-5)' })
  @ApiQuery({ name: 'maxRating', required: false, example: '5', description: 'Nota máxima (1-5)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de avaliações' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('providerId') providerId?: string,
    @Query('isApproved') isApproved?: string,
    @Query('minRating') minRating?: string,
    @Query('maxRating') maxRating?: string,
  ) {
    const filters = {
      isApproved: isApproved === 'true' ? true : isApproved === 'false' ? false : undefined,
      minRating: minRating ? parseInt(minRating) : undefined,
      maxRating: maxRating ? parseInt(maxRating) : undefined,
    };
    return this.reviewService.findAll(providerId, page, limit, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter avaliação por ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Detalhes da avaliação' })
  findOne(@Param('id') id: string) {
    return this.reviewService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar avaliação', description: 'Atualiza o conteúdo da avaliação. Se a nota mudar, recalcula a média do prestador.' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ type: UpdateReviewDto })
  @ApiResponse({ status: 200, description: 'Avaliação atualizada' })
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateReviewDto: UpdateReviewDto,
  ) {
    return this.reviewService.update(id, updateReviewDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover avaliação', description: 'Remove a avaliação e recalcula a média do prestador' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Avaliação removida' })
  remove(@Param('id') id: string) {
    return this.reviewService.remove(id);
  }

  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprovar avaliação', description: 'Aprova uma avaliação para exibição pública e recalcula a média' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Avaliação aprovada' })
  approveReview(@Param('id') id: string) {
    return this.reviewService.approveReview(id);
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rejeitar avaliação', description: 'Rejeita e remove a avaliação' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Avaliação rejeitada e removida' })
  rejectReview(@Param('id') id: string) {
    return this.reviewService.rejectReview(id);
  }
}