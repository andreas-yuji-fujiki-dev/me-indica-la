import type { Metadata } from 'next';
import { Suspense } from 'react';
import SearchClient from './SearchClient';

export const metadata: Metadata = {
  title: 'Buscar Prestadores de Serviço',
  description:
    'Pesquise por prestadores de serviço, categorias e cidades. Encontre profissionais qualificados na sua região e compare avaliações.',
  alternates: { canonical: '/search' },
  openGraph: {
    title: 'Buscar Prestadores | Me Indica Lá',
    description: 'Pesquise por prestadores de serviço, categorias e cidades na sua região.',
    url: '/search',
    type: 'website',
  },
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-white p-8 shadow-sm text-center text-gray-700">
              Carregando pesquisa...
            </div>
          </div>
        </div>
      }
    >
      <SearchClient />
    </Suspense>
  );
}
