'use client';

import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { createClient } from '@/lib/supabase';
import { api } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);

  useEffect(() => {
    const supabase = createClient();

    async function restoreFromCookies(): Promise<boolean> {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      try {
        const res = await api.get<{ success: boolean; data: any }>('/auth/me');
        setSession(res.data, session.access_token, session.refresh_token);
        return true;
      } catch {
        return false;
      }
    }

    async function restoreFromTokens(): Promise<boolean> {
      const state = useAuthStore.getState();
      if (!state.accessToken) return false;

      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${state.accessToken}`,
          },
        });
        const data = await res.json();
        if (!res.ok || !data.success) return false;

        await supabase.auth.setSession({
          access_token: state.accessToken,
          refresh_token: state.refreshToken || '',
        });
        setSession(data.data, state.accessToken, state.refreshToken || '');
        return true;
      } catch {
        return false;
      }
    }

    async function checkSession() {
      const restored = await restoreFromCookies() || await restoreFromTokens();
      if (!restored) {
        clearSession();
      }
    }

    const scheduleCheck = () => {
      if (useAuthStore.persist.hasHydrated()) {
        checkSession();
      } else {
        const unsub = useAuthStore.persist.onFinishHydration(() => checkSession());
        return unsub;
      }
    };

    const cleanupSubscribe = scheduleCheck();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        try {
          const res = await api.get<{ success: boolean; data: any }>('/auth/me');
          setSession(res.data, session?.access_token || '', session?.refresh_token || '');
        } catch {
          clearSession();
        }
      } else if (event === 'SIGNED_OUT') {
        clearSession();
      }
    });

    return () => {
      subscription.unsubscribe();
      if (typeof cleanupSubscribe === 'function') cleanupSubscribe();
    };
  }, [setSession, clearSession]);

  return <>{children}</>;
}
