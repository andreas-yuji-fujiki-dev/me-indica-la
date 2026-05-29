'use client';

import { useState, useEffect, useCallback } from 'react';
import { CategoryAPI, ServiceAPI, CityAPI, SearchAPI, FavoriteAPI } from '@/services/api';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon, HeartIcon as OutlineHeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as SolidHeartIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  imageUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  _count?: {
    services: number;
    validServices?: number;
  };
  validServicesCount?: number;
  keywords?: string[];
}

interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  isFeatured: boolean;
  isMostWanted: boolean;
  categories?: Array<{
    categoryId: string;
    category?: Category;
  }>;
}

interface City {
  id: string;
  name: string;
  slug: string;
  state: string;
  isActive: boolean;
}

const retryWithDelay = async (fn: () => Promise<any>, maxRetries = 0, delay = 500): Promise<any> => {
  try {
    return await fn();
  } catch (error: any) {
    if (maxRetries <= 0 || error.response) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithDelay(fn, maxRetries - 1, delay);
  }
};

export default function HomeClient() {
  const { isAuthenticated, user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [availableCities, setAvailableCities] = useState<City[]>([]);
  const [unavailableCities, setUnavailableCities] = useState<City[]>([]);
  const [visibleCategories, setVisibleCategories] = useState<Category[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [favoriteCategories, setFavoriteCategories] = useState<Set<string>>(new Set());
  const PAGE_SIZE = 10;
  const router = useRouter();

  useEffect(() => {
    const fetchFavoriteCategories = async () => {
      if (!isAuthenticated || !user) return;
      try {
        const response = await FavoriteAPI.getCategoryFavorites(user.id);
        const favorites = response.data.data || [];
        const favoriteIds = new Set<string>(favorites.map((fav: any) => fav.id));
        setFavoriteCategories(favoriteIds);
      } catch (error) {
        console.error('Error fetching favorite categories:', error);
      }
    };

    fetchFavoriteCategories();
  }, [isAuthenticated, user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse, servicesResponse, citiesResponse] = await Promise.all([
          retryWithDelay(() => CategoryAPI.getAll()),
          retryWithDelay(() => ServiceAPI.getAll({ hasActiveProviders: true })),
          retryWithDelay(() => CityAPI.getAll()),
        ]);

        setCategories(categoriesResponse.data.data || []);
        setServices(servicesResponse.data.data || []);
        setCities(citiesResponse.data.data || []);
      } catch (error) {
        console.error('Error fetching search filter data:', error);
        setCategories([]);
        setServices([]);
        setCities([]);
      }
    };

    fetchData();
  }, []);

  const fetchValidCategories = useCallback(async () => {
    try {
      const response = await SearchAPI.search('', { page: 1, limit: 100 });
      const fetched: Category[] = response.data.categories?.data || [];
      const filtered = fetched.filter((c) => (c._count?.services || 0) > 0);
      setVisibleCategories(
        filtered.length > 0
          ? filtered
          : categories.filter((c) => c.isActive && (c._count?.services || 0) > 0),
      );
    } catch {
      setVisibleCategories(categories.filter((c) => c.isActive && (c._count?.services || 0) > 0));
    }
  }, [categories]);

  useEffect(() => {
    if (categories.length > 0) {
      fetchValidCategories();
    }
  }, [fetchValidCategories, categories]);

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
            limit: 100,
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
        const unavailable = allCitiesData.filter((city: City) => {
          return !available.some((availableCity: City) => availableCity.id === city.id);
        });

        setAvailableCities(available);
        setUnavailableCities(unavailable);
      } catch (error) {
        console.error('Erro ao buscar cidades disponíveis:', error);
        setAvailableCities([]);
        setUnavailableCities([]);
      }
    };

    fetchAvailableCities();
  }, [selectedCategoryId, selectedServiceId, cities]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery && !selectedCategoryId && !selectedServiceId && !selectedCityId) {
      return;
    }

    const params = new URLSearchParams();
    if (trimmedQuery) params.set('q', trimmedQuery);
    if (selectedCategoryId) params.set('categoryId', selectedCategoryId);
    if (selectedServiceId) params.set('serviceId', selectedServiceId);
    if (selectedCityId) params.set('cityId', selectedCityId);

    router.push(`/search?${params.toString()}`);
  };

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/category/${categoryId}`);
  };

  const toggleFavorite = async (categoryId: string) => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    try {
      const isFavorite = favoriteCategories.has(categoryId);

      if (isFavorite) {
        await FavoriteAPI.removeCategoryFavorite(user.id, categoryId);
        setFavoriteCategories((prev) => {
          const newSet = new Set(prev);
          newSet.delete(categoryId);
          return newSet;
        });
      } else {
        await FavoriteAPI.addCategoryFavorite(user.id, categoryId);
        setFavoriteCategories((prev) => {
          const newSet = new Set(prev);
          newSet.add(categoryId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const filteredCategories = categorySearchQuery.trim()
    ? visibleCategories.filter((category) => {
        const query = categorySearchQuery.trim().toLowerCase();
        const matchesNameOrDescription =
          category.name?.toLowerCase().includes(query) ||
          category.description?.toLowerCase().includes(query);

        const matchesKeywords = Array.isArray(category.keywords)
          ? category.keywords.some((keyword: string) => keyword.toLowerCase().includes(query))
          : false;

        return matchesNameOrDescription || matchesKeywords;
      })
    : visibleCategories;

  useEffect(() => {
    setCurrentPage(1);
  }, [categorySearchQuery]);

  const totalPages = Math.ceil(filteredCategories.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 py-10 sm:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
            Do que você precisa?
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto">
            Encontre os melhores prestadores de serviço
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <form onSubmit={handleSearch}>
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={() => router.push('/search')}
                  className="bg-blue-500 px-5 py-1.5 rounded-full text-sm font-medium text-white hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Ver tudo &gt;
                </button>
              </div>
              <div className="relative mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquise por serviços, categorias e cidades..."
                  className="w-full px-6 py-3 sm:py-4 text-sm md:text-base sm:text-lg border-2 border-gray-200 rounded-full focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 pl-12 pr-16 text-black"
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
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-12 pr-4 flex items-center"
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
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors"
                >
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="sr-only">Categoria</span>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => {
                      const newCategoryId = e.target.value;
                      setSelectedCategoryId(newCategoryId);

                      if (newCategoryId && selectedServiceId) {
                        const serviceMatchesCategory = services.some((service) => {
                          if (service.id !== selectedServiceId) return false;
                          return service.categories?.some(
                            (categoryItem: any) =>
                              categoryItem.categoryId === newCategoryId ||
                              categoryItem.category?.id === newCategoryId,
                          );
                        });

                        if (!serviceMatchesCategory) {
                          setSelectedServiceId('');
                        }
                      }
                    }}
                    className="block w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Todas as categorias</option>
                    {categories
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
                      {selectedCategoryId
                        ? `Todos os serviços em ${categories.find((cat) => cat.id === selectedCategoryId)?.name || ''}`
                        : 'Selecione uma categoria primeiro'}
                    </option>
                    {services
                      .filter((service) => {
                        if (!service.isActive) return false;
                        if (!selectedCategoryId) return true;
                        return service.categories?.some(
                          (categoryItem: any) =>
                            categoryItem.categoryId === selectedCategoryId ||
                            categoryItem.category?.id === selectedCategoryId,
                        );
                      })
                      .map((service) => (
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
                        {availableCities.map((city: City) => (
                          <option key={city.id} value={city.id} className="text-green-700">
                            {city.name} - {city.state}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {unavailableCities.length > 0 && (
                      <optgroup label="Indisponível em:">
                        {unavailableCities.map((city: City) => (
                          <option key={city.id} value={city.id} disabled className="text-gray-400">
                            {city.name} - {city.state}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </label>
              </div>

              {(selectedCategoryId || selectedServiceId || selectedCityId) && (
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId('');
                      setSelectedServiceId('');
                      setSelectedCityId('');
                    }}
                    className="rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
                  >
                    Limpar filtros
                  </button>
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    Pesquisar
                    <svg
                      className="h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Banner */}
          <div className="bg-white rounded-lg shadow-lg p-5 sm:p-6 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 text-left">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Me Indica Lá</h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  O guia digital que conecta você aos melhores prestadores de serviço na sua região.
                  Encontre, avalie e contrate profissionais qualificados com facilidade.
                </p>
              </div>
              <div className="hidden sm:block shrink-0">
                <Image
                  src="/banner-image.svg"
                  alt="Pessoa usando o aplicativo"
                  width={200}
                  height={150}
                  className="rounded-lg"
                  style={{ height: 'auto' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Ad carousel — full width, outside max-w container */}
        <div className="mt-8 overflow-hidden w-full">
          <div className="flex gap-4 animate-marquee whitespace-nowrap">
            {[...Array(6), ...Array(6)].map((_, i) => (
              <div
                key={i}
                className="inline-flex shrink-0 w-56 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-blue-200 bg-white/80 px-4 py-4 text-center shadow-sm"
              >
                <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-400">Publicidade</span>
                <p className="text-xs font-medium text-gray-700 leading-snug whitespace-normal">
                  Anuncie sua empresa aqui com a <span className="font-bold text-blue-600">MIL</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Categorias</h2>
            <div className="relative w-full md:w-80">
              <label htmlFor="category-search" className="sr-only">Buscar categorias</label>
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                id="category-search"
                type="text"
                value={categorySearchQuery}
                onChange={(e) => setCategorySearchQuery(e.target.value)}
                placeholder="Buscar categoria..."
                className="w-full rounded-full border border-gray-300 bg-white pl-12 pr-4 py-3 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {filteredCategories.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
                <span>{filteredCategories.length} categorias no total</span>
                <span>Página {currentPage} de {totalPages}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {paginatedCategories.map((category) => {
                  const isFavorite = favoriteCategories.has(category.id);
                  return (
                    <div
                      key={category.id}
                      onClick={() => handleCategoryClick(category.id)}
                      className="group cursor-pointer bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 relative"
                    >
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {category.name}
                        </h3>
                        <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                          {category.description || 'Sem descrição disponível.'}
                        </p>
                        <p className="mt-4 text-sm text-gray-500">
                          {category.validServicesCount || category._count?.services || 0} serviços disponíveis
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(category.id);
                        }}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                        aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                      >
                        {isFavorite ? (
                          <SolidHeartIcon className="h-6 w-6 text-red-500" />
                        ) : (
                          <OutlineHeartIcon className="h-6 w-6 text-gray-400 hover:text-red-500" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                    Anterior
                  </button>

                  <div className="flex gap-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => {
                            setCurrentPage(pageNum);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`w-10 h-10 rounded-lg transition-colors ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    Próximo
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhuma categoria encontrada</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
