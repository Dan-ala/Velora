'use client';

import { useLocale } from '@/providers/locale-provider';
import { StaticPage } from '@/components/layout/static-page';

export default function CareersPage() {
  const { t } = useLocale();
  return (
    <StaticPage title={t('footer.careers')}>
      <p className="text-brand-stone leading-relaxed">
        No open positions at the moment. Follow us on social media to stay updated.
      </p>
    </StaticPage>
  );
}
