'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SearchAPI, CategoryAPI, ServiceAPI, CityAPI, FavoriteAPI } from '@/services/api';
import { HeartIcon as OutlineHeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as SolidHeartIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/context/AuthContext';
import { normalizeImageUrl } from '@/utils/imageUrl';

const retryWithDelay = async (fn: () => Promise<any>, maxRetries = 0, delay = 500): Promise<any> => {
  try {
    return await fn();
  } catch (error: any) {
    if (maxRetries <= 0 || error.response) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithDelay(fn, maxRetries - 1, delay);
  }
};

export default function SearchClient() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const searchParams = useSearchParams();
  const qParam = searchParams.get('q') || '';
  const categoryIdParam = searchParams.get('categoryId') || '';
  const serviceIdParam = searchParams.get('serviceId') || '';
  const cityIdParam = searchParams.get('cityId') || '';

  const [searchInput, setSearchInput] = useState(qParam);
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryIdParam);
  const [selectedServiceId, setSelectedServiceId] = useState(serviceIdParam);
  const [selectedCityId, setSelectedCityId] = useState(cityIdParam);

  const [searchCategories, setSearchCategories] = useState<any[]>([]);
  const [searchServices, setSearchServices] = useState<any[]>([]);
  const [searchProviders, setSearchProviders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [filterCategories, setFilterCategories] = useState<any[]>([]);
  const [filterServices, setFilterServices] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [cityName, setCityName] = useState('');
  const [availableCities, setAvailableCities] = useState<any[]>([]);
  const [unavailableCities, setUnavailableCities] = useState<any[]>([]);

  const [favCategories, setFavCategories] = useState<Set<string>>(new Set());
  const [favServices, setFavServices] = useState<Set<string>>(new Set());
  const [favProviders, setFavProviders] = useState<Set<string>>(new Set());

  // Sincronizar os estados com os parâmetros da URL
  useEffect(() => {
    setSearchInput(qParam);
    setSelectedCategoryId(categoryIdParam);
    setSelectedServiceId(serviceIdParam);
    setSelectedCityId(cityIdParam);
  }, [qParam, categoryIdParam, serviceIdParam, cityIdParam]);

  // Atualizar a URL ao alterar o input de pesquisa ou os filtros
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchInput.trim()) params.set('q', searchInput.trim());
    if (selectedCategoryId) params.set('categoryId', selectedCategoryId);
    if (selectedServiceId) params.set('serviceId', selectedServiceId);
    if (selectedCityId) params.set('cityId', selectedCityId);

    window.history.replaceState({}, '', `/search?${params.toString()}`);
  }, [searchInput, selectedCategoryId, selectedServiceId, selectedCityId]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [categoriesResponse, servicesResponse, citiesResponse] = await Promise.all([
          retryWithDelay(() => CategoryAPI.getAll()),
          retryWithDelay(() => ServiceAPI.getAll({ hasActiveProviders: true })),
          retryWithDelay(() => CityAPI.getAll()),
        ]);

        const loadedCategories = categoriesResponse.data.data || [];
        const loadedServices = servicesResponse.data.data || [];

        setFilterCategories(loadedCategories);
        setFilterServices(loadedServices);
        setCities(citiesResponse.data.data || []);

        // Se não houver input de busca nem filtros selecionados, mostrar categorias válidas imediatamente
        const hasText = searchInput.trim().length > 0;
        const hasFilters = !!selectedServiceId || !!selectedCityId || !!selectedCategoryId;
        if (!hasText && !hasFilters) {
          const valid = loadedCategories.filter((c: any) => c.isActive && (c._count?.services || 0) > 0);
          setSearchCategories(valid);
          setSearchServices([]);
          setSearchProviders([]);
        }
      } catch (fetchError) {
        console.error('Erro ao carregar filtros de busca:', fetchError);
      }
    };

    fetchOptions();
  }, []);

  useEffect(() => {
    const fetchAvailableCities = async () => {
      if (!selectedCategoryId || !selectedServiceId) {
        setAvailableCities([]);
        setUnavailableCities([]);
        return;
      }
      try {
        const response = await retryWithDelay(() =>
          SearchAPI.search('', {
            categoryId: selectedCategoryId,
            serviceId: selectedServiceId,
          })
        );
        const providers = response.data.providers?.data || [];
        const uniqueCities = new Map();
        
        providers.forEach((provider: any) => {
          if (provider.City && provider.City.id) {
            uniqueCities.set(provider.City.id, provider.City);
          }
        });
        
        const citiesWithProviders = Array.from(uniqueCities.values());

        const allCitiesData = cities;

        const available = citiesWithProviders;
        const unavailable = allCitiesData.filter((city: any) => {
          return !available.some((availableCity: any) => availableCity.id === city.id);
        });

        setAvailableCities(available);
        setUnavailableCities(unavailable);
      } catch (error) {
        console.error('Erro ao buscar cidades disponíveis:', error);
      }
    };

    fetchAvailableCities();
  }, [selectedCategoryId, selectedServiceId, cities]);

  useEffect(() => {
    try {
      if (selectedCategoryId) {
        const category = filterCategories.find((item: any) => item.id === selectedCategoryId);
        setCategoryName(category?.name ?? 'Categoria selecionada');
      } else {
        setCategoryName('');
      }
      if (selectedServiceId) {
        const service = filterServices.find((item: any) => item.id === selectedServiceId);
        setServiceName(service?.name ?? 'Serviço selecionado');
      } else {
        setServiceName('');
      }

      if (selectedCityId) {
        const city = cities.find((item: any) => item.id === selectedCityId);
        setCityName(city?.name ?? 'Cidade selecionada');
      } else {
        setCityName('');
      }
    } catch (fetchError) {
      console.error('Erro ao carregar labels de busca:', fetchError);
    }
  }, [selectedCategoryId, selectedServiceId, selectedCityId, filterCategories, filterServices, cities]);

  const relevantServices = useMemo(() => {
    if (!selectedCategoryId) return [];

    if (selectedServiceId) {
      return filterServices.filter((service) => service.id === selectedServiceId);
    }

    return filterServices.filter((service) => {
      if (!service.isActive) return false;
      return service.categories?.some(
        (categoryItem: any) =>
          categoryItem.categoryId === selectedCategoryId ||
          categoryItem.category?.id === selectedCategoryId,
      );
    });
  }, [filterServices, selectedCategoryId, selectedServiceId]);

  const fetchValidCategories = () => {
    return filterCategories.filter((c) => c.isActive && (c._count?.services || 0) > 0);
  };

  // Atualizar resultados automaticamente ao digitar ou alterar filtros
  useEffect(() => {
    const timer = setTimeout(async () => {
      const hasText = searchInput.trim().length > 0;
      const hasFilters = !!selectedServiceId || !!selectedCityId || !!selectedCategoryId;

      setIsLoading(true);
      setError('');

      try {
        if (!hasText && !hasFilters) {
          // 🔥 SEM texto e SEM filtros: mostrar SOMENTE categorias válidas
          const validCategories = fetchValidCategories();
          
          setSearchCategories(validCategories);
          setSearchServices([]);  // ❌ Sem serviços
          setSearchProviders([]); // ❌ Sem prestadores
        } else {
          // Com texto ou filtros: buscar tudo normalmente
          const response = await retryWithDelay(() =>
            SearchAPI.search(searchInput.trim(), {
              serviceId: selectedServiceId || undefined,
              cityId: selectedCityId || undefined,
              categoryId: selectedCategoryId || undefined,
              page: 1,
            })
          );

          // Filtrar resultados para garantir que só mostram serviços/categorias com prestadores ativos
          let categories = response.data.categories?.data || [];
          let services = response.data.services?.data || [];
          let providers = response.data.providers?.data || [];

          // Filtrar categorias que têm serviços com prestadores
          categories = categories.filter((category: any) => {
            return (category._count?.services || 0) > 0;
          });

          // Filtrar serviços que têm prestadores
          services = services.filter((service: any) => {
            return (service._count?.providers || 0) > 0;
          });

          setSearchCategories(categories);
          setSearchServices(services);
          setSearchProviders(providers);
        }
      } catch (searchError) {
        console.error('Erro de busca:', searchError);
        setError('Falha ao executar a busca. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, selectedServiceId, selectedCityId, selectedCategoryId, filterCategories]);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!isAuthenticated || !user) return;
      try {
        const [cats, svcs, provs] = await Promise.all([
          FavoriteAPI.getCategoryFavorites(user.id),
          FavoriteAPI.getServiceFavorites(user.id),
          FavoriteAPI.getProviderFavorites(user.id),
        ]);
        setFavCategories(new Set<string>((cats.data.data || []).map((c: any) => c.id)));
        setFavServices(new Set<string>((svcs.data.data || []).map((s: any) => s.id)));
        setFavProviders(new Set<string>((provs.data.data || []).map((p: any) => p.id)));
      } catch {
        // silently ignore
      }
    };
    fetchFavorites();
  }, [isAuthenticated, user]);

  const toggleFav = async (
    e: React.MouseEvent,
    type: 'category' | 'service' | 'provider',
    id: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }
    try {
      if (type === 'category') {
        if (favCategories.has(id)) {
          await FavoriteAPI.removeCategoryFavorite(user.id, id);
          setFavCategories((prev) => { const s = new Set(prev); s.delete(id); return s; });
        } else {
          await FavoriteAPI.addCategoryFavorite(user.id, id);
          setFavCategories((prev) => new Set(prev).add(id));
        }
      } else if (type === 'service') {
        if (favServices.has(id)) {
          await FavoriteAPI.removeServiceFavorite(user.id, id);
          setFavServices((prev) => { const s = new Set(prev); s.delete(id); return s; });
        } else {
          await FavoriteAPI.addServiceFavorite(user.id, id);
          setFavServices((prev) => new Set(prev).add(id));
        }
      } else {
        if (favProviders.has(id)) {
          await FavoriteAPI.removeProviderFavorite(user.id, id);
          setFavProviders((prev) => { const s = new Set(prev); s.delete(id); return s; });
        } else {
          await FavoriteAPI.addProviderFavorite(user.id, id);
          setFavProviders((prev) => new Set(prev).add(id));
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const HeartButton = ({ type, id }: { type: 'category' | 'service' | 'provider'; id: string }) => {
    const isFav =
      type === 'category' ? favCategories.has(id)
      : type === 'service' ? favServices.has(id)
      : favProviders.has(id);
    return (
      <button
        onClick={(e) => toggleFav(e, type, id)}
        className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
        aria-label={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      >
        {isFav
          ? <SolidHeartIcon className="h-5 w-5 text-red-500" />
          : <OutlineHeartIcon className="h-5 w-5 text-gray-400 hover:text-red-500" />}
      </button>
    );
  };

  const sanitizedSearchInput = searchInput;

  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value);
    if (!value) return;
    if (selectedServiceId) {
      const selectedService = filterServices.find((service) => service.id === selectedServiceId);
      const matches = selectedService?.categories?.some(
        (categoryItem: any) =>
          categoryItem.categoryId === value || categoryItem.category?.id === value,
      );

      if (!matches) {
        setSelectedServiceId('');
      }
    }
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSelectedCategoryId('');
    setSelectedServiceId('');
    setSelectedCityId('');
    router.push('/search');
  };

  const hasAnyResults =
    searchCategories.length > 0 || searchServices.length > 0 || searchProviders.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8 rounded-3xl bg-white p-5 sm:p-8 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Resultados da busca</h1>
          <p className="mt-3 text-sm sm:text-base text-gray-600 wrap-break-word">
            Buscando: {sanitizedSearchInput || selectedCategoryId || selectedServiceId || selectedCityId ? (
              <>
                {sanitizedSearchInput && <span className="font-semibold">"Termo: {sanitizedSearchInput}"</span>}
                {selectedCategoryId && (
                  <>
                    {sanitizedSearchInput && ' - '}
                    <span className="font-semibold">Categoria "{categoryName}"</span>
                  </>
                )}
                {selectedServiceId && (
                  <>
                    {(sanitizedSearchInput || selectedCategoryId) && ' - '}
                    <span className="font-semibold">Serviço "{serviceName}"</span>
                  </>
                )}
                {selectedCityId && (
                  <>
                    {(sanitizedSearchInput || selectedCategoryId || selectedServiceId) && ' - '}
                    <span className="font-semibold">Cidade "{cityName}"</span>
                  </>
                )}
              </>
            ) : (
              <span className="font-semibold">Tudo</span>
            )}
          </p>

          <div className="mt-8 space-y-4">
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Pesquise por serviços, categorias, prestadores e cidades..."
                className="w-full rounded-full border border-gray-200 bg-white px-6 py-4 pl-12 pr-12 text-sm md:text-lg text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg
                  className="h-6 w-6 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  <svg
                    className="h-6 w-6 text-gray-400 hover:text-gray-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              <label className="block">
                <span className="sr-only">Categoria</span>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="block w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Todas as categorias</option>
                  {filterCategories
                    .filter((category) => category.isActive)
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </label>

              <label className="block">
                <span className="sr-only">Serviço</span>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  disabled={!selectedCategoryId}
                  className={`block w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 ${!selectedCategoryId ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <option value="">
                    {selectedCategoryId ? `Todos os serviços em ${categoryName}` : 'Selecione uma categoria primeiro'}
                  </option>
                  {relevantServices.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="sr-only">Cidade</span>
                <select
                  value={selectedCityId}
                  onChange={(e) => setSelectedCityId(e.target.value)}
                  disabled={!selectedServiceId}
                  className={`block w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 ${!selectedServiceId ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <option value="">
                    {selectedServiceId ? 'Cidade' : 'Selecione um serviço primeiro'}
                  </option>
                  {availableCities.length > 0 && (
                    <optgroup label="Disponível em:">
                      {availableCities.map((city: any) => (
                        <option key={city.id} value={city.id} className="text-green-700">
                          {city.name} - {city.state}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {unavailableCities.length > 0 && (
                    <optgroup label="Indisponível em:">
                      {unavailableCities.map((city: any) => (
                        <option key={city.id} value={city.id} disabled className="text-gray-400">
                          {city.name} - {city.state}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 items-center">
              {selectedCategoryId && (
                <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                  Categoria: {categoryName}
                </span>
              )}
              {selectedServiceId && (
                <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                  Serviço: {serviceName}
                </span>
              )}
              {selectedCityId && (
                <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                  Cidade: {cityName}
                </span>
              )}
              {(selectedCategoryId || selectedServiceId || selectedCityId) && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
              <div className="inline-flex items-center gap-3 text-gray-700">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                Carregando resultados...
              </div>
            </div>
          ) : error ? (
            <div className="rounded-3xl bg-red-50 p-8 text-center text-red-700 shadow-sm">
              {error}
            </div>
          ) : !hasAnyResults ? (
            <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
              <p className="text-gray-600">Nenhum resultado encontrado para essa busca.</p>
            </div>
          ) : (
            <div className="space-y-10">
              {/* Prestadores - só aparece quando há texto ou filtros */}
              {searchProviders.length > 0 && (
                <section>
                  <h2 className="mb-4 text-xl sm:text-2xl font-bold text-gray-900">
                    Prestadores ({searchProviders.length})
                  </h2>
                  <div className="grid gap-6 lg:grid-cols-2">
                    {searchProviders.map((item: any) => (
                      <div
                        key={`provider-${item.id}`}
                        onClick={() => { if (!isAuthenticated) { router.push('/login'); return; } router.push(`/provider/${item.id}`); }}
                        className="cursor-pointer rounded-3xl bg-white p-4 sm:p-6 shadow-sm transition-shadow hover:shadow-lg"
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs uppercase tracking-wide text-purple-700">
                            Prestador
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500">
                              {item.address === 'Somente Online'
                                ? 'Somente Online'
                                : (item.City || item.city)
                                ? `${(item.City || item.city).name} - ${(item.City || item.city).state}`
                                : item.cityName
                                ? `${item.cityName}${item.cityState ? ` - ${item.cityState}` : ''}`
                                : ''}
                            </span>
                            <HeartButton type="provider" id={item.id} />
                          </div>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4">
                          {(item.logoUrl || item.user?.avatarUrl) && (
                            <img
                              src={normalizeImageUrl(item.logoUrl || item.user?.avatarUrl) ?? undefined}
                              alt={item.user?.name}
                              className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-full object-cover"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base sm:text-xl font-semibold text-gray-900 truncate">
                              {item.user?.name}
                            </h3>
                            {item.description && (
                              <p className="mt-1 text-sm text-gray-600 line-clamp-2">{item.description}</p>
                            )}
                          </div>
                        </div>
                        {item.averageRating != null && item.averageRating > 0 ? (
                          <p className="mt-3 text-sm text-gray-500">
                            Avaliação: {item.averageRating.toFixed(1)} ⭐
                          </p>
                        ): (
                          <p className="mt-3 text-sm text-gray-500">
                            Ainda não avaliado
                          </p>
                        )}
                        {item.services && item.services.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.services.map((ps: any) => (
                              <span key={ps.serviceId} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                {ps.service?.name}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.customServiceNames && item.customServiceNames.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.customServiceNames.map((ps: any, key: number) => (
                              <span key={key} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                {ps}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Serviços */}
              {searchServices.length > 0 && (
                <section>
                  <h2 className="mb-4 text-xl sm:text-2xl font-bold text-gray-900">
                    Serviços ({searchServices.length})
                  </h2>
                  <div className="grid gap-6 lg:grid-cols-2">
                    {searchServices.map((item: any) => (
                      <div key={`service-${item.id}`} className="rounded-3xl bg-white p-4 sm:p-6 shadow-sm transition-shadow hover:shadow-lg">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs uppercase tracking-wide text-green-700">
                            Serviço
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500">
                              {item._count?.providers || 0} prestador(es)
                            </span>
                            <HeartButton type="service" id={item.id} />
                          </div>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          <Link href={`/service/${item.id}`}>{item.name}</Link>
                        </h3>
                        {item.description && <p className="mt-3 text-gray-600">{item.description}</p>}
                        {item.categories && item.categories.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.categories.map((sc: any) => (
                              <span key={sc.categoryId || sc.category?.id} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                {sc.category?.name || sc.categoryName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Categorias */}
              {searchCategories.length > 0 && (
                <section>
                  <h2 className="mb-4 text-xl sm:text-2xl font-bold text-gray-900">
                    Categorias ({searchCategories.length})
                  </h2>
                  <div className="grid gap-6 lg:grid-cols-2">
                    {searchCategories.map((item: any) => (
                      <div key={`category-${item.id}`} className="rounded-3xl bg-white p-4 sm:p-6 shadow-sm transition-shadow hover:shadow-lg">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs uppercase tracking-wide text-blue-700">
                            Categoria
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500">
                              {item.validServicesCount || item._count?.services || 0} serviço(s) disponível(eis)
                            </span>
                            <HeartButton type="category" id={item.id} />
                          </div>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          <Link href={`/category/${item.id}`}>{item.name}</Link>
                        </h3>
                        {item.description && <p className="mt-3 text-gray-600">{item.description}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}