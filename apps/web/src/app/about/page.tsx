'use client';

import { useLocale } from '@/providers/locale-provider';
import { StaticPage } from '@/components/layout/static-page';

export default function AboutPage() {
  const { t } = useLocale();
  return (
    <StaticPage title={t('footer.about')}>
      <p className="text-brand-stone leading-relaxed">
        VELORA is a premium clothing brand born from the belief that what you wear should reflect who you are.
        Every piece is designed with intention, crafted with care, and built to last.
      </p>
    </StaticPage>
  );
}
