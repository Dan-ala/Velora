'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@velora/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSession: (user: User, accessToken: string, refreshToken: string) => void;
  clearSession: () => void;
  setLoading: (isLoading: boolean) => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: true,
      setUser: (user) => set({ user, isLoading: false }),
      setSession: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isLoading: false }),
      clearSession: () =>
        set({ user: null, accessToken: null, refreshToken: null, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      isAuthenticated: () => get().user !== null,
      isAdmin: () => get().user?.role === 'admin',
    }),
    {
      name: 'velora-auth',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = true;
        }
      },
    },
  ),
);
