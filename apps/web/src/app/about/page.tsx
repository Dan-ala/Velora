'use client';

import { useLocale } from '@/providers/locale-provider';
import { StaticPage } from '@/components/layout/static-page';

export default function AboutPage() {
  const { t } = useLocale();
  return (
    <StaticPage title={t('footer.about')}>
      <p className="text-brand-stone leading-relaxed">{t('about.description')}</p>
    </StaticPage>
  );
}
