// src/import/import.module.ts
import { Module } from '@nestjs/common';
import { ImportService } from './import.service';
import { ImportCommand } from './import.command';

@Module({
  providers: [ImportService, ImportCommand],
  exports: [ImportService],
})
export class ImportModule {}