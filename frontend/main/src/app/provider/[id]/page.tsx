import type { Metadata } from 'next';
import ProviderPageClient from './ProviderPageClient';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://meindicala.com.br';

type Props = { params: Promise<{ id: string }> };

async function fetchProvider(id: string) {
  try {
    const res = await fetch(`${API_URL}/provider/${id}`, { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const provider = await fetchProvider(id);

  if (!provider || provider.status !== 'APPROVED') {
    return { robots: { index: false, follow: false } };
  }

  const name = provider.user?.name || provider.businessName || 'Prestador';
  const city = provider.City ? `${provider.City.name} - ${provider.City.state}` : '';
  const title = `${name}${city ? ` — ${city}` : ''} — Prestador de Serviços`;
  const serviceNames: string[] =
    provider.services?.map((ps: any) => ps.service?.name).filter(Boolean) ?? [];

  const description =
    provider.description ||
    (serviceNames.length > 0
      ? `${name} oferece: ${serviceNames.slice(0, 3).join(', ')}${city ? ` em ${city}` : ''}. Veja avaliações e entre em contato.`
      : `Conheça o perfil de ${name} no Me Indica Lá${city ? ` — ${city}` : ''}.`);

  const images: { url: string; alt: string }[] = [];
  if (provider.logoUrl) images.push({ url: provider.logoUrl, alt: name });
  if (provider.coverImageUrl) images.push({ url: provider.coverImageUrl, alt: `${name} — capa` });

  return {
    title,
    description,
    keywords: [name, ...serviceNames, city, 'prestador de serviços'].filter(Boolean),
    alternates: { canonical: `/provider/${id}` },
    openGraph: {
      title: `${name} | Me Indica Lá`,
      description,
      url: `/provider/${id}`,
      type: 'profile',
      ...(images.length && { images }),
    },
    twitter: {
      card: images.length ? 'summary_large_image' : 'summary',
      title: `${name} | Me Indica Lá`,
      description,
      ...(images.length && { images: [images[0].url] }),
    },
  };
}

export default async function ProviderPage({ params }: Props) {
  const { id } = await params;
  const provider = await fetchProvider(id);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Prestadores', item: `${SITE_URL}/search` },
      ...(provider
        ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: provider.user?.name || 'Prestador',
              item: `${SITE_URL}/provider/${id}`,
            },
          ]
        : []),
    ],
  };

  const localBusinessJsonLd =
    provider && provider.status === 'APPROVED'
      ? {
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          '@id': `${SITE_URL}/provider/${id}`,
          name: provider.user?.name || provider.businessName,
          ...(provider.description && { description: provider.description }),
          url: `${SITE_URL}/provider/${id}`,
          ...(provider.logoUrl && { image: provider.logoUrl }),
          ...(provider.whatsappBusiness && { telephone: provider.whatsappBusiness }),
          ...(provider.website && { sameAs: [provider.website] }),
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'BR',
            ...(provider.City && {
              addressLocality: provider.City.name,
              addressRegion: provider.City.state,
            }),
          },
          ...(provider.averageRating > 0 && {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: Number(provider.averageRating).toFixed(1),
              reviewCount: provider._count?.reviews ?? 0,
              bestRating: 5,
              worstRating: 1,
            },
          }),
          ...(provider.services?.length && {
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: 'Serviços Oferecidos',
              itemListElement: provider.services.map((ps: any) => ({
                '@type': 'Offer',
                itemOffered: { '@type': 'Service', name: ps.service?.name },
              })),
            },
          }),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {localBusinessJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
      )}
      <ProviderPageClient />
    </>
  );
}
