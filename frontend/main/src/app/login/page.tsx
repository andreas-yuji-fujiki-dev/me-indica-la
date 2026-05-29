import type { Metadata } from 'next';
import LoginClient from './LoginClient';

export const metadata: Metadata = {
  title: 'Entrar ou Criar Conta',
  description: 'Acesse sua conta no Me Indica Lá para encontrar e favoritar os melhores prestadores de serviço da sua região.',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginClient />;
}
