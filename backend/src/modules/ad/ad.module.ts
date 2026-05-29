import { Module } from '@nestjs/common';
import { AdService } from './ad.service';
import { AdController } from './ad.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [AdController],
  providers: [AdService, PrismaService],
  exports: [AdService],
})
export class AdModule {}