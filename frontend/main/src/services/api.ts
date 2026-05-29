import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '@/config/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add authorization token if available
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Add CSRF token if available
    const csrfToken = localStorage.getItem('csrfToken');
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          // Store new tokens
          localStorage.setItem('accessToken', response.data.accessToken);
          localStorage.setItem('refreshToken', response.data.refreshToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // Clear tokens and redirect to login if refresh fails
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const AuthAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (userData: {
    email: string;
    password: string;
    name: string;
    slug: string;
    phone?: string;
  }) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),

  logout: () => api.post('/auth/logout'),

  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
};

// Category API
export const CategoryAPI = {
  getAll: (params?: { page?: number; limit?: number; search?: string; isActive?: string; isFeatured?: string }) =>
    api.get('/category', { params }),
  getFeatured: () => api.get('/category/featured'),
  getById: (id: string) => api.get(`/category/${id}`),
  getBySlug: (slug: string) => api.get(`/category/slug/${slug}`),
  getServicesByCategory: (categoryId: string, params?: { page?: number; limit?: number; search?: string }) =>
    api.get(`/category/${categoryId}/services`, { params }),
  create: (data: { name: string; slug: string; description?: string }) => api.post('/category', data),
  update: (id: string, data: any) => api.patch(`/category/${id}`, data),
  remove: (id: string) => api.delete(`/category/${id}`),
};

// Service API
export const ServiceAPI = {
  getAll: (filters?: {
    hasActiveProviders?: boolean;
    categoryId?: string;
    page?: number;
    limit?: number;
  }) => api.get('/service', {
    params: {
      hasActiveProviders: filters?.hasActiveProviders ? 'true' : undefined,
      categoryId: filters?.categoryId || undefined,
      page: filters?.page || undefined,
      limit: filters?.limit || undefined,
      },
    }),
  getFeatured: () => api.get('/service/featured'),
  getMostWanted: () => api.get('/service/most-wanted'),
  getById: (id: string) => api.get(`/service/${id}`),
  getBySlug: (slug: string) => api.get(`/service/slug/${slug}`),
  getProviders: (id: string, params?: { page?: number; limit?: number }) =>
    api.get(`/service/${id}/providers`, { params }),
  create: (data: { name: string; slug: string; description?: string; keywords?: string[]; categoryIds?: string[] }) => api.post('/service', data),
  update: (id: string, data: any) => api.patch(`/service/${id}`, data),
  remove: (id: string) => api.delete(`/service/${id}`),
};

// Provider API
export const ProviderAPI = {
  getAll: (params?: { page?: number; limit?: number; search?: string; [key: string]: any }) =>
    api.get('/provider', { params }),
  getFeatured: () => api.get('/provider/featured'),
  getNearby: (cityId: string) => api.get(`/provider/nearby/${cityId}`),
  getById: (id: string) => api.get(`/provider/${id}`),
  getBySlug: (slug: string) => api.get(`/provider/slug/${slug}`),
  getByUserId: (userId: string) => api.get(`/provider/user/${userId}`),
  create: (data: any) => api.post('/provider', data),
  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/provider/upload/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadBanner: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/provider/upload/banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadGalleryImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/provider/upload/gallery', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (id: string, data: any) => api.patch(`/provider/${id}`, data),
  approve: (id: string) => api.patch(`/provider/${id}/approve`),
  reject: (id: string, reason?: string) => api.patch(`/provider/${id}/reject`, { reason }),
  remove: (id: string) => api.delete(`/provider/${id}`),
};

// City API
export const CityAPI = {
  getAll: (params?: { page?: number; limit?: number; search?: string; isActive?: string; state?: string }) =>
    api.get('/city', { params }),
  getByState: (state: string) => api.get(`/city/state/${state}`),
  getById: (id: string) => api.get(`/city/${id}`),
  getBySlug: (slug: string) => api.get(`/city/slug/${slug}`),
  create: (data: { name: string; state: string; slug: string }) => api.post('/city', data),
  update: (id: string, data: any) => api.patch(`/city/${id}`, data),
  remove: (id: string) => api.delete(`/city/${id}`),
};

// Favorite API
export const FavoriteAPI = {
  // Provider favorites
  addProviderFavorite: (userId: string, providerId: string) =>
    api.post(`/favorite/provider/${userId}/${providerId}`),
  removeProviderFavorite: (userId: string, providerId: string) =>
    api.delete(`/favorite/provider/${userId}/${providerId}`),
  getProviderFavorites: (userId: string) =>
    api.get(`/favorite/provider/${userId}`),
  checkProviderFavorite: (userId: string, providerId: string) =>
    api.get(`/favorite/provider/${userId}/check/${providerId}`),

  // Service favorites
  addServiceFavorite: (userId: string, serviceId: string) =>
    api.post(`/favorite/service/${userId}/${serviceId}`),
  removeServiceFavorite: (userId: string, serviceId: string) =>
    api.delete(`/favorite/service/${userId}/${serviceId}`),
  getServiceFavorites: (userId: string) =>
    api.get(`/favorite/service/${userId}`),
  checkServiceFavorite: (userId: string, serviceId: string) =>
    api.get(`/favorite/service/${userId}/check/${serviceId}`),

  // Category favorites
  addCategoryFavorite: (userId: string, categoryId: string) =>
    api.post(`/favorite/category/${userId}/${categoryId}`),
  removeCategoryFavorite: (userId: string, categoryId: string) =>
    api.delete(`/favorite/category/${userId}/${categoryId}`),
  getCategoryFavorites: (userId: string) =>
    api.get(`/favorite/category/${userId}`),
  checkCategoryFavorite: (userId: string, categoryId: string) =>
    api.get(`/favorite/category/${userId}/check/${categoryId}`),
};

// User API
export const UserAPI = {
  getById: (id: string) => api.get(`/user/${id}`),
  update: (id: string, data: { name?: string; avatarUrl?: string }) => api.patch(`/user/${id}`, data),
  uploadAvatar: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/user/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id: string) => api.delete(`/user/${id}`),
};

// Review API
export const ReviewAPI = {
  create: (data: { providerId: string; userId?: string; authorName?: string; rating: number; comment?: string }) =>
    api.post('/review', data),
  getPending: (page = 1, limit = 20) =>
    api.get('/review', { params: { isApproved: false, page, limit } }),
  getByProvider: (providerId: string, page = 1, limit = 50) =>
    api.get('/review', { params: { providerId, page, limit } }),
  approve: (id: string) => api.patch(`/review/${id}/approve`),
  reject: (id: string) => api.patch(`/review/${id}/reject`),
  delete: (id: string) => api.delete(`/review/${id}`),
};

// Provider Edit Request API
export const ProviderEditRequestAPI = {
  create: (data: any) => api.post('/provider-edit-request', data),
  getPending: (providerId: string) => api.get(`/provider-edit-request/provider/${providerId}/pending`),
  cancel: (id: string) => api.delete(`/provider-edit-request/${id}`),
  approve: (id: string) => api.patch(`/provider-edit-request/${id}/approve`),
  reject: (id: string) => api.patch(`/provider-edit-request/${id}/reject`),
};

// Search API
export const SearchAPI = {
  search: (
    query: string,
    filters?: {
      page?: number;
      limit?: number;
      serviceId?: string;
      cityId?: string;
      categoryId?: string;
    },
  ) =>
    api.get('/search', {
      params: {
        q: query,
        page: filters?.page ?? 1,
        limit: filters?.limit ?? 10,
        serviceId: filters?.serviceId,
        cityId: filters?.cityId,
        categoryId: filters?.categoryId,
      },
    }),
  autocomplete: (query: string) =>
    api.get('/search/autocomplete', { params: { q: query } }),
};

// Export the main api instance
export default api;