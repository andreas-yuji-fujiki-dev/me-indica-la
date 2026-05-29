'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  HeartIcon,
  UserIcon,
  ArrowLeftIcon,
  PencilSquareIcon,
  BriefcaseIcon,
  ArrowRightStartOnRectangleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import { useAuthActions } from '@/hooks/useAuthActions';
import { ProviderAPI } from '@/services/api';

interface ProviderSummary {
  id: string;
  status: string;
}

export default function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { logout } = useAuthActions();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [userProvider, setUserProvider] = useState<ProviderSummary | null | undefined>(undefined);

  const isHome = pathname === '/' || pathname === '';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setUserProvider(undefined);
      return;
    }
    ProviderAPI.getByUserId(user.id)
      .then((res) => setUserProvider({ id: res.data.id, status: res.data.status }))
      .catch(() => setUserProvider(null));
  }, [isAuthenticated, user]);

  if (pathname === '/login') return null;

  const handleFavoritesClick = () => {
    router.push(isAuthenticated ? '/favorites' : '/login');
  };

  const navigate = (path: string) => {
    setMenuOpen(false);
    router.push(path);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2 sm:py-3 w-full">
          <div className="flex items-center gap-2 sm:gap-4">
            {!isHome && (
              <button
                onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))}
                className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-gray-200 bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Voltar</span>
              </button>
            )}

            <a href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Logo do site"
                width={320}
                height={320}
                className="h-10 w-10 sm:h-16 sm:w-16"
                loading="eager"
                priority
              />
            </a>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={handleFavoritesClick}
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
            >
              <HeartIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Favoritos</span>
            </button>

            {authLoading ? (
              <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse" />
            ) : isAuthenticated ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center justify-center rounded-full ring-2 ring-offset-2 ring-transparent hover:ring-blue-400 transition-all focus:outline-none"
                  aria-label="Menu do usuário"
                  aria-expanded={menuOpen}
                >
                  {user?.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.name ?? 'Avatar'}
                      width={36}
                      height={36}
                      className="h-9 w-9 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600">
                      <UserIcon className="h-5 w-5 text-white" />
                    </div>
                  )}
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-gray-100 bg-white py-1.5 shadow-lg">
                    {user?.name && (
                      <p className="truncate px-4 pb-1.5 pt-0.5 text-xs font-medium text-gray-400">
                        {user.name}
                      </p>
                    )}
                    <hr className="border-gray-100" />

                    {userProvider?.status === 'APPROVED' ? (
                      <button
                        onClick={() => navigate(`/provider/${userProvider.id}`)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <BriefcaseIcon className="h-4 w-4 shrink-0 text-gray-400" />
                        Gerenciar negócio
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate('/profile/edit')}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <PencilSquareIcon className="h-4 w-4 shrink-0 text-gray-400" />
                        Editar perfil
                      </button>
                    )}

                    {userProvider === null && (
                      <button
                        onClick={() => navigate('/provider/register')}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <BriefcaseIcon className="h-4 w-4 shrink-0 text-gray-400" />
                        Cadastrar negócio
                      </button>
                    )}

                    {userProvider && userProvider.status !== 'APPROVED' && (
                      <button
                        onClick={() => navigate(`/provider/${userProvider.id}`)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <BriefcaseIcon className="h-4 w-4 shrink-0 text-gray-400" />
                        <span className="text-left">Acompanhar cadastro de negócio</span>
                      </button>
                    )}

                    {user?.role === 'ADMIN' && (
                      <>
                        <button
                          onClick={() => navigate('/admin')}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-blue-700 hover:bg-blue-50 transition-colors"
                        >
                          <Cog6ToothIcon className="h-4 w-4 shrink-0 text-blue-500" />
                          Painel Admin
                        </button>
                        <hr className="border-gray-100" />
                      </>
                    )}

                    <hr className="border-gray-100" />

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <ArrowRightStartOnRectangleIcon className="h-4 w-4 shrink-0" />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
              >
                <UserIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Entrar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
