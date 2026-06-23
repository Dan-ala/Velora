'use client';

import { useLocale } from '@/providers/locale-provider';
import { StaticPage } from '@/components/layout/static-page';

export default function TermsPage() {
  const { t } = useLocale();
  return (
    <StaticPage title={t('footer.terms')}>
      <div className="space-y-4 text-sm text-brand-stone leading-relaxed">
        <p>{t('terms.p1')}</p>
        <p>{t('terms.p2')}</p>
        <p>{t('terms.p3')}</p>
        <p>{t('terms.p4')}</p>
      </div>
    </StaticPage>
  );
}
