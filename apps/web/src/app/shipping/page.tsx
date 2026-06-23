'use client';

import { useLocale } from '@/providers/locale-provider';
import { StaticPage } from '@/components/layout/static-page';

export default function ShippingPage() {
  const { t } = useLocale();
  return (
    <StaticPage title={t('footer.shippingInfo')}>
      <div className="space-y-4 text-sm text-brand-stone leading-relaxed">
        <p>{t('shipping.p1')}</p>
        <p>{t('shipping.p2')}</p>
        <p>{t('shipping.p3')}</p>
        <p>{t('shipping.p4')}</p>
      </div>
    </StaticPage>
  );
}
