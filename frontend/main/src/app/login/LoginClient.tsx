'use client';

import { useState } from 'react';
import { useAuthActions } from '@/hooks/useAuthActions';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

function translateError(err: any): string {
  if (!navigator.onLine) return 'Sem conexão com a internet. Verifique sua rede.';

  const status = err?.response?.status;
  const raw = err?.response?.data?.message ?? err?.message ?? '';
  const msg: string = Array.isArray(raw) ? raw.join(', ') : String(raw);

  if (msg.includes('Email already exists') || msg.includes('email already exists'))
    return 'Este email já está cadastrado.';
  if (msg.includes('Slug already exists') || msg.includes('slug already exists'))
    return 'Este nome de usuário já está em uso. Tente um nome diferente.';
  if (msg.includes('Phone number already exists'))
    return 'Este número de telefone já está cadastrado.';
  if (msg.includes('Credenciais inválidas') || msg.includes('Login failed') || msg.includes('Authentication failed') || status === 401)
    return 'Email ou senha incorretos. Não tem conta? Cadastre-se.';
  if (msg.includes('Conta desativada'))
    return 'Esta conta foi desativada. Entre em contato com o suporte.';
  if (msg.includes('Erro ao criar usuário'))
    return 'Erro ao criar conta. Tente novamente mais tarde.';
  if (msg.includes('longer than or equal to 6') || msg.includes('minLength'))
    return 'A senha deve ter no mínimo 6 caracteres.';
  if (msg.includes('longer than or equal to 2') && msg.includes('name'))
    return 'O nome deve ter no mínimo 2 caracteres.';
  if (msg.includes('email must be an email') || msg.includes('IsEmail'))
    return 'Digite um email válido.';
  if (status === 400 && msg)
    return msg;
  if (status === 500)
    return 'Erro interno no servidor. Tente novamente mais tarde.';

  return msg || 'Ocorreu um erro inesperado. Tente novamente.';
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export default function LoginClient() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuthActions();
  const router = useRouter();

  const redirectAfterAuth = () => {
    const pending = localStorage.getItem('pendingSearch');
    if (!pending) { router.push('/'); return; }
    try {
      const payload = JSON.parse(pending) as Record<string, string>;
      localStorage.removeItem('pendingSearch');
      const params = new URLSearchParams();
      if (payload.q) params.set('q', payload.q);
      if (payload.categoryId) params.set('categoryId', payload.categoryId);
      if (payload.serviceId) params.set('serviceId', payload.serviceId);
      if (payload.cityId) params.set('cityId', payload.cityId);
      router.push(params.toString() ? `/search?${params.toString()}` : '/');
    } catch {
      router.push('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isRegistering && name.trim().length < 2) {
      setError('O nome deve ter no mínimo 2 caracteres.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Digite um email válido.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    setIsLoading(true);
    try {
      let result: { success: boolean; error?: string };
      if (isRegistering) {
        const slug = generateSlug(name.trim());
        result = await register({ email: email.trim(), password, name: name.trim(), slug });
      } else {
        result = await login(email.trim(), password);
      }

      if (!result.success) {
        setError(translateError({ message: result.error }));
        return;
      }
      redirectAfterAuth();
    } catch (err: any) {
      setError(translateError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsRegistering((v) => !v);
    setError('');
    setName('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col py-12 sm:px-6 lg:px-8">
      <div className="px-4 sm:px-0">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Voltar
        </button>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Image src="/logo.png" alt="Me Indica Lá" width={200} height={60} className="h-14 w-auto" priority />
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
          {isRegistering ? 'Criar conta' : 'Entrar na sua conta'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>

            {isRegistering && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nome completo
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(''); }}
                  placeholder="Seu nome"
                  className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="seu@email.com"
                className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder={isRegistering ? 'Mínimo 6 caracteres' : '••••••••'}
                className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading && (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {isLoading ? 'Aguarde...' : isRegistering ? 'Criar conta' : 'Entrar'}
            </button>

            <p className="text-center text-sm text-gray-500">
              {isRegistering ? 'Já tem conta? ' : 'Não tem conta? '}
              <button type="button" onClick={switchMode} className="font-medium text-blue-600 hover:text-blue-500">
                {isRegistering ? 'Fazer login' : 'Cadastre-se'}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
