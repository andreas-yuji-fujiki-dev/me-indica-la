import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Página não encontrada — 404',
  description: 'O endereço que você tentou acessar não existe ou foi removido.',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-50 px-4">
      <div className="text-center max-w-md mx-auto">
        <p className="text-8xl sm:text-9xl font-extrabold text-blue-500 leading-none select-none">
          404
        </p>

        <h1 className="mt-6 text-2xl sm:text-3xl font-bold text-gray-900">
          Página não encontrada
        </h1>

        <p className="mt-3 text-base text-gray-500">
          Ops! O endereço que você tentou acessar não existe ou foi removido.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Voltar para o início
          </Link>
          <Link
            href="/search"
            className="rounded-full border border-blue-200 bg-white px-6 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
          >
            Buscar serviços
          </Link>
        </div>
      </div>
    </div>
  );
}
