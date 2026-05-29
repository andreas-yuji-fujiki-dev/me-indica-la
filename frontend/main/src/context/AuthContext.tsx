'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AuthAPI } from '@/services/api';
import { DEFAULT_CURRENCY } from '@/config/api';

interface User {
  id: string;
  email: string;
  name: string;
  slug: string;
  avatarUrl: string | null;
  role: string;
  isActive: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currency: typeof DEFAULT_CURRENCY;
  favorites: any[];
}

interface AuthActions {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: {
    email: string;
    password: string;
    name: string;
    slug: string;
    phone?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

type AuthContextValue = AuthState & AuthActions;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [favorites, setFavorites] = useState<any[]>([]);

  const loadUser = useCallback(async () => {
    try {
      const response = await AuthAPI.getMe();
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await AuthAPI.login(email, password);
        const { accessToken, refreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        await loadUser();
        return { success: true };
      } catch (error: any) {
        return {
          success: false,
          error: error.response?.data?.message || error.message || 'Authentication failed',
        };
      }
    },
    [loadUser],
  );

  const register = useCallback(
    async (userData: {
      email: string;
      password: string;
      name: string;
      slug: string;
      phone?: string;
    }) => {
      try {
        await AuthAPI.register(userData);
        return await login(userData.email, userData.password);
      } catch (error: any) {
        console.error('Registration error:', error);
        return {
          success: false,
          error: error.response?.data?.message || error.message || 'Registration failed',
        };
      }
    },
    [login],
  );

  const logout = useCallback(async () => {
    try {
      await AuthAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setIsAuthenticated(false);
      setFavorites([]);
      router.push('/');
    }
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      currency,
      favorites,
      login,
      register,
      logout,
      refreshUser: loadUser,
    }),
    [user, isAuthenticated, isLoading, currency, favorites, login, register, logout, loadUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};