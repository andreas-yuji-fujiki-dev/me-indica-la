import type { Metadata } from 'next';
import { Suspense } from 'react';
import ProviderRegisterClient from './ProviderRegisterClient';

export const metadata: Metadata = {
  title: 'Cadastrar Meu Negócio',
  description:
    'Cadastre seu negócio no Me Indica Lá e conecte-se a novos clientes na sua região. Preencha as informações, adicione fotos e aguarde a aprovação.',
  alternates: { canonical: '/provider/register' },
  openGraph: {
    title: 'Cadastrar Meu Negócio | Me Indica Lá',
    description:
      'Cadastre seu negócio no Me Indica Lá e conecte-se a novos clientes na sua região.',
    url: '/provider/register',
    type: 'website',
  },
};

export default function RegisterProviderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500" />
        </div>
      }
    >
      <ProviderRegisterClient />
    </Suspense>
  );
}
