// API Configuration
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1';

// Server-side: usa URL interna do Docker (evita passar pelo Nginx)
export const SERVER_API_BASE_URL =
  process.env.INTERNAL_API_URL || API_BASE_URL;
export const API_TIMEOUT = 5000;

// Endpoint paths
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    me: '/auth/me',
    logout: '/auth/logout',
  },
  categories: {
    list: '/category',
    featured: '/category/featured',
    byId: (id: string) => `/category/${id}`,
    bySlug: (slug: string) => `/category/slug/${slug}`,
    services: (id: string) => `/category/${id}/services`,
  },
  services: {
    list: '/service',
    featured: '/service/featured',
    mostWanted: '/service/most-wanted',
    byId: (id: string) => `/service/${id}`,
    bySlug: (slug: string) => `/service/slug/${slug}`,
  },
  providers: {
    list: '/provider',
    featured: '/provider/featured',
    nearby: (cityId: string) => `/provider/nearby/${cityId}`,
    byId: (id: string) => `/provider/${id}`,
    bySlug: (slug: string) => `/provider/slug/${slug}`,
  },
  cities: {
    list: '/city',
    byState: (state: string) => `/city/state/${state}`,
    byId: (id: string) => `/city/${id}`,
    bySlug: (slug: string) => `/city/slug/${slug}`,
  },
  favorites: {
    provider: {
      add: (userId: string, providerId: string) => `/favorite/provider/${userId}/${providerId}`,
      remove: (userId: string, providerId: string) => `/favorite/provider/${userId}/${providerId}`,
      list: (userId: string) => `/favorite/provider/${userId}`,
      check: (userId: string, providerId: string) => `/favorite/provider/${userId}/check/${providerId}`,
    },
    service: {
      add: (userId: string, serviceId: string) => `/favorite/service/${userId}/${serviceId}`,
      remove: (userId: string, serviceId: string) => `/favorite/service/${userId}/${serviceId}`,
      list: (userId: string) => `/favorite/service/${userId}`,
      check: (userId: string, serviceId: string) => `/favorite/service/${userId}/check/${serviceId}`,
    },
  },
  search: {
    main: '/search',
    autocomplete: '/search/autocomplete',
  },
};

// Currency options
export const CURRENCY_OPTIONS = [
  { value: 'BRL', label: 'R$ (BRL)', symbol: 'R$' },
  { value: 'USD', label: '$ (USD)', symbol: '$' },
  { value: 'EUR', label: '€ (EUR)', symbol: '€' },
  { value: 'GBP', label: '£ (GBP)', symbol: '£' },
];

// Default currency
export const DEFAULT_CURRENCY = CURRENCY_OPTIONS[0];