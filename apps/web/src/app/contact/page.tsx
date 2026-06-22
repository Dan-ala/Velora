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
            <p className="font-medium">Email</p>
            <p className="text-sm text-brand-stone">hello@velorastore.cc</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <MapPin size={20} className="mt-0.5 text-brand-gold" />
          <div>
            <p className="font-medium">Location</p>
            <p className="text-sm text-brand-stone">Medellín, Colombia</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <Clock size={20} className="mt-0.5 text-brand-gold" />
          <div>
            <p className="font-medium">Hours</p>
            <p className="text-sm text-brand-stone">Mon–Fri, 9:00 AM – 6:00 PM</p>
          </div>
        </div>
      </div>
    </StaticPage>
  );
}
