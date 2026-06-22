'use client';

import { useLocale } from '@/providers/locale-provider';
import { StaticPage } from '@/components/layout/static-page';

const FAQS = [
  { q: 'What payment methods do you accept?', a: 'We accept PSE, Bre-B, Nequi, credit/debit cards, and Bancolombia transfers.' },
  { q: 'How long does shipping take?', a: 'Orders are processed within 1–3 business days. Delivery takes 3–7 business days depending on your location.' },
  { q: 'What is your return policy?', a: 'You can return unworn items within 30 days of delivery for a full refund.' },
  { q: 'Do you ship internationally?', a: 'Currently we only ship within Colombia.' },
];

export default function FAQPage() {
  const { t } = useLocale();
  return (
    <StaticPage title={t('footer.faq')}>
      <div className="space-y-6">
        {FAQS.map((faq, i) => (
          <div key={i}>
            <h3 className="font-medium text-brand-black">{faq.q}</h3>
            <p className="mt-1 text-sm text-brand-stone leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </StaticPage>
  );
}
