'use client';

import { useLocale } from '@/providers/locale-provider';
import { StaticPage } from '@/components/layout/static-page';

const SIZES = [
  { size: 'S', chest: '91–96', waist: '76–81', length: '68–71' },
  { size: 'M', chest: '97–102', waist: '82–87', length: '72–75' },
  { size: 'L', chest: '103–108', waist: '88–93', length: '76–79' },
  { size: 'XL', chest: '109–114', waist: '94–99', length: '80–83' },
];

export default function SizeGuidePage() {
  const { t } = useLocale();
  return (
    <StaticPage title={t('footer.sizeGuide')}>
      <p className="text-sm text-brand-stone mb-6">{t('sizeGuide.measurementsNote')}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-ivory">
              <th className="py-3 text-left font-medium">{t('sizeGuide.size')}</th>
              <th className="py-3 text-left font-medium">{t('sizeGuide.chest')}</th>
              <th className="py-3 text-left font-medium">{t('sizeGuide.waist')}</th>
              <th className="py-3 text-left font-medium">{t('sizeGuide.length')}</th>
            </tr>
          </thead>
          <tbody>
            {SIZES.map((s) => (
              <tr key={s.size} className="border-b border-brand-ivory">
                <td className="py-3 font-medium">{s.size}</td>
                <td className="py-3 text-brand-stone">{s.chest}</td>
                <td className="py-3 text-brand-stone">{s.waist}</td>
                <td className="py-3 text-brand-stone">{s.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </StaticPage>
  );
}
