'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ServiceAPI, FavoriteAPI } from '@/services/api';
import { ArrowLeftIcon, HeartIcon as OutlineHeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as SolidHeartIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/context/AuthContext';

export default function ServicePageClient() {
  const params = useParams();
  const serviceId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const router = useRouter();

  const { isAuthenticated, user } = useAuth();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoriteProviders, setFavoriteProviders] = useState<Set<string>>(new Set());
  const [isFavoriteService, setIsFavoriteService] = useState(false);

  useEffect(() => {
    const fetchService = async () => {
      if (!serviceId) {
        setError('Serviço inválido.');
        setLoading(false);
        return;
      }

      try {
        const response = await ServiceAPI.getById(serviceId);
        setService(response.data);
      } catch (fetchError) {
        console.error('Failed to load service page', fetchError);
        setError('Não foi possível carregar este serviço no momento.');
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [serviceId]);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!isAuthenticated || !user || !serviceId) return;
      try {
        const [providerFavs, serviceFav] = await Promise.all([
          FavoriteAPI.getProviderFavorites(user.id),
          FavoriteAPI.checkServiceFavorite(user.id, serviceId),
        ]);
        const ids = new Set<string>((providerFavs.data.data || []).map((p: any) => p.id));
        setFavoriteProviders(ids);
        setIsFavoriteService(serviceFav.data.isFavorited);
      } catch {
        // silently ignore
      }
    };
    fetchFavorites();
  }, [isAuthenticated, user, serviceId]);

  const toggleServiceFavorite = async () => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }
    try {
      if (isFavoriteService) {
        await FavoriteAPI.removeServiceFavorite(user.id, serviceId!);
        setIsFavoriteService(false);
      } else {
        await FavoriteAPI.addServiceFavorite(user.id, serviceId!);
        setIsFavoriteService(true);
      }
    } catch (err) {
      console.error('Error toggling service favorite:', err);
    }
  };

  const toggleProviderFavorite = async (e: React.MouseEvent, providerId: string) => {
    e.stopPropagation();
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }
    try {
      if (favoriteProviders.has(providerId)) {
        await FavoriteAPI.removeProviderFavorite(user.id, providerId);
        setFavoriteProviders((prev) => { const s = new Set(prev); s.delete(providerId); return s; });
      } else {
        await FavoriteAPI.addProviderFavorite(user.id, providerId);
        setFavoriteProviders((prev) => new Set(prev).add(providerId));
      }
    } catch (err) {
      console.error('Error toggling provider favorite:', err);
    }
  };

  const renderRatingStars = (rating?: number) => {
    if (rating == null || rating <= 0) return null;

    const clamped = Math.min(Math.max(rating, 0), 5);

    return (
      <div className="flex items-center gap-0.5 text-sm">
        {[...Array(5)].map((_, index) => {
          const fillPercent = Math.min(Math.max((clamped - index) * 100, 0), 100);
          return (
            <span key={index} className="relative inline-block text-slate-300">
              <span className="text-yellow-500 absolute inset-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
                ★
              </span>
              <span>★</span>
            </span>
          );
        })}
      </div>
    );
  };

  const sortedProviders = service?.providers
    ? [...service.providers].sort((a: any, b: any) => {
        const ratingA = a.provider?.averageRating ?? 0;
        const ratingB = b.provider?.averageRating ?? 0;

        if (ratingA !== ratingB) return ratingB - ratingA;
        const reviewsA = a.provider?._count?.reviews ?? 0;
        const reviewsB = b.provider?._count?.reviews ?? 0;
        return reviewsB - reviewsA;
      })
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-start sm:items-center justify-between gap-3 rounded-3xl bg-white p-5 sm:p-6 shadow-sm">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-blue-600">Serviço</p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">{service?.name || 'Detalhes do serviço'}</h1>
            <p className="mt-3 text-sm sm:text-base text-gray-600">{service?.description || 'Todas as informações relacionadas a este serviço.'}</p>
          </div>
          <button
            onClick={toggleServiceFavorite}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label={isFavoriteService ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            {isFavoriteService ? (
              <SolidHeartIcon className="h-6 w-6 text-red-500" />
            ) : (
              <OutlineHeartIcon className="h-6 w-6 text-gray-400 hover:text-red-500" />
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-3xl bg-white p-10 shadow-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
            {error}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-sm">
              <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Sobre o serviço</h2>
                  <p className="mt-4 text-gray-600">{service?.description || 'Nenhuma descrição foi fornecida para este serviço.'}</p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="mt-2 font-semibold text-gray-900">{service?.isActive ? 'Ativo' : 'Inativo'}</p>
                    </div>
                    <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                      <p className="text-sm text-gray-500">Serviços vinculados</p>
                      <p className="mt-2 font-semibold text-gray-900">{service?._count?.providers ?? 0} prestadores</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                  <p className="text-sm text-gray-500">Categorias</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {service?.categories?.map((item: any) => (
                      <span key={item.category?.id} className="rounded-full bg-white px-3 py-1 text-sm text-gray-700 shadow-sm">
                        {item.category?.name}
                      </span>
                    ))}
                  </div>
                  {service?.keywords?.length ? (
                    <div className="mt-5">
                      <p className="text-sm text-gray-500">Palavras-chave</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {service.keywords.map((keyword: string) => (
                          <span key={keyword} className="rounded-full bg-white px-3 py-1 text-sm text-gray-700 shadow-sm">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <section className="rounded-3xl bg-white p-4 sm:p-6 shadow-sm">
              <div className="mb-5 sm:mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Prestadores disponíveis</h2>
                  <p className="mt-2 text-sm text-gray-500">Veja alguns dos prestadores que oferecem este serviço.</p>
                </div>
              </div>

              {sortedProviders.length ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {sortedProviders.map((providerItem: any) => (
                    <div
                      key={providerItem.provider?.id}
                      onClick={() => { if (!isAuthenticated) { router.push('/login'); return; } router.push(`/provider/${providerItem.provider?.id}`); }}
                      className="cursor-pointer rounded-3xl border border-gray-200 bg-gray-50 p-5 transition hover:border-blue-300 hover:shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        {(providerItem.provider?.logoUrl || providerItem.provider?.user?.avatarUrl) ? (
                          <Image
                            src={providerItem.provider.logoUrl || providerItem.provider.user.avatarUrl}
                            alt={providerItem.provider?.user?.name ?? 'Prestador'}
                            width={52}
                            height={52}
                            className="h-14 w-14 rounded-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                            <span>{providerItem.provider?.user?.name?.charAt(0) || 'P'}</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{providerItem.provider?.user?.name || 'Prestador'}</p>
                          <p className="text-sm text-gray-500">
                            {(() => { const p = providerItem.provider; if (!p) return 'Cidade não informada'; if (p.address === 'Somente Online') return 'Somente Online'; if (p.City) return `${p.City.name} - ${p.City.state}`; if (p.cityName) return `${p.cityName}${p.cityState ? ` - ${p.cityState}` : ''}`; return 'Cidade não informada'; })()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => toggleProviderFavorite(e, providerItem.provider?.id)}
                          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                          aria-label={favoriteProviders.has(providerItem.provider?.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                        >
                          {favoriteProviders.has(providerItem.provider?.id) ? (
                            <SolidHeartIcon className="h-5 w-5 text-red-500" />
                          ) : (
                            <OutlineHeartIcon className="h-5 w-5 text-gray-400 hover:text-red-500" />
                          )}
                        </button>
                      </div>
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-col gap-1">
                            {(providerItem.provider?._count?.reviews ?? 0) > 0 ? (
                              <div className="flex items-center gap-3">
                                {renderRatingStars(providerItem.provider.averageRating)}
                                <span className="text-sm text-slate-600">
                                  {providerItem.provider.averageRating.toFixed(1)} • {providerItem.provider._count?.reviews ?? 0} avaliações
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-500">Ainda não avaliado</span>
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">{providerItem.provider?.isVerified ? 'Verificado' : 'Não verificado'}</span>
                      </div>
                      {providerItem.provider?.keywords?.length ? (
                        <div className="mt-4">
                          <p className="text-sm text-gray-500">Palavras-chave</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {providerItem.provider.keywords.map((keyword: string) => (
                              <span key={keyword} className="rounded-full bg-white px-3 py-1 text-sm text-gray-700 shadow-sm">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-gray-500">
                  Nenhum prestador listado para este serviço.
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
