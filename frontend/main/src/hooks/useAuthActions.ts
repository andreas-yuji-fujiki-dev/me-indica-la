'use client';

import { useAuth } from '@/context/AuthContext';

export const useAuthActions = () => {
  const { login, register, logout } = useAuth();
  return { login, register, logout };
};
