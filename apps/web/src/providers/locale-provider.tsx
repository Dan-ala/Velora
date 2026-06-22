'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Locale } from '@/lib/i18n/types';
import { t } from '@/lib/i18n';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const STORAGE_KEY = 'velora-locale';
const MANUAL_COOKIE = 'velora-locale-manual';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string): void {
  document.cookie = `${name}=${value};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
}

function getInitialLocale(): Locale {
  return 'es';
}

function detectBrowserLocale(): Locale {
  if (typeof window === 'undefined') return 'es';

  const geo = getCookie(STORAGE_KEY);
  if (geo === 'en' || geo === 'es') return geo;

  const browserLang = navigator.language.split('-')[0];
  if (browserLang === 'en') return 'en';
  return 'es';
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    document.documentElement.lang = locale === 'en' ? 'en' : 'es-CO';
  }, [locale]);

  useEffect(() => {
    const detected = detectBrowserLocale();
    if (detected !== locale) {
      setLocaleState(detected);
      localStorage.setItem(STORAGE_KEY, detected);
      setCookie(STORAGE_KEY, detected);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
    setCookie(MANUAL_COOKIE, 'true');
    setCookie(STORAGE_KEY, newLocale);
  };

  const translate = (key: string, params?: Record<string, string | number>) => t(locale, key, params);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: translate }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
