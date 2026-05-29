import { PrismaClient, PlanType, ProviderStatus, UserRole, State } from '@prisma/client';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

function loadDotEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    const value = rest.join('=');
    if (key && value !== undefined && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function generateSlug(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function randomFrom<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function pickMany<T>(list: T[], count: number): T[] {
  const copy = [...list];
  const selected: T[] = [];
  while (selected.length < count && copy.length > 0) {
    const index = Math.floor(Math.random() * copy.length);
    selected.push(copy.splice(index, 1)[0]);
  }
  return selected;
}

async function main() {
  loadDotEnv();

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not defined in environment or .env file.');
  }

  const prisma = new PrismaClient();

  // Dados para popular o banco
  const cities = [
    { name: 'São Paulo', state: 'SP' },
    { name: 'Rio de Janeiro', state: 'RJ' },
    { name: 'Belo Horizonte', state: 'MG' },
    { name: 'Brasília', state: 'DF' },
    { name: 'Salvador', state: 'BA' },
    { name: 'Fortaleza', state: 'CE' },
    { name: 'Curitiba', state: 'PR' },
    { name: 'Porto Alegre', state: 'RS' },
    { name: 'Manaus', state: 'AM' },
    { name: 'Recife', state: 'PE' },
    { name: 'Goiânia', state: 'GO' },
    { name: 'Belém', state: 'PA' },
    { name: 'Florianópolis', state: 'SC' },
    { name: 'Natal', state: 'RN' },
    { name: 'Campinas', state: 'SP' },
    { name: 'Santos', state: 'SP' },
    { name: 'São José dos Campos', state: 'SP' },
    { name: 'Ribeirão Preto', state: 'SP' },
    { name: 'Sorocaba', state: 'SP' },
  ];

  const categories = [
    { name: 'Beleza e Estética', description: 'Serviços de cuidados pessoais e beleza.' },
    { name: 'Saúde', description: 'Serviços de saúde e bem-estar.' },
    { name: 'Casa e Jardim', description: 'Reparos, limpeza e jardinagem doméstica.' },
    { name: 'Automotivo', description: 'Serviços para veículos e transporte.' },
    { name: 'Tecnologia', description: 'Suporte e desenvolvimento tecnológico.' },
    { name: 'Educação', description: 'Aulas particulares e cursos de qualificação.' },
    { name: 'Eventos', description: 'Serviços de organização e entretenimento.' },
    { name: 'Pets', description: 'Cuidados e serviços para animais de estimação.' },
    { name: 'Turismo', description: 'Passeios, guias e viagens.' },
    { name: 'Gastronomia', description: 'Comidas, buffets e serviços culinários.' },
    { name: 'Moda', description: 'Serviços de vestuário e estilo.' },
    { name: 'Serviços Administrativos', description: 'Apoio e consultoria empresarial.' },
    { name: 'Construção', description: 'Serviços de construção e reforma.' },
    { name: 'Esportes', description: 'Aulas e serviços relacionados a esportes.' },
    { name: 'Artes e Cultura', description: 'Serviços culturais e artísticos.' },
  ];

  const services = [
    { name: 'Manicure e Pedicure', categories: ['Beleza e Estética'] },
    { name: 'Corte de Cabelo', categories: ['Beleza e Estética'] },
    { name: 'Maquiagem Profissional', categories: ['Beleza e Estética', 'Eventos'] },
    { name: 'Depilação', categories: ['Beleza e Estética'] },
    { name: 'Barbearia', categories: ['Beleza e Estética'] },
    { name: 'Pedreiro', categories: ['Casa e Jardim', 'Construção'] },
    { name: 'Eletricista', categories: ['Casa e Jardim', 'Construção'] },
    { name: 'Encanador', categories: ['Casa e Jardim', 'Construção'] },
    { name: 'Jardinagem', categories: ['Casa e Jardim'] },
    { name: 'Limpeza Residencial', categories: ['Casa e Jardim'] },
    { name: 'Mecânica Automotiva', categories: ['Automotivo'] },
    { name: 'Funilaria e Pintura', categories: ['Automotivo'] },
    { name: 'Lavagem a Seco', categories: ['Automotivo'] },
    { name: 'Chaveiro', categories: ['Automotivo'] },
    { name: 'Eletrônico Automotivo', categories: ['Automotivo', 'Tecnologia'] },
    { name: 'Suporte de Informática', categories: ['Tecnologia'] },
    { name: 'Desenvolvimento Web', categories: ['Tecnologia'] },
    { name: 'Manutenção de Computadores', categories: ['Tecnologia'] },
    { name: 'Instalação de Câmeras', categories: ['Tecnologia'] },
    { name: 'Aulas de Inglês', categories: ['Educação'] },
    { name: 'Aulas de Matemática', categories: ['Educação'] },
    { name: 'Reforço Escolar', categories: ['Educação'] },
    { name: 'Treinamento Corporativo', categories: ['Educação', 'Serviços Administrativos'] },
    { name: 'Organização de Eventos', categories: ['Eventos'] },
    { name: 'Buffet para Festas', categories: ['Gastronomia', 'Eventos'] },
    { name: 'Fotografia de Eventos', categories: ['Eventos'] },
    { name: 'Decoração de Festas', categories: ['Eventos'] },
    { name: 'Banho e Tosa', categories: ['Pets'] },
    { name: 'Adestramento', categories: ['Pets', 'Educação'] },
    { name: 'Hospedagem para Pets', categories: ['Pets'] },
    { name: 'Passeador de Cães', categories: ['Pets'] },
    { name: 'Guia Turístico', categories: ['Turismo'] },
    { name: 'Agência de Viagens', categories: ['Turismo'] },
    { name: 'Chef em Casa', categories: ['Gastronomia'] },
    { name: 'Serviço de Delivery', categories: ['Gastronomia'] },
    { name: 'Consultoria Financeira', categories: ['Serviços Administrativos'] },
    { name: 'Assessoria Tributária', categories: ['Serviços Administrativos'] },
    { name: 'Personal Trainer', categories: ['Esportes'] },
    { name: 'Aulas de Dança', categories: ['Artes e Cultura', 'Esportes'] },
    { name: 'Aulas de Música', categories: ['Artes e Cultura'] },
    { name: 'Pintura Residencial', categories: ['Construção'] },
    { name: 'Gesseiro', categories: ['Construção'] },
    { name: 'Carpintaria', categories: ['Construção'] },
  ];

  const providers = [
    {
      name: 'Estética Bela Vida',
      whatsapp: '+5511999990001',
      instagram: 'belavida.estetica',
      headline: 'Beleza completa para clientes exigentes.',
      status: ProviderStatus.APPROVED,
      isActive: true,
      services: ['Manicure e Pedicure', 'Corte de Cabelo', 'Maquiagem Profissional'],
    },
    {
      name: 'Casa Certa Serviços',
      whatsapp: '+5511999990002',
      instagram: 'casacerta.servicos',
      headline: 'Soluções rápidas de reparos residenciais.',
      status: ProviderStatus.APPROVED,
      isActive: true,
      services: ['Pedreiro', 'Encanador', 'Eletricista'],
    },
    {
      name: 'Auto Prime Mecânica',
      whatsapp: '+5511999990003',
      instagram: 'autoprime.mecanica',
      headline: 'Manutenção automotiva com garantia de qualidade.',
      status: ProviderStatus.APPROVED,
      isActive: true,
      services: ['Mecânica Automotiva', 'Lavagem a Seco', 'Chaveiro'],
    },
    {
      name: 'TecnoFix Informática',
      whatsapp: '+5511999990004',
      instagram: 'tecnofix.info',
      headline: 'Suporte e conserto de computadores e redes.',
      status: ProviderStatus.APPROVED,
      isActive: true,
      services: ['Suporte de Informática', 'Manutenção de Computadores', 'Instalação de Câmeras'],
    },
    {
      name: 'Aulas Pro',
      whatsapp: '+5511999990005',
      instagram: 'aulaspro.educacao',
      headline: 'Aulas particulares e reforço escolar com professores experientes.',
      status: ProviderStatus.APPROVED,
      isActive: true,
      services: ['Aulas de Inglês', 'Aulas de Matemática', 'Reforço Escolar'],
    },
    {
      name: 'Eventos Máxima',
      whatsapp: '+5511999990006',
      instagram: 'eventosmaxima',
      headline: 'Planejamento e produção de eventos corporativos e sociais.',
      status: ProviderStatus.APPROVED,
      isActive: true,
      services: ['Organização de Eventos', 'Fotografia de Eventos', 'Decoração de Festas'],
    },
    {
      name: 'Pet Amigo',
      whatsapp: '+5511999990007',
      instagram: 'petamigo.cuidados',
      headline: 'Cuidados completos para seu melhor amigo.',
      status: ProviderStatus.APPROVED,
      isActive: true,
      services: ['Banho e Tosa', 'Passeador de Cães', 'Hospedagem para Pets'],
    },
    {
      name: 'Turismo Fácil',
      whatsapp: '+5511999990008',
      instagram: 'turismofacil',
      headline: 'Passeios personalizados e roteiros turísticos.',
      status: ProviderStatus.APPROVED,
      isActive: true,
      services: ['Guia Turístico', 'Agência de Viagens'],
    },
    {
      name: 'Chef em Casa',
      whatsapp: '+5511999990009',
      instagram: 'chefemcasa.gastronomia',
      headline: 'Experiência gastronômica exclusiva no conforto do lar.',
      status: ProviderStatus.APPROVED,
      isActive: true,
      services: ['Chef em Casa', 'Buffet para Festas', 'Serviço de Delivery'],
    },
    {
      name: 'Consultoria Ágil',
      whatsapp: '+5511999990010',
      instagram: 'consultoriaagil',
      headline: 'Assessoria empresarial e financeira para pequenas empresas.',
      status: ProviderStatus.APPROVED,
      isActive: true,
      services: ['Consultoria Financeira', 'Assessoria Tributária', 'Treinamento Corporativo'],
    },
    {
      name: 'Beleza Total',
      whatsapp: '+5511999990011',
      instagram: 'beleza.total',
      headline: 'Serviços completos de beleza e estética.',
      status: ProviderStatus.APPROVED,
      isActive: true,
      services: ['Manicure e Pedicure', 'Depilação', 'Barbearia'],
    },
    {
      name: 'Construção Rápida',
      whatsapp: '+5511999990012',
      instagram: 'construcao.rapida',
      headline: 'Serviços de construção e reforma com agilidade.',
      status: ProviderStatus.APPROVED,
      isActive: true,
      services: ['Pedreiro', 'Gesseiro', 'Pintura Residencial'],
    },
    {
      name: 'Auto Center',
      whatsapp: '+5511999990013',
      instagram: 'auto.center',
      headline: 'Serviços completos para seu veículo.',
      status: ProviderStatus.APPROVED,
      isActive: true,
      services: ['Mecânica Automotiva', 'Funilaria e Pintura', 'Eletrônico Automotivo'],
    },
    {
      name: 'Tecno Soluções',
      whatsapp: '+5511999990014',
      instagram: 'tecnosolucoes',
      headline: 'Soluções tecnológicas para sua empresa.',
      status: ProviderStatus.APPROVED,
      isActive: true,
      services: ['Suporte de Informática', 'Desenvolvimento Web', 'Instalação de Câmeras'],
    },
    {
      name: 'Educação Plus',
      whatsapp: '+5511999990015',
      instagram: 'educacao.plus',
      headline: 'Cursos e aulas para todas as idades.',
      status: ProviderStatus.APPROVED,
      isActive: true,
      services: ['Aulas de Inglês', 'Aulas de Matemática', 'Aulas de Música'],
    },
    {
      name: 'Eventos Top',
      whatsapp: '+5511999990016',
      instagram: 'eventos.top',
      headline: 'Organização de eventos inesquecíveis.',
      status: ProviderStatus.APPROVED,
      isActive: true,
      services: ['Organização de Eventos', 'Buffet para Festas', 'Fotografia de Eventos'],
    },
    {
      name: 'Pet Feliz',
      whatsapp: '+5511999990017',
      instagram: 'pet.feliz',
      headline: 'Cuidados e carinho para seu pet.',
      status: ProviderStatus.APPROVED,
      isActive: true,
      services: ['Banho e Tosa', 'Adestramento', 'Hospedagem para Pets'],
    },
    {
      name: 'Viagens Incríveis',
      whatsapp: '+5511999990018',
      instagram: 'viagens.incriveis',
      headline: 'Pacotes turísticos para todos os gostos.',
      status: ProviderStatus.APPROVED,
      isActive: true,
      services: ['Guia Turístico', 'Agência de Viagens'],
    },
    {
      name: 'Gastronomia Fina',
      whatsapp: '+5511999990019',
      instagram: 'gastronomia.fina',
      headline: 'Serviços gastronômicos de alta qualidade.',
      status: ProviderStatus.APPROVED,
      isActive: true,
      services: ['Chef em Casa', 'Buffet para Festas', 'Serviço de Delivery'],
    },
    {
      name: 'Consultoria Master',
      whatsapp: '+5511999990020',
      instagram: 'consultoria.master',
      headline: 'Consultoria empresarial de alto nível.',
      status: ProviderStatus.APPROVED,
      isActive: true,
      services: ['Consultoria Financeira', 'Assessoria Tributária', 'Treinamento Corporativo'],
    },
  ];

  const users = [
    {
      email: 'admin@meindica.la',
      name: 'Administrador Me Indica',
      slug: 'admin-me-indica',
      password: 'Admin123!',
    },
    {
      email: 'user1@meindica.la',
      name: 'Usuário Teste 1',
      slug: 'usuario-teste-1',
      password: 'User123!',
    },
    {
      email: 'user2@meindica.la',
      name: 'Usuário Teste 2',
      slug: 'usuario-teste-2',
      password: 'User123!',
    },
  ];

  const eventTemplates = [
    {
      name: 'Feira de Serviços Locais',
      description: 'Um encontro para promover profissionais e prestadores de serviços locais.',
      instagram: 'eventosocial',
      externalLink: 'https://example.com/feira-servicos',
      location: 'Centro de Convenções',
      coverImageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e',
      isSponsored: true,
    },
    {
      name: 'Workshop de Empreendedorismo',
      description: 'Aprenda a profissionalizar seu serviço e aumentar sua presença online.',
      instagram: 'workshoppro',
      externalLink: 'https://example.com/workshop',
      location: 'Auditório Empresarial',
      coverImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
      isSponsored: false,
    },
    {
      name: 'Festival Gastronômico',
      description: 'Prove pratos especiais preparados por chefs locais.',
      instagram: 'festivalgastronomico',
      externalLink: 'https://example.com/festival',
      location: 'Parque da Cidade',
      coverImageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
      isSponsored: true,
    },
    {
      name: 'Encontro de Tecnologia',
      description: 'Painéis e networking para entusiastas de TI e startups.',
      instagram: 'enccontrotech',
      externalLink: 'https://example.com/techevent',
      location: 'Campus Tech',
      coverImageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475',
      isSponsored: false,
    },
  ];

  console.log('Seed: criando cidades...');
  const cityRecords = [] as { id: string; name: string; state: State }[];
  for (const city of cities) {
    const record = await prisma.city.upsert({
      where: { slug: generateSlug(city.name) },
      update: { state: city.state as State, isActive: true },
      create: { name: city.name, slug: generateSlug(city.name), state: city.state as State, isActive: true },
    });
    cityRecords.push({ id: record.id, name: record.name, state: record.state });
  }

  console.log('Seed: criando categorias...');
  const categoryRecords = [] as { id: string; name: string }[];
  for (const category of categories) {
    const record = await prisma.category.upsert({
      where: { slug: generateSlug(category.name) },
      update: {
        description: category.description,
        isActive: true,
        isFeatured: false,
      },
      create: {
        name: category.name,
        slug: generateSlug(category.name),
        description: category.description,
        isActive: true,
        isFeatured: false,
      },
    });
    categoryRecords.push({ id: record.id, name: record.name });
  }

  console.log('Seed: criando serviços...');
  const serviceRecords = [] as { id: string; name: string }[];
  for (const service of services) {
    const record = await prisma.service.upsert({
      where: { slug: generateSlug(service.name) },
      update: {
        description: `${service.name} de qualidade com profissionais treinados.`,
        isActive: true,
        isFeatured: false,
        isMostWanted: false,
        keywords: service.categories.map((category) => generateSlug(category)),
      },
      create: {
        name: service.name,
        slug: generateSlug(service.name),
        description: `${service.name} de qualidade com profissionais treinados.`,
        keywords: service.categories.map((category) => generateSlug(category)),
        isActive: true,
        isFeatured: false,
        isMostWanted: false,
      },
    });
    serviceRecords.push({ id: record.id, name: record.name });
  }

  const serviceCategoryData = [] as { serviceId: string; categoryId: string }[];
  for (const service of services) {
    const serviceRecord = serviceRecords.find((item) => item.name === service.name);
    if (!serviceRecord) continue;
    for (const categoryName of service.categories) {
      const categoryRecord = categoryRecords.find((item) => item.name === categoryName);
      if (!categoryRecord) continue;
      serviceCategoryData.push({ serviceId: serviceRecord.id, categoryId: categoryRecord.id });
    }
  }

  if (serviceCategoryData.length > 0) {
    await prisma.serviceCategory.createMany({ data: serviceCategoryData, skipDuplicates: true });
  }

  console.log('Seed: criando usuários e prestadores...');
  const providerRecords = [] as { id: string; name: string }[];
  for (const provider of providers) {
    const email = `${generateSlug(provider.name)}@seed.local`;
    const passwordHash = await bcrypt.hash('Seed123!', 10);
    const city = randomFrom(cityRecords);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: provider.name,
        slug: generateSlug(provider.name),
        phone: provider.whatsapp,
        cityId: city.id,
        role: UserRole.PROVIDER,
        isEmailVerified: true,
        isActive: true,
      },
      create: {
        email,
        name: provider.name,
        slug: generateSlug(provider.name),
        password: passwordHash,
        phone: provider.whatsapp,
        role: UserRole.PROVIDER,
        cityId: city.id,
        isEmailVerified: true,
        isActive: true,
      },
    });

    const providerRecord = await prisma.provider.upsert({
      where: { userId: user.id },
      update: {
        description: provider.headline,
        whatsappBusiness: provider.whatsapp,
        instagram: provider.instagram,
        isActive: provider.isActive,
        status: provider.status,
        isVerified: provider.status === ProviderStatus.APPROVED,
        averageRating: 4.5,
        cityId: city.id,
      },
      create: {
        userId: user.id,
        description: provider.headline,
        whatsappBusiness: provider.whatsapp,
        instagram: provider.instagram,
        address: 'A confirmar',
        logoUrl: '',
        businessHours: {},
        isActive: provider.isActive,
        status: provider.status,
        isVerified: provider.status === ProviderStatus.APPROVED,
        averageRating: 4.5,
        plan: PlanType.FREE,
        cityId: city.id,
      },
    });

    providerRecords.push({ id: providerRecord.id, name: provider.name });

    const providerServiceData = provider.services
      .map((serviceName) => serviceRecords.find((item) => item.name === serviceName))
      .filter((item): item is { id: string; name: string } => Boolean(item))
      .map((service) => ({ providerId: providerRecord.id, serviceId: service.id }));

    if (providerServiceData.length > 0) {
      await prisma.providerService.createMany({ data: providerServiceData, skipDuplicates: true });
    }
  }

  console.log('Seed: criando avaliações...');
  const reviewAuthors = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Fernanda', 'Gabriel', 'Helena', 'Igor', 'Juliana'];
  const reviewsData = [] as Array<{ providerId: string; authorName: string; rating: number; comment: string; isApproved: boolean }>;
  for (const provider of providerRecords) {
    const reviewCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < reviewCount; i += 1) {
      const rating = 3 + Math.floor(Math.random() * 3);
      reviewsData.push({
        providerId: provider.id,
        authorName: randomFrom(reviewAuthors),
        rating,
        comment: `Excelente atendimento em ${provider.name}.`,
        isApproved: true,
      });
    }
  }
  if (reviewsData.length > 0) {
    for (const review of reviewsData) {
      await prisma.review.create({ data: review });
    }
  }

  console.log('Seed: criando anúncios...');
  const adsData = providerRecords.slice(0, 6).map((provider, index) => ({
    providerId: provider.id,
    title: `Anúncio destaque ${provider.name}`,
    imageUrl: `https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80&idx=${index}`,
    redirectUrl: 'https://example.com',
    position: index % 2 === 0 ? 'home' : 'category',
    isActive: true,
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  }));
  if (adsData.length > 0) {
    await prisma.ad.createMany({ data: adsData, skipDuplicates: true });
  }

  console.log('Seed: criando eventos...');
  for (const eventTemplate of eventTemplates) {
    const city = randomFrom(cityRecords);
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * 30) + 3);
    await prisma.event.upsert({
      where: { slug: generateSlug(eventTemplate.name) },
      update: {
        description: eventTemplate.description,
        eventDate: date,
        instagram: `https://instagram.com/${eventTemplate.instagram}`,
        externalLink: eventTemplate.externalLink,
        location: eventTemplate.location,
        coverImageUrl: eventTemplate.coverImageUrl,
        cityId: city.id,
        isActive: true,
        isSponsored: eventTemplate.isSponsored,
      },
      create: {
        name: eventTemplate.name,
        slug: generateSlug(eventTemplate.name),
        description: eventTemplate.description,
        eventDate: date,
        instagram: `https://instagram.com/${eventTemplate.instagram}`,
        externalLink: eventTemplate.externalLink,
        location: eventTemplate.location,
        coverImageUrl: eventTemplate.coverImageUrl,
        cityId: city.id,
        isActive: true,
        isSponsored: eventTemplate.isSponsored,
      },
    });
  }

  console.log('Seed: criando usuários comuns...');
  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        slug: user.slug,
        role: UserRole.ADMIN,
        isEmailVerified: true,
        isActive: true,
      },
      create: {
        email: user.email,
        name: user.name,
        slug: user.slug,
        password: passwordHash,
        role: UserRole.ADMIN,
        isEmailVerified: true,
        isActive: true,
      },
    });
  }

  console.log('Seed finalizado com sucesso!');
  console.log('Usuário admin:', users[0].email, 'senha: Admin123!');
}

main()
  .catch((err) => {
    console.error('Erro ao rodar seed:', err);
    process.exit(1);
  })
  .finally(() => {
    // nothing here; Prisma disconnect in main if needed
  });

