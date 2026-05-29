import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import AppHeader from '@/components/AppHeader';

const inter = Inter({ subsets: ['latin'] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://meindicala.com.br';
const SITE_NAME = 'Me Indica Lá';

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Encontre Prestadores de Serviço na Sua Região`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Encontre os melhores prestadores de serviço perto de você. Compare avaliações, veja portfólios e contrate profissionais qualificados na sua cidade.',
  keywords: [
    'prestadores de serviço',
    'serviços locais',
    'guia de serviços',
    'profissionais qualificados',
    'contratar profissional',
    'Me Indica Lá',
    'MIL',
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  applicationName: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Encontre Prestadores de Serviço na Sua Região`,
    description:
      'Encontre os melhores prestadores de serviço perto de você. Compare avaliações e contrate profissionais qualificados na sua cidade.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Guia Digital de Serviços`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Encontre Prestadores de Serviço`,
    description: 'Encontre os melhores prestadores de serviço perto de você.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: SITE_URL,
    languages: { 'pt-BR': SITE_URL },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <AppHeader />
            <main className="flex-1">{children}</main>
            <footer className="bg-white border-t border-blue-500">
              <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-gray-500">© 2026 Me Indica Lá. Todos os direitos reservados.</p>
                <p className="text-sm text-gray-500">Conectando você aos melhores serviços locais com confiança.</p>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
