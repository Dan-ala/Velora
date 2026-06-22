'use client';

import { useLocale } from '@/providers/locale-provider';
import { StaticPage } from '@/components/layout/static-page';

export default function ReturnsPage() {
  const { t } = useLocale();
  return (
    <StaticPage title={t('footer.returns')}>
      <div className="space-y-4 text-sm text-brand-stone leading-relaxed">
        <p>You have 30 days from delivery to return unworn items in original condition.</p>
        <p>To start a return, contact us at hello@velorastore.cc with your order number.</p>
        <p>Refunds are processed within 5–7 business days after we receive the returned item.</p>
      </div>
    </StaticPage>
  );
}
