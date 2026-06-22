'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';
import { useLocale } from '@/providers/locale-provider';
import { Home, ShoppingBag, Search, User, Grid3X3 } from 'lucide-react';

const NAV_ITEMS = [
  { labelKey: 'nav.home', href: '/', icon: Home },
  { labelKey: 'nav.categories', href: '/products', icon: Grid3X3 },
  { labelKey: 'nav.cart', href: '/cart', icon: ShoppingBag, isCart: true },
  { labelKey: 'nav.search', href: '/search', icon: Search },
  { labelKey: 'nav.profile', href: '/account', icon: User, requiresAuth: true },
];

export function BottomNav() {
  const { t } = useLocale();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const itemCount = useCartStore((s) => s.getItemCount());
  const isAuthenticated = useAuthStore((s) => s.user !== null);

  useEffect(() => { setMounted(true); }, []);

  const profileLink = mounted && isAuthenticated ? '/account' : '/auth/login';
  const profileLabel = mounted && isAuthenticated ? t('nav.myAccount') : t('nav.signIn');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-brand-ivory bg-white/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)] tablet:hidden">
      <div className="flex items-center justify-around py-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isCart = item.isCart;

          if (item.requiresAuth) {
            return (
              <Link
                key={item.href}
                href={profileLink}
                className="flex flex-col items-center gap-0.5 px-3"
              >
                <Icon size={20} className={profileLink === '/account' ? 'text-brand-black' : 'text-brand-stone'} />
                <span className="text-[10px] text-brand-stone">{profileLabel}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-0.5 px-3"
            >
              <div className="relative">
                <Icon
                  size={20}
                  className={isActive ? 'text-brand-black' : 'text-brand-stone'}
                />
                <span className={`absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-black text-[8px] font-bold text-white transition-opacity ${isCart && mounted && itemCount > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  {mounted ? (itemCount > 9 ? '9+' : itemCount) : 0}
                </span>
              </div>
              <span
                className={`text-[10px] ${isActive ? 'font-medium text-brand-black' : 'text-brand-stone'}`}
              >
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
