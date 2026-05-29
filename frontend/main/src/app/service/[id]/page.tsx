import type { Metadata } from 'next';
import ServicePageClient from './ServicePageClient';

const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://meindicala.com.br';

type Props = { params: Promise<{ id: string }> };

async function fetchService(id: string) {
  try {
    const res = await fetch(`${API_URL}/service/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const service = await fetchService(id);
  if (!service) return {};

  const title = `${service.name} — Prestadores Especializados`;
  const description =
    service.description ||
    `Encontre prestadores especializados em ${service.name}. Compare avaliações e contrate profissionais qualificados na sua cidade.`;

  const keywords = [
    service.name,
    ...(service.keywords ?? []),
    'prestadores de serviço',
    ...(service.categories?.map((c: any) => c.category?.name).filter(Boolean) ?? []),
  ];

  return {
    title,
    description,
    keywords,
    alternates: { canonical: `/service/${id}` },
    openGraph: {
      title: `${service.name} | Me Indica Lá`,
      description,
      url: `/service/${id}`,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${service.name} | Me Indica Lá`,
      description,
    },
  };
}

export default async function ServicePage({ params }: Props) {
  const { id } = await params;
  const service = await fetchService(id);

  const serviceJsonLd = service
    ? {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: service.name,
        ...(service.description && { description: service.description }),
        url: `${SITE_URL}/service/${id}`,
        ...(service.keywords?.length && { keywords: service.keywords.join(', ') }),
        provider: {
          '@type': 'Organization',
          name: 'Me Indica Lá',
          url: SITE_URL,
        },
        areaServed: { '@type': 'Country', name: 'Brasil' },
      }
    : null;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Buscar', item: `${SITE_URL}/search` },
      ...(service
        ? [{ '@type': 'ListItem', position: 3, name: service.name, item: `${SITE_URL}/service/${id}` }]
        : []),
    ],
  };

  return (
    <>
      {serviceJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ServicePageClient />
    </>
  );
}
