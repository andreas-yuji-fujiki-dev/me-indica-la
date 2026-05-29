import { NestFactory } from '@nestjs/core';
import { ImportModule } from './import.module';
import { ImportCommand } from './import.command';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(ImportModule);
  const importCommand = app.get(ImportCommand);
  
  const args = process.argv.slice(2);
  await importCommand.run(args);
  
  await app.close();
}

bootstrap();