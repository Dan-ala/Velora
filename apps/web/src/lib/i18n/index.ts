import { en } from './en';
import { es } from './es';
import type { Locale, Translations } from './types';

const translations: Record<Locale, Translations> = { en, es };

function getNestedValue(obj: Translations, path: string): string | Translations {
  const keys = path.split('.');
  let result: Translations | string = obj;
  for (const key of keys) {
    if (typeof result === 'object' && result !== null && key in result) {
      result = (result as Translations)[key];
    } else {
      return path;
    }
  }
  return result;
}

export function t(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const value = getNestedValue(translations[locale], key);
  let text = typeof value === 'string' ? value : key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

export type { Locale, Translations };
