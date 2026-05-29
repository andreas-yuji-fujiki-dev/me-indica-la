'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { HeartIcon as OutlineHeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as SolidHeartIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/context/AuthContext';
import { FavoriteAPI } from '@/services/api';
import { normalizeImageUrl } from '@/utils/imageUrl';

export default function FavoritesClient() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [providerFavorites, setProviderFavorites] = useState<any[]>([]);
  const [serviceFavorites, setServiceFavorites] = useState<any[]>([]);
  const [categoryFavorites, setCategoryFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unfavoritedIds, setUnfavoritedIds] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchFavorites = async () => {
      if (!user) { setLoading(false); return; }

      try {
        const [providerResponse, serviceResponse, categoryResponse] = await Promise.all([
          FavoriteAPI.getProviderFavorites(user.id),
          FavoriteAPI.getServiceFavorites(user.id),
          FavoriteAPI.getCategoryFavorites(user.id),
        ]);

        setProviderFavorites(providerResponse.data.data || []);
        setServiceFavorites(serviceResponse.data.data || []);
        setCategoryFavorites(categoryResponse.data.data || []);
      } catch (fetchError) {
        console.error('Failed to load favorites', fetchError);
        setError('Não foi possível carregar seus favoritos no momento. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [isLoading, isAuthenticated, router, user]);

  const toggleFavorite = async (
    e: React.MouseEvent,
    type: 'provider' | 'service' | 'category',
    id: string,
  ) => {
    e.stopPropagation();
    const isFav = !unfavoritedIds.has(id);

    setUnfavoritedIds((prev) => {
      const next = new Set(prev);
      if (isFav) next.add(id);
      else next.delete(id);
      return next;
    });

    try {
      if (type === 'provider') {
        isFav
          ? await FavoriteAPI.removeProviderFavorite(user!.id, id)
          : await FavoriteAPI.addProviderFavorite(user!.id, id);
      } else if (type === 'service') {
        isFav
          ? await FavoriteAPI.removeServiceFavorite(user!.id, id)
          : await FavoriteAPI.addServiceFavorite(user!.id, id);
      } else {
        isFav
          ? await FavoriteAPI.removeCategoryFavorite(user!.id, id)
          : await FavoriteAPI.addCategoryFavorite(user!.id, id);
      }
    } catch {
      setUnfavoritedIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Meus Favoritos</h1>
            <p className="mt-2 text-sm text-gray-500">
              Veja os serviços e prestadores que você salvou para acessar depois.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        ) : (
          <div className="space-y-10">
            {/* Provider favorites */}
            <section className="rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
              <div className="mb-5 sm:mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Prestadores Favoritos</h2>
                  <p className="text-sm text-gray-500">Acesse seus prestadores preferidos com um clique.</p>
                </div>
                <SolidHeartIcon className="h-8 w-8 text-red-500" />
              </div>

              {providerFavorites.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {providerFavorites.map((provider) => (
                    <div
                      key={provider.id}
                      onClick={() => router.push(`/provider/${provider.id}`)}
                      className="group relative cursor-pointer overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 p-5 transition hover:border-blue-300 hover:bg-white"
                    >
                      <button
                        onClick={(e) => toggleFavorite(e, 'provider', provider.id)}
                        className="absolute right-4 top-4 rounded-full p-1.5 transition hover:bg-red-50"
                        aria-label={unfavoritedIds.has(provider.id) ? 'Adicionar aos favoritos' : 'Remover dos favoritos'}
                      >
                        {unfavoritedIds.has(provider.id)
                          ? <OutlineHeartIcon className="h-5 w-5 text-gray-400" />
                          : <SolidHeartIcon className="h-5 w-5 text-red-500" />}
                      </button>

                      <div className="flex items-center gap-4 pr-8">
                        {(provider.logoUrl || provider.user?.avatarUrl) ? (
                          <Image
                            src={normalizeImageUrl(provider.logoUrl || provider.user.avatarUrl)!}
                            alt={provider.user?.name ?? 'Prestador'}
                            width={56}
                            height={56}
                            className="h-14 w-14 rounded-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                            <span className="text-xl">{provider.user?.name?.charAt(0) || 'P'}</span>
                          </div>
                        )}
                        <div>
                          <p className="text-lg font-semibold text-gray-900">{provider.user?.name || 'Prestador'}</p>
                          <p className="text-sm text-gray-500">
                            {provider.address === 'Somente Online' ? 'Somente Online' : provider.City ? `${provider.City.name} - ${provider.City.state}` : provider.cityName ? `${provider.cityName}${provider.cityState ? ` - ${provider.cityState}` : ''}` : 'Cidade não informada'}
                          </p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-gray-600 line-clamp-3">{provider.description || 'Descrição não disponível.'}</p>
                      <div className="mt-5 flex items-center justify-between text-sm text-gray-500">
                        <span>{provider._count?.reviews ?? 0} avaliações</span>
                        <span>{provider.services?.length ?? 0} serviços</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Nenhum prestador favoritado ainda.</p>
              )}
            </section>

            {/* Category favorites */}
            <section className="rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
              <div className="mb-5 sm:mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Categorias Favoritas</h2>
                  <p className="text-sm text-gray-500">A lista de categorias que você salvou.</p>
                </div>
                <SolidHeartIcon className="h-8 w-8 text-purple-500" />
              </div>

              {categoryFavorites.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryFavorites.map((category) => (
                    <div
                      key={category.id}
                      onClick={() => router.push(`/category/${category.id}`)}
                      className="group relative cursor-pointer overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 p-5 transition hover:border-blue-300 hover:bg-white"
                    >
                      <button
                        onClick={(e) => toggleFavorite(e, 'category', category.id)}
                        className="absolute right-4 top-4 rounded-full p-1.5 transition hover:bg-red-50"
                        aria-label={unfavoritedIds.has(category.id) ? 'Adicionar aos favoritos' : 'Remover dos favoritos'}
                      >
                        {unfavoritedIds.has(category.id)
                          ? <OutlineHeartIcon className="h-5 w-5 text-gray-400" />
                          : <SolidHeartIcon className="h-5 w-5 text-red-500" />}
                      </button>

                      <div className="pr-8">
                        <p className="text-lg font-semibold text-gray-900">{category.name}</p>
                        <p className="text-sm text-gray-500 mt-1">{category.description ?? 'Sem descrição disponível'}</p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-500">
                        <span className="rounded-full bg-gray-100 px-3 py-1">{category._count?.services || 0} serviços</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Nenhuma categoria favoritada ainda.</p>
              )}
            </section>

            {/* Service favorites */}
            <section className="rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
              <div className="mb-5 sm:mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Serviços Favoritos</h2>
                  <p className="text-sm text-gray-500">A lista de serviços que você salvou.</p>
                </div>
                <SolidHeartIcon className="h-8 w-8 text-blue-500" />
              </div>

              {serviceFavorites.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {serviceFavorites.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => router.push(`/service/${service.id}`)}
                      className="group relative cursor-pointer overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 p-5 transition hover:border-blue-300 hover:bg-white"
                    >
                      <button
                        onClick={(e) => toggleFavorite(e, 'service', service.id)}
                        className="absolute right-4 top-4 rounded-full p-1.5 transition hover:bg-red-50"
                        aria-label={unfavoritedIds.has(service.id) ? 'Adicionar aos favoritos' : 'Remover dos favoritos'}
                      >
                        {unfavoritedIds.has(service.id)
                          ? <OutlineHeartIcon className="h-5 w-5 text-gray-400" />
                          : <SolidHeartIcon className="h-5 w-5 text-red-500" />}
                      </button>

                      <div className="pr-8">
                        <p className="text-lg font-semibold text-gray-900">{service.name}</p>
                        <p className="text-sm text-gray-500 mt-1">{service.description ?? 'Sem descrição disponível'}</p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-500">
                        {service.categories?.map((item: any) => (
                          <span key={item.category?.id} className="rounded-full bg-gray-100 px-3 py-1">{item.category?.name}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Nenhum serviço favoritado ainda.</p>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
