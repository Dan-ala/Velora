'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/providers/locale-provider';

const FOOTER_SECTIONS = [
  {
    titleKey: 'footer.shop',
    links: [
      { labelKey: 'nav.newArrivals', href: '/products?sort=newest' },
      { labelKey: 'nav.shirts', href: '/products?category=shirts' },
      { labelKey: 'nav.hoodies', href: '/products?category=hoodies' },
      { labelKey: 'nav.shoes', href: '/products?category=shoes' },
    ],
  },
  {
    titleKey: 'footer.company',
    links: [
      { labelKey: 'footer.about', href: '/about' },
      { labelKey: 'footer.contact', href: '/contact' },
      { labelKey: 'footer.careers', href: '/careers' },
    ],
  },
  {
    titleKey: 'footer.support',
    links: [
      { labelKey: 'footer.faq', href: '/faq' },
      { labelKey: 'footer.shippingInfo', href: '/shipping' },
      { labelKey: 'footer.returns', href: '/returns' },
      { labelKey: 'footer.sizeGuide', href: '/size-guide' },
    ],
  },
  {
    titleKey: 'footer.legal',
    links: [
      { labelKey: 'footer.privacy', href: '/privacy' },
      { labelKey: 'footer.terms', href: '/terms' },
    ],
  },
];

export function Footer() {
  const { t } = useLocale();

  return (
    <footer className="bg-brand-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 tablet:px-6 wide:px-8">
        <div className="grid gap-12 tablet:grid-cols-2 desktop:grid-cols-5">
          <div className="desktop:col-span-1">
            <Link href="/" className="text-2xl font-display font-bold tracking-[0.3em]">
              VELORA
            </Link>
            <p className="mt-3 text-sm text-brand-stone">{t('footer.tagline')}</p>
            <p className="mt-1 text-xs text-brand-stone/60">
              {t('footer.description')}
            </p>
          </div>

          {FOOTER_SECTIONS.map((section) => (
            <div key={section.titleKey}>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-brand-gold">
                {t(section.titleKey)}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-brand-stone transition-colors hover:text-white"
                    >
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 border-t border-white/10 pt-8 text-center text-xs text-brand-stone/60">
          &copy; <span suppressHydrationWarning>{new Date().getFullYear()}</span> VELORA. {t('footer.allRights')}
        </div>
      </div>
    </footer>
  );
}
