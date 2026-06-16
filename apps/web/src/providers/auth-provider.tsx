'use client';

import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { createClient } from '@/lib/supabase';
import { api } from '@/lib/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        try {
          const res = await api.get<{ success: boolean; data: any }>('/auth/me');
          setUser(res.data);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        try {
          const res = await api.get<{ success: boolean; data: any }>('/auth/me');
          setUser(res.data);
        } catch {
          setUser(null);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);

  return <>{children}</>;
}
