import { Controller, Post, Get, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ProviderEditRequestService } from './provider-edit-request.service';
import { CreateProviderEditRequestDto } from './dto/create-provider-edit-request.dto';
import { Public } from '../auth/public.decorator';

@Controller('provider-edit-request')
export class ProviderEditRequestController {
  constructor(private readonly service: ProviderEditRequestService) {}

  @Post()
  create(@Body() dto: CreateProviderEditRequestDto) {
    return this.service.create(dto);
  }

  @Public()
  @Get('provider/:providerId/pending')
  findPending(@Param('providerId') providerId: string) {
    return this.service.findPendingByProvider(providerId);
  }

  @Get()
  findAll(@Query('status') status?: string) {
    return this.service.findAll(status);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.service.approve(id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.service.reject(id);
  }

  @Delete(':id')
  cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }
}
