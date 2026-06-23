'use client';

import { useLocale } from '@/providers/locale-provider';
import { StaticPage } from '@/components/layout/static-page';

export default function CareersPage() {
  const { t } = useLocale();
  return (
    <StaticPage title={t('footer.careers')}>
      <p className="text-brand-stone leading-relaxed">{t('careers.noPositions')}</p>
    </StaticPage>
  );
}
