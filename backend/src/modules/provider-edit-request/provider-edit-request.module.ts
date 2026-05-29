import { Module } from '@nestjs/common';
import { ProviderEditRequestController } from './provider-edit-request.controller';
import { ProviderEditRequestService } from './provider-edit-request.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProviderEditRequestController],
  providers: [ProviderEditRequestService],
  exports: [ProviderEditRequestService],
})
export class ProviderEditRequestModule {}
