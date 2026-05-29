import { Module } from '@nestjs/common';
import { ProviderRequestService } from './provider-request.service';
import { ProviderRequestController } from './provider-request.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ProviderRequestController],
  providers: [ProviderRequestService, PrismaService],
  exports: [ProviderRequestService],
})
export class ProviderRequestModule {}