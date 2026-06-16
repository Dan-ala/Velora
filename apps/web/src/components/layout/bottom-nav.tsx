'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';
import { Home, ShoppingBag, Search, User, Grid3X3 } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Categories', href: '/products', icon: Grid3X3 },
  { label: 'Cart', href: '/cart', icon: ShoppingBag, isCart: true },
  { label: 'Search', href: '/search', icon: Search },
  { label: 'Profile', href: '/account', icon: User, requiresAuth: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const itemCount = useCartStore((s) => s.getItemCount());
  const isAuthenticated = useAuthStore((s) => s.user !== null);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-brand-ivory bg-white/95 backdrop-blur-sm tablet:hidden">
      <div className="flex items-center justify-around py-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isCart = item.isCart;

          if (item.requiresAuth && !isAuthenticated) {
            return (
              <Link
                key={item.href}
                href="/auth/login"
                className="flex flex-col items-center gap-0.5 px-3"
              >
                <Icon size={20} className="text-brand-stone" />
                <span className="text-[10px] text-brand-stone">{item.label}</span>
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
                {isCart && itemCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-black text-[8px] font-bold text-white">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] ${isActive ? 'font-medium text-brand-black' : 'text-brand-stone'}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
