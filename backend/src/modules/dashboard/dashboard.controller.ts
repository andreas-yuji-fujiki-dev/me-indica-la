import {Controller,
  Get,
  Query,
  ParseIntPipe,
  DefaultValuePipe} from '@nestjs/common';
import {ApiTags, ApiOperation, ApiResponse, ApiQuery} from '@nestjs/swagger';
import {DashboardService} from './dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas gerais', description: 'Retorna contagens de usuários, prestadores, serviços, categorias, avaliações, eventos e anúncios' })
  @ApiResponse({ status: 200, description: 'Estatísticas do sistema' })
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Estatísticas mensais', description: 'Retorna novos cadastros por mês no ano' })
  @ApiQuery({ name: 'year', required: false, example: 2026, description: 'Ano para filtro (padrão: ano atual)' })
  @ApiResponse({ status: 200, description: 'Dados mensais' })
  getMonthlyStats(
    @Query('year', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe) year: number,
  ) {
    return this.dashboardService.getMonthlyStats(year);
  }

  @Get('top-providers')
  @ApiOperation({ summary: 'Top prestadores', description: 'Prestadores mais visualizados e com melhor avaliação' })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Top prestadores' })
  getTopProviders(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.dashboardService.getTopProviders(limit);
  }

  @Get('most-clicked')
  @ApiOperation({ summary: 'Mais clicados', description: 'Prestadores com mais cliques no WhatsApp' })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Prestadores mais clicados' })
  getMostClickedProviders(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.dashboardService.getMostClickedProviders(limit);
  }

  @Get('plan-distribution')
  @ApiOperation({ summary: 'Distribuição de planos', description: 'Quantidade de prestadores por plano de assinatura' })
  @ApiResponse({ status: 200, description: 'Distribuição de planos' })
  getPlanDistribution() {
    return this.dashboardService.getPlanDistribution();
  }

  @Get('city-stats')
  @ApiOperation({ summary: 'Estatísticas por cidade', description: 'Quantidade de prestadores e eventos por cidade' })
  @ApiResponse({ status: 200, description: 'Dados por cidade' })
  getCityStats() {
    return this.dashboardService.getCityStats();
  }

  @Get('category-stats')
  @ApiOperation({ summary: 'Estatísticas por categoria', description: 'Quantidade de serviços por categoria' })
  @ApiResponse({ status: 200, description: 'Dados por categoria' })
  getCategoryStats() {
    return this.dashboardService.getCategoryStats();
  }
}