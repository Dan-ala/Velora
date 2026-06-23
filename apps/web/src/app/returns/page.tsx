'use client';

import { useLocale } from '@/providers/locale-provider';
import { StaticPage } from '@/components/layout/static-page';

export default function ReturnsPage() {
  const { t } = useLocale();
  return (
    <StaticPage title={t('footer.returns')}>
      <div className="space-y-4 text-sm text-brand-stone leading-relaxed">
        <p>{t('returns.p1')}</p>
        <p>{t('returns.p2')}</p>
        <p>{t('returns.p3')}</p>
      </div>
    </StaticPage>
  );
}
