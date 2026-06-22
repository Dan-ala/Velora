'use client';

import { useLocale } from '@/providers/locale-provider';
import { StaticPage } from '@/components/layout/static-page';

export default function ShippingPage() {
  const { t } = useLocale();
  return (
    <StaticPage title={t('footer.shippingInfo')}>
      <div className="space-y-4 text-sm text-brand-stone leading-relaxed">
        <p>Free shipping on all orders over $200,000 COP.</p>
        <p>Orders are processed within 1–3 business days after payment confirmation.</p>
        <p>Delivery times: 3–7 business days for most locations in Colombia.</p>
        <p>You will receive a tracking number once your order ships.</p>
      </div>
    </StaticPage>
  );
}
