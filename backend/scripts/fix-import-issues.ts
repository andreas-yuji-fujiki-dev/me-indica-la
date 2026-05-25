// scripts/fix-import-issues.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapeamento de nomes de categorias que estão diferentes
const categoryNameMapping: Record<string, string> = {
  'Clubes': 'Clubes, Esportes e Lazer',
  'Esportes e Lazer': 'Clubes, Esportes e Lazer',
  'Religião': 'Religião, Comunidade e Ações Sociais',
  'Comunidade e Ações Sociais': 'Religião, Comunidade e Ações Sociais',
  'Construção': 'Construção, Energia e Engenharia',
  'Energia e Engenharia': 'Construção, Energia e Engenharia',
  'Serviços Públicos': 'Serviços Públicos, Associações e Entidades',
  'Associações e Entidades': 'Serviços Públicos, Associações e Entidades',
  'Indústria': 'Indústria, Máquinas e Equipamentos',
  'Máquinas e Equipamentos': 'Indústria, Máquinas e Equipamentos',
  'Transporte': 'Transporte, Fretes e Logística',
  'Fretes e Logística': 'Transporte, Fretes e Logística',
  'Serviços Financeiros': 'Serviços Financeiros, Seguros',
  'Seguros': 'Serviços Financeiros, Seguros',
  'Desenvolvimento Pessoal e Profissional': 'Desenvolvimento Pessoal e Profissional',
};

// Mapeamento de nomes de serviços que estão diferentes
const serviceNameMapping: Record<string, string> = {
  'Adubos': 'Adubos, Insumos e Biológicos',
  'Insumos e Biológicos': 'Adubos, Insumos e Biológicos',
};

async function fixCategories() {
  console.log('Fixing category mappings...');
  
  for (const [oldName, newName] of Object.entries(categoryNameMapping)) {
    const category = await prisma.category.findFirst({
      where: { name: newName }
    });
    
    if (category) {
      console.log(`✓ Category mapping: "${oldName}" → "${newName}"`);
    } else {
      console.log(`✗ Category not found: "${newName}"`);
    }
  }
}

async function fixServices() {
  console.log('\nFixing service mappings...');
  
  for (const [oldName, newName] of Object.entries(serviceNameMapping)) {
    const service = await prisma.service.findFirst({
      where: { name: newName }
    });
    
    if (service) {
      console.log(`✓ Service mapping: "${oldName}" → "${newName}"`);
    } else {
      console.log(`✗ Service not found: "${newName}"`);
    }
  }
}

async function showStats() {
  console.log('\n📊 Database Statistics:');
  
  const cities = await prisma.city.count();
  const categories = await prisma.category.count();
  const services = await prisma.service.count();
  const providers = await prisma.provider.count();
  const events = await prisma.event.count();
  const solicitations = await prisma.providerRequest.count();
  
  console.log(`- Cities: ${cities}`);
  console.log(`- Categories: ${categories}`);
  console.log(`- Services: ${services}`);
  console.log(`- Providers: ${providers}`);
  console.log(`- Events: ${events}`);
  console.log(`- Solicitations: ${solicitations}`);
  
  // Show some samples
  console.log('\n📂 Sample Categories:');
  const sampleCategories = await prisma.category.findMany({ take: 5 });
  sampleCategories.forEach(c => console.log(`  - ${c.name}`));
  
  console.log('\n📂 Sample Services:');
  const sampleServices = await prisma.service.findMany({ take: 5 });
  sampleServices.forEach(s => console.log(`  - ${s.name}`));
}

async function main() {
  try {
    await fixCategories();
    await fixServices();
    await showStats();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();