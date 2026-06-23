'use client';

import Link from 'next/link';
import { ShoppingBag, User, Menu, X, Search } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from '@/providers/locale-provider';
import { LocaleSwitcher } from './locale-switcher';

const NAV_ITEMS = [
  { label: 'nav.newArrivals', href: '/products?sort=newest' },
  { label: 'nav.camisetas', href: '/products?category=camisetas' },
  { label: 'nav.buzos', href: '/products?category=buzos' },
  { label: 'nav.zapatos', href: '/products?category=zapatos' },
];

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useLocale();
  const itemCount = useCartStore((s) => s.getItemCount());
  const openCart = useCartStore((s) => s.openCart);
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin);

  useEffect(() => { setMounted(true); }, []);

  return (
    <header className="sticky top-0 z-50 bg-brand-black/95 backdrop-blur-sm text-white">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 tablet:px-6 wide:px-8">
        <button
          className="flex items-center gap-2 tablet:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={t('nav.toggleMenu')}
        >
          {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="hidden items-center gap-8 tablet:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm uppercase tracking-widest text-brand-stone transition-colors hover:text-white"
            >
              {t(item.label)}
            </Link>
          ))}
        </div>

        <Link href="/" className="text-xl font-display font-bold tracking-[0.3em]">
          VELORA
        </Link>

        <div className="flex items-center gap-4">
          <LocaleSwitcher />

          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="transition-colors hover:text-brand-gold"
            aria-label={t('nav.search')}
          >
            <Search size={20} />
          </button>

          <Link
            href={mounted && user ? '/account' : '/auth/login'}
            className="hidden transition-colors hover:text-brand-gold tablet:block"
            aria-label={t('nav.myAccount')}
          >
            <User size={20} />
          </Link>

          {mounted && isAdmin() && (
            <Link
              href="/admin"
              className="hidden text-xs uppercase tracking-widest text-brand-gold transition-colors hover:text-white tablet:block"
            >
              {t('nav.admin')}
            </Link>
          )}

          <button
            onClick={openCart}
            className="relative transition-colors hover:text-brand-gold"
            aria-label={t('nav.cart')}
          >
            <ShoppingBag size={20} />
            <span className={`absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-gold text-[10px] font-bold text-brand-black transition-opacity ${mounted && itemCount > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              {mounted ? (itemCount > 99 ? '99+' : itemCount) : 0}
            </span>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/10"
          >
            <div className="mx-auto max-w-7xl px-4 py-4 tablet:px-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-stone" size={18} />
                <input
                  type="text"
                  placeholder={t('nav.searchProducts')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full bg-white/10 py-3 pl-12 pr-4 text-sm text-white placeholder:text-brand-stone focus:outline-none focus:ring-2 focus:ring-brand-gold"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border-t border-white/10 bg-brand-black tablet:hidden"
          >
            <div className="space-y-1 px-4 py-4">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block py-3 text-sm uppercase tracking-widest text-brand-stone transition-colors hover:text-white"
                >
                  {t(item.label)}
                </Link>
              ))}
              <hr className="border-white/10 my-3" />
              <Link
                href={mounted && user ? '/account' : '/auth/login'}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 py-3 text-sm text-brand-stone transition-colors hover:text-white"
              >
                <User size={18} />
                {mounted && user ? t('nav.myAccount') : t('nav.signIn')}
              </Link>
              {mounted && isAdmin() && (
                <Link
                  href="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="block py-3 text-sm text-brand-gold"
                >
                  {t('nav.adminDashboard')}
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
