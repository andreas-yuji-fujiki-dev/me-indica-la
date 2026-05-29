import type { Metadata } from 'next';
import CategoryPageClient from './CategoryPageClient';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://meindicala.com.br';

type Props = { params: Promise<{ id: string }> };

async function fetchCategory(id: string) {
  try {
    const res = await fetch(`${API_URL}/category/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const category = await fetchCategory(id);
  if (!category) return {};

  const title = `${category.name} — Serviços e Prestadores`;
  const description =
    category.description ||
    `Encontre os melhores prestadores de ${category.name} na sua região. Compare avaliações e contrate profissionais qualificados.`;

  return {
    title,
    description,
    keywords: [category.name, 'prestadores de serviço', 'serviços locais', 'contratar profissional'],
    alternates: { canonical: `/category/${id}` },
    openGraph: {
      title: `${category.name} | Me Indica Lá`,
      description,
      url: `/category/${id}`,
      type: 'website',
      ...(category.imageUrl && { images: [{ url: category.imageUrl, alt: category.name }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category.name} | Me Indica Lá`,
      description,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { id } = await params;
  const category = await fetchCategory(id);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Serviços', item: `${SITE_URL}/search` },
      ...(category
        ? [{ '@type': 'ListItem', position: 3, name: category.name, item: `${SITE_URL}/category/${id}` }]
        : []),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CategoryPageClient />
    </>
  );
}
