'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { CategoryAPI, FavoriteAPI } from '@/services/api';
import { ArrowLeftIcon, HeartIcon as OutlineHeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as SolidHeartIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/context/AuthContext';

export default function CategoryPageClient() {
  const params = useParams();
  const categoryId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const [category, setCategory] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteServices, setFavoriteServices] = useState<Set<string>>(new Set());

  const visibleServices = services.filter(
    (service) => (service._count?.providers ?? service.providers?.length ?? 0) > 0,
  );

  useEffect(() => {
    const fetchCategory = async () => {
      if (!categoryId) {
        setError('Categoria inválida.');
        setLoading(false);
        return;
      }

      try {
        const [categoryResponse, servicesResponse] = await Promise.all([
          CategoryAPI.getById(categoryId),
          CategoryAPI.getServicesByCategory(categoryId),
        ]);

        setCategory(categoryResponse.data);
        setServices(servicesResponse.data.data || []);
      } catch (fetchError) {
        console.error('Failed to load category page', fetchError);
        setError('Não foi possível carregar esta categoria no momento.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [categoryId]);

  useEffect(() => {
    const checkFavorite = async () => {
      if (!isAuthenticated || !user || !categoryId) return;
      try {
        const [categoryFav, serviceFavs] = await Promise.all([
          FavoriteAPI.checkCategoryFavorite(user.id, categoryId),
          FavoriteAPI.getServiceFavorites(user.id),
        ]);
        setIsFavorite(categoryFav.data.isFavorited);
        const ids = new Set<string>((serviceFavs.data.data || []).map((s: any) => s.id));
        setFavoriteServices(ids);
      } catch {
        // silently ignore
      }
    };
    checkFavorite();
  }, [isAuthenticated, user, categoryId]);

  const toggleFavorite = async () => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }
    try {
      if (isFavorite) {
        await FavoriteAPI.removeCategoryFavorite(user.id, categoryId!);
        setIsFavorite(false);
      } else {
        await FavoriteAPI.addCategoryFavorite(user.id, categoryId!);
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const toggleServiceFavorite = async (e: React.MouseEvent, serviceId: string) => {
    e.stopPropagation();
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }
    try {
      if (favoriteServices.has(serviceId)) {
        await FavoriteAPI.removeServiceFavorite(user.id, serviceId);
        setFavoriteServices((prev) => { const s = new Set(prev); s.delete(serviceId); return s; });
      } else {
        await FavoriteAPI.addServiceFavorite(user.id, serviceId);
        setFavoriteServices((prev) => new Set(prev).add(serviceId));
      }
    } catch (err) {
      console.error('Error toggling service favorite:', err);
    }
  };

  const handleServiceClick = (serviceId: string) => {
    router.push(`/service/${serviceId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-start sm:items-center justify-between gap-3 rounded-3xl bg-white p-5 sm:p-6 shadow-sm">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-blue-600">Categoria</p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">{category?.name || 'Categoria'}</h1>
            <p className="mt-3 max-w-2xl text-gray-600 text-sm sm:text-base">{category?.description || 'Veja os serviços disponíveis nesta categoria.'}</p>
          </div>
          <button
            onClick={toggleFavorite}
            className="p-2 rounded-full bg-white/80 hover:bg-white transition-colors shadow"
            aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            {isFavorite ? (
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
            <div className="relative overflow-hidden rounded-3xl bg-white shadow-sm">
              <div className="p-6 sm:p-8">
                <p className="text-sm text-gray-500">{visibleServices.length} serviços na categoria</p>
                <h2 className="mt-4 text-2xl font-semibold text-gray-900">Serviços disponíveis</h2>
                <p className="mt-3 text-gray-600">Explore a lista de serviços relacionados a esta categoria e clique para ver os detalhes de cada um.</p>
              </div>
            </div>

            <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {visibleServices.length > 0 ? (
                visibleServices.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => handleServiceClick(service.id)}
                    className="group cursor-pointer overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{service.name}</h3>
                        <p className="mt-2 text-sm text-gray-500 line-clamp-3">{service.description || 'Sem descrição disponível.'}</p>
                      </div>
                      <button
                        onClick={(e) => toggleServiceFavorite(e, service.id)}
                        className="shrink-0 p-2 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label={favoriteServices.has(service.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                      >
                        {favoriteServices.has(service.id) ? (
                          <SolidHeartIcon className="h-5 w-5 text-red-500" />
                        ) : (
                          <OutlineHeartIcon className="h-5 w-5 text-gray-400 hover:text-red-500" />
                        )}
                      </button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
                      {service.categories?.map((item: any) => (
                        <span key={item.category?.id || Math.random()} className="rounded-full bg-gray-100 px-3 py-1">
                          {item.category?.name}
                        </span>
                      ))}
                    </div>
                    <div className="mt-5 flex items-center justify-between text-sm text-gray-500">
                      {service.keywords?.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {service.keywords.slice(0, 4).map((kw: string, i: number) => (
                            <span key={i} className="rounded-md bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                              {kw}
                            </span>
                          ))}
                        </div>
                      ) : <span />}
                      <span className="shrink-0">{service._count?.providers ?? service.providers?.length ?? 0} prestadores</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-gray-500">
                  Nenhum prestador disponível para os serviços desta categoria.
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
