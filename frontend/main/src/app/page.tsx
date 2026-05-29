import type { Metadata } from 'next';
import HomeClient from './HomeClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://meindicala.com.br';

export const metadata: Metadata = {
  title: 'Encontre Prestadores de Serviço na Sua Região',
  description:
    'Encontre os melhores prestadores de serviço perto de você. Compare avaliações, veja portfólios e contrate profissionais qualificados na sua cidade.',
  alternates: { canonical: '/' },
  openGraph: { type: 'website', url: '/' },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Me Indica Lá',
  url: SITE_URL,
  description: 'Guia digital de prestadores de serviço — encontre profissionais qualificados na sua cidade.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Me Indica Lá',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  sameAs: [],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <HomeClient />
    </>
  );
}
