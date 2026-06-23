'use client';

import { useLocale } from '@/providers/locale-provider';
import { StaticPage } from '@/components/layout/static-page';

const FAQ_KEYS = [
  { q: 'faq.paymentQ', a: 'faq.paymentA' },
  { q: 'faq.shippingQ', a: 'faq.shippingA' },
  { q: 'faq.returnsQ', a: 'faq.returnsA' },
  { q: 'faq.internationalQ', a: 'faq.internationalA' },
];

export default function FAQPage() {
  const { t } = useLocale();
  return (
    <StaticPage title={t('footer.faq')}>
      <div className="space-y-6">
        {FAQ_KEYS.map((faq, i) => (
          <div key={i}>
            <h3 className="font-medium text-brand-black">{t(faq.q)}</h3>
            <p className="mt-1 text-sm text-brand-stone leading-relaxed">{t(faq.a)}</p>
          </div>
        ))}
      </div>
    </StaticPage>
  );
}
