// src/import/import.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import * as bcrypt from 'bcrypt';

// Types for CSV data
interface CityRow {
  'Nome da Cidade': string;
  'Estado': string;
  'Ativa?': string;
  'Prestadores': string;
}

interface ServiceRow {
  'Nome do Serviço': string;
  'Notes': string;
  'Categorias': string;
  'Ativo?': string;
  'Mais procurado?': string;
  'Destaque': string;
  'Contador': string;
  'Prestadores': string;
  'Validade plano': string;
}

interface CategoryRow {
  'Nome da Categoria': string;
  'Descrição': string;
  'Serviços': string;
  'Prestadores': string;
  'Destaque': string;
  'Contador': string;
  'Ativo?': string;
}

interface ProviderRow {
  'Nome': string;
  'Whatsapp': string;
  'Whatsapp_clean': string;
  'Whatsapp_link': string;
  'Instagram': string;
  'Instagram_link': string;
  'Serviços': string;
  'Localização': string;
  'Status da solicitação': string;
  'Data': string;
  'Origem': string;
  'Select': string;
  'Categoria Principal': string;
  'Serviços (Cópia)': string;
  'Destaque categoria?': string;
  'Destaque Serviço?': string;
  'Quero ser destaque na categoria': string;
  'Avaliação': string;
  'Comentários': string;
  'Galeria': string;
  'Serviços Prestados': string;
  'Logo': string;
  'Avaliações': string;
  'Média Avaliações': string;
  'Total avaliações': string;
  'Prestador Destaque': string;
  'Cidades': string;
  'Planos': string;
  'Destaque Categoria': string;
  'Destaque Home': string;
  'Anunciante': string;
  'Validade Plano': string;
  'Status Financeiro': string;
  'Headline (Serviços Prestados copy)': string;
}

interface EventRow {
  'Nome do Evento': string;
  'Informações do evento': string;
  'Data': string;
  'Whatsapp_clean': string;
  'Calculation': string;
  'Instagram': string;
  'Instagram link': string;
  'Link Externo': string;
  'Ativo': string;
  'Evento Patrocinado': string;
  'Plano Evento': string;
  'Ícone': string;
}

interface SolicitationRow {
  'Nome': string;
  'Whatsapp': string;
  'Instagram': string;
  'Serviços': string;
  'Localização': string;
  'Status da solicitação': string;
  'Prestador Criado': string;
  'Data': string;
  'Categorias': string;
}

interface Category {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
}

interface City {
  id: string;
  name: string;
}

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);
  private readonly csvFilesPath: string;
  private readonly prisma: PrismaClient;

  constructor() {
    this.csvFilesPath = path.join(process.cwd(), 'csv-data');
    this.prisma = new PrismaClient();
  }

  private cleanString(str: string | undefined | null): string | null {
    if (!str || str.trim() === '' || str === 'null' || str === 'undefined') {
      return null;
    }
    return str.trim().replace(/^["']|["']$/g, '');
  }

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private parseDate(dateStr: string): Date | null {
    if (!dateStr || dateStr.trim() === '') return null;
    
    let parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
    
    parts = dateStr.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0]) - 1;
      const day = parseInt(parts[1]);
      const year = parseInt(parts[2]);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
    
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    return null;
  }

  private async readCSV<T>(filename: string): Promise<T[]> {
    const filePath = path.join(this.csvFilesPath, filename);
    
    if (!fs.existsSync(filePath)) {
      this.logger.warn(`File not found: ${filePath}`);
      return [];
    }

    return new Promise((resolve, reject) => {
      const results: T[] = [];
      fs.createReadStream(filePath)
        .pipe(csv({ separator: ',', mapHeaders: ({ header }) => header?.replace(/^\uFEFF/, '') || '' }))
        .on('data', (data) => results.push(data))
        .on('end', () => {
          this.logger.log(`Read ${results.length} records from ${filename}`);
          resolve(results);
        })
        .on('error', reject);
    });
  }

  async importAll() {
    this.logger.log('Starting complete data import...');
    
    try {
      await this.importCities();
      await this.importCategories();
      await this.importServices();
      await this.importProviders();
      await this.importEvents();
      await this.importSolicitations();
      
      this.logger.log('All data imported successfully!');
    } catch (error) {
      this.logger.error('Error during import:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async importCities() {
    this.logger.log('Importing cities...');
    const cities = await this.readCSV<CityRow>('Cidades-Grid view.csv');
    
    let imported = 0;
    let skipped = 0;

    for (const row of cities) {
      const cityName = this.cleanString(row['Nome da Cidade']);
      if (!cityName) {
        skipped++;
        continue;
      }

      const state = this.cleanString(row['Estado']);
      if (!state) {
        skipped++;
        continue;
      }

      try {
        await this.prisma.city.upsert({
          where: { slug: this.generateSlug(cityName) },
          update: {
            isActive: row['Ativa?'] === 'checked',
          },
          create: {
            name: cityName,
            slug: this.generateSlug(cityName),
            state: state as any,
            isActive: row['Ativa?'] === 'checked',
          },
        });
        imported++;
      } catch (error) {
        this.logger.error(`Error importing city ${cityName}:`, error);
      }
    }
    
    this.logger.log(`Cities imported: ${imported}, skipped: ${skipped}`);
  }

  async importCategories() {
    this.logger.log('Importing categories...');
    const categories = await this.readCSV<CategoryRow>('Categorias-Grid view.csv');
    
    let imported = 0;
    let skipped = 0;

    for (const row of categories) {
      const categoryName = this.cleanString(row['Nome da Categoria']);
      if (!categoryName) {
        skipped++;
        continue;
      }

      try {
        await this.prisma.category.upsert({
          where: { slug: this.generateSlug(categoryName) },
          update: {
            description: this.cleanString(row['Descrição']),
            isActive: row['Ativo?'] === 'checked' || row['Ativo?'] === 'true',
            isFeatured: row['Destaque'] === 'checked' || row['Destaque'] === 'true',
          },
          create: {
            name: categoryName,
            slug: this.generateSlug(categoryName),
            description: this.cleanString(row['Descrição']),
            isActive: row['Ativo?'] === 'checked' || row['Ativo?'] === 'true',
            isFeatured: row['Destaque'] === 'checked' || row['Destaque'] === 'true',
          },
        });
        imported++;
      } catch (error) {
        this.logger.error(`Error importing category ${categoryName}:`, error);
      }
    }
    
    this.logger.log(`Categories imported: ${imported}, skipped: ${skipped}`);
  }

  async importServices() {
    this.logger.log('Importing services...');
    const services = await this.readCSV<ServiceRow>('Serviços-Grid view.csv');
    
    const categoriesDB = await this.prisma.category.findMany();
    const categoryMap = new Map<string, Category>();
    categoriesDB.forEach(category => {
      categoryMap.set(category.name, { id: category.id, name: category.name });
    });
    
    let imported = 0;
    let skipped = 0;

    for (const row of services) {
      const serviceName = this.cleanString(row['Nome do Serviço']);
      if (!serviceName) {
        skipped++;
        continue;
      }

      try {
        const service = await this.prisma.service.upsert({
          where: { slug: this.generateSlug(serviceName) },
          update: {
            description: this.cleanString(row['Notes']),
            isActive: row['Ativo?'] === 'checked',
            isFeatured: row['Destaque'] === 'checked',
            isMostWanted: row['Mais procurado?'] === 'checked',
          },
          create: {
            name: serviceName,
            slug: this.generateSlug(serviceName),
            description: this.cleanString(row['Notes']),
            isActive: row['Ativo?'] === 'checked',
            isFeatured: row['Destaque'] === 'checked',
            isMostWanted: row['Mais procurado?'] === 'checked',
            keywords: [],
          },
        });

        const categoryNames = row['Categorias']
          ? row['Categorias']
              .replace(/["\n\r]/g, '')
              .split(',')
              .map(c => c.trim())
              .filter(c => c)
          : [];

        for (const categoryName of categoryNames) {
          const category = categoryMap.get(categoryName);
          if (category) {
            await this.prisma.serviceCategory.upsert({
              where: {
                serviceId_categoryId: {
                  serviceId: service.id,
                  categoryId: category.id,
                },
              },
              update: {},
              create: {
                serviceId: service.id,
                categoryId: category.id,
              },
            });
          } else {
            this.logger.warn(`Category not found for service ${serviceName}: ${categoryName}`);
          }
        }
        
        imported++;
      } catch (error) {
        this.logger.error(`Error importing service ${serviceName}:`, error);
      }
    }
    
    this.logger.log(`Services imported: ${imported}, skipped: ${skipped}`);
  }

  async importProviders() {
    this.logger.log('Importing providers...');
    const providers = await this.readCSV<ProviderRow>('Prestadores-Solicitações.csv');
    
    const servicesDB = await this.prisma.service.findMany();
    const citiesDB = await this.prisma.city.findMany();
    
    const serviceMap = new Map<string, Service>();
    servicesDB.forEach(service => {
      serviceMap.set(service.name, { id: service.id, name: service.name });
    });
    
    const cityMap = new Map<string, City>();
    citiesDB.forEach(city => {
      cityMap.set(city.name, { id: city.id, name: city.name });
    });
    
    let imported = 0;
    let skipped = 0;

    for (const row of providers) {
      const providerName = this.cleanString(row['Nome']);
      if (!providerName) {
        skipped++;
        continue;
      }

      const whatsapp = this.cleanString(row['Whatsapp_clean'] || row['Whatsapp']);
      const instagram = this.cleanString(row['Instagram']);
      const cityName = this.cleanString(row['Cidades'] || 'Jataí');
      const city = cityMap.get(cityName || 'Jataí');
      
      // Parse rating
      let rating = 0;
      const ratingStr = this.cleanString(row['Avaliação']);
      if (ratingStr) {
        rating = parseInt(ratingStr) || 0;
      }

      try {
        // Primeiro, criar o usuário
        const user = await this.prisma.user.upsert({
          where: { email: `${this.generateSlug(providerName)}@temp.com` },
          update: {},
          create: {
            email: `${this.generateSlug(providerName)}@temp.com`,
            name: providerName,
            slug: this.generateSlug(providerName),
            password: await bcrypt.hash('temp123456', 10),
            phone: whatsapp,
            role: 'PROVIDER',
            cityId: city?.id,
            isEmailVerified: true,
          },
        });

        // Depois, criar o perfil do prestador
        const provider = await this.prisma.provider.upsert({
          where: { userId: user.id },
          update: {
            description: this.cleanString(row['Headline (Serviços Prestados copy)']),
            whatsappBusiness: whatsapp,
            instagram: instagram,
            isActive: row['Select'] === 'Ativo',
            status: row['Status da solicitação'] === 'Aprovado' ? 'APPROVED' : 'PENDING',
            isVerified: row['Select'] === 'Ativo',
            averageRating: rating,
          },
          create: {
            userId: user.id,
            description: this.cleanString(row['Headline (Serviços Prestados copy)']),
            whatsappBusiness: whatsapp,
            instagram: instagram,
            isActive: row['Select'] === 'Ativo',
            status: row['Status da solicitação'] === 'Aprovado' ? 'APPROVED' : 'PENDING',
            isVerified: row['Select'] === 'Ativo',
            averageRating: rating,
            plan: 'FREE',
          },
        });

        // Conectar serviços
        const serviceNames = row['Serviços']
          ? row['Serviços']
              .replace(/["\n\r]/g, '')
              .split(',')
              .map(s => s.trim())
              .filter(s => s)
          : [];

        for (const serviceName of serviceNames) {
          const service = serviceMap.get(serviceName);
          if (service) {
            await this.prisma.providerService.upsert({
              where: {
                providerId_serviceId: {
                  providerId: provider.id,
                  serviceId: service.id,
                },
              },
              update: {},
              create: {
                providerId: provider.id,
                serviceId: service.id,
              },
            });
          } else {
            this.logger.warn(`Service not found for provider ${providerName}: ${serviceName}`);
          }
        }

        imported++;
      } catch (error) {
        this.logger.error(`Error importing provider ${providerName}:`, error);
      }
    }
    
    this.logger.log(`Providers imported: ${imported}, skipped: ${skipped}`);
  }

  async importEvents() {
    this.logger.log('Importing events...');
    const events = await this.readCSV<EventRow>('Eventos-Grid view.csv');
    
    const citiesDB = await this.prisma.city.findMany();
    const cityMap = new Map<string, City>();
    citiesDB.forEach(city => {
      cityMap.set(city.name, { id: city.id, name: city.name });
    });
    
    let imported = 0;
    let skipped = 0;

    for (const row of events) {
      const eventName = this.cleanString(row['Nome do Evento']);
      if (!eventName) {
        skipped++;
        continue;
      }

      let eventDate = this.parseDate(row['Data']);
      if (!eventDate) {
        this.logger.warn(`No date for event ${eventName}, using current date`);
        eventDate = new Date();
      }

      let city: City | null = null;
      for (const c of citiesDB) {
        if (eventName.toLowerCase().includes(c.name.toLowerCase())) {
          city = { id: c.id, name: c.name };
          break;
        }
      }

      try {
        await this.prisma.event.create({
          data: {
            name: eventName,
            slug: this.generateSlug(`${eventName}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`),
            description: this.cleanString(row['Informações do evento']),
            eventDate: eventDate,
            whatsapp: this.cleanString(row['Whatsapp_clean']),
            instagram: this.cleanString(row['Instagram']),
            externalLink: this.cleanString(row['Link Externo']),
            isActive: row['Ativo'] === 'checked',
            isSponsored: row['Evento Patrocinado'] === 'checked',
            cityId: city?.id,
          },
        });
        imported++;
      } catch (error) {
        this.logger.error(`Error importing event ${eventName}:`, error);
      }
    }
    
    this.logger.log(`Events imported: ${imported}, skipped: ${skipped}`);
  }

  async importSolicitations() {
    this.logger.log('Importing solicitations...');
    const solicitations = await this.readCSV<SolicitationRow>('Solicitações-Solicitações.csv');
    
    let imported = 0;
    let skipped = 0;

    for (const row of solicitations) {
      const name = this.cleanString(row['Nome']);
      if (!name) {
        skipped++;
        continue;
      }

      const createdAt = this.parseDate(row['Data']);
      
      try {
        await this.prisma.providerRequest.create({
          data: {
            name: name,
            whatsapp: this.cleanString(row['Whatsapp']),
            instagram: this.cleanString(row['Instagram']),
            location: this.cleanString(row['Localização']),
            status: row['Status da solicitação'] === 'Aprovado' ? 'APPROVED' : 'PENDING',
            origin: 'CSV Import',
            createdAt: createdAt || new Date(),
          },
        });
        imported++;
      } catch (error) {
        this.logger.error(`Error importing solicitation ${name}:`, error);
      }
    }
    
    this.logger.log(`Solicitations imported: ${imported}, skipped: ${skipped}`);
  }

  async clearAllData() {
    this.logger.warn('Clearing all data...');
    
    await this.prisma.$transaction([
      this.prisma.providerService.deleteMany(),
      this.prisma.serviceCategory.deleteMany(),
      this.prisma.favoriteProvider.deleteMany(),
      this.prisma.favoriteService.deleteMany(),
      this.prisma.savedEvent.deleteMany(),
      this.prisma.notification.deleteMany(),
      this.prisma.providerGallery.deleteMany(),
      this.prisma.review.deleteMany(),
      this.prisma.ad.deleteMany(),
      this.prisma.event.deleteMany(),
      this.prisma.providerRequestService.deleteMany(),
      this.prisma.providerRequestCategory.deleteMany(),
      this.prisma.providerRequest.deleteMany(),
      this.prisma.provider.deleteMany(),
      this.prisma.user.deleteMany(),
      this.prisma.service.deleteMany(),
      this.prisma.category.deleteMany(),
      this.prisma.city.deleteMany(),
    ]);
    
    this.logger.log('All data cleared successfully');
  }
}