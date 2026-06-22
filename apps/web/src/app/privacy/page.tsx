'use client';

import { useLocale } from '@/providers/locale-provider';
import { StaticPage } from '@/components/layout/static-page';

export default function PrivacyPage() {
  const { t } = useLocale();
  return (
    <StaticPage title={t('footer.privacy')}>
      <div className="space-y-4 text-sm text-brand-stone leading-relaxed">
        <p>Your privacy is important to us. We only collect information necessary to process your orders and improve your experience.</p>
        <p>We do not sell or share your personal data with third parties except for payment processing (Wompi) and shipping.</p>
        <p>By using this store, you agree to our data practices outlined here.</p>
      </div>
    </StaticPage>
  );
}
