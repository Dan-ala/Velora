'use client';

import { useLocale } from '@/providers/locale-provider';
import { Globe } from 'lucide-react';

export function LocaleSwitcher() {
  const { locale, setLocale, t } = useLocale();

  return (
    <button
      onClick={() => setLocale(locale === 'en' ? 'es' : 'en')}
      className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-brand-stone transition-colors hover:text-brand-gold"
      aria-label={t('locale.switchTo')}
    >
      <Globe size={14} />
      <span className="hidden tablet:inline">{t(`locale.${locale}`)}</span>
      <span className="tablet:hidden">{locale === 'en' ? 'EN' : 'ES'}</span>
    </button>
  );
}
