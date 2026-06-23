'use client';

import { useLocale } from '@/providers/locale-provider';
import { StaticPage } from '@/components/layout/static-page';

export default function PrivacyPage() {
  const { t } = useLocale();
  return (
    <StaticPage title={t('footer.privacy')}>
      <div className="space-y-4 text-sm text-brand-stone leading-relaxed">
        <p>{t('privacy.p1')}</p>
        <p>{t('privacy.p2')}</p>
        <p>{t('privacy.p3')}</p>
      </div>
    </StaticPage>
  );
}
