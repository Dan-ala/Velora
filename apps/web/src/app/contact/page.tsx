'use client';

import { useLocale } from '@/providers/locale-provider';
import { StaticPage } from '@/components/layout/static-page';
import { Mail, MapPin, Clock } from 'lucide-react';

export default function ContactPage() {
  const { t } = useLocale();
  return (
    <StaticPage title={t('footer.contact')}>
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <Mail size={20} className="mt-0.5 text-brand-gold" />
          <div>
            <p className="font-medium">{t('contact.email')}</p>
            <p className="text-sm text-brand-stone">{t('contact.emailAddress')}</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <MapPin size={20} className="mt-0.5 text-brand-gold" />
          <div>
            <p className="font-medium">{t('contact.location')}</p>
            <p className="text-sm text-brand-stone">{t('contact.locationValue')}</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <Clock size={20} className="mt-0.5 text-brand-gold" />
          <div>
            <p className="font-medium">{t('contact.hours')}</p>
            <p className="text-sm text-brand-stone">{t('contact.hoursValue')}</p>
          </div>
        </div>
      </div>
    </StaticPage>
  );
}
