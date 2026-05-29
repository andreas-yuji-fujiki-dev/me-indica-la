import type { Metadata } from 'next';
import FavoritesClient from './FavoritesClient';

export const metadata: Metadata = {
  title: 'Meus Favoritos',
  description: 'Acesse os prestadores, categorias e serviços que você salvou no Me Indica Lá.',
  robots: { index: false, follow: false },
};

export default function FavoritesPage() {
  return <FavoritesClient />;
}
