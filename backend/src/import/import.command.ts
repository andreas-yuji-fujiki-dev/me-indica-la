import { Injectable, Logger } from '@nestjs/common';
import { ImportService } from './import.service';

@Injectable()
export class ImportCommand {
  private readonly logger = new Logger(ImportCommand.name);

  constructor(private readonly importService: ImportService) {}

  async run(args: string[]): Promise<void> {
    const command = args[0];

    switch (command) {
      case 'all':
        await this.importService.importAll();
        break;
      case 'cities':
        await this.importService.importCities();
        break;
      case 'categories':
        await this.importService.importCategories();
        break;
      case 'services':
        await this.importService.importServices();
        break;
      case 'providers':
        await this.importService.importProviders();
        break;
      case 'events':
        await this.importService.importEvents();
        break;
      case 'solicitations':
        await this.importService.importSolicitations();
        break;
      case 'clear':
        await this.importService.clearAllData();
        break;
      default:
        this.logger.error('Unknown command. Available: all, cities, categories, services, providers, events, solicitations, clear');
    }
  }
}