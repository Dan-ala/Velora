'use client';

import { useLocale } from '@/providers/locale-provider';
import { StaticPage } from '@/components/layout/static-page';

export default function TermsPage() {
  const { t } = useLocale();
  return (
    <StaticPage title={t('footer.terms')}>
      <div className="space-y-4 text-sm text-brand-stone leading-relaxed">
        <p>All prices are in Colombian Pesos (COP) and include applicable taxes.</p>
        <p>By placing an order, you agree to pay the total amount shown at checkout.</p>
        <p>We reserve the right to cancel any order due to stock unavailability or pricing errors.</p>
        <p>For questions, contact hello@velorastore.cc.</p>
      </div>
    </StaticPage>
  );
}
