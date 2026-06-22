'use client';

import { useEffect, useState } from 'react';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';
import { useLocale } from '@/providers/locale-provider';
import { formatCurrency, currencyLocale } from '@/lib/utils';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export function CartSidebar() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, getTotal } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const { locale, t } = useLocale();
  const [mounted, setMounted] = useState(false);
  const total = getTotal();

  useEffect(() => { setMounted(true); }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={closeCart}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-brand-ivory px-6 py-4">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-brand-black" />
                <span className="text-sm font-medium uppercase tracking-wider">
                    {t('nav.cart')} ({items.length})
                </span>
              </div>
              <button
                onClick={closeCart}
                className="transition-colors hover:text-brand-gold"
                aria-label="Close cart"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <ShoppingBag size={48} className="mb-4 text-brand-stone/50" />
                  <p className="text-sm text-brand-stone">{t('cart.empty')}</p>
                  <button
                    onClick={closeCart}
                    className="mt-4 text-sm font-medium text-brand-gold underline underline-offset-4"
                  >
                    {t('common.continueShopping')}
                  </button>
                </div>
              ) : (
                <ul className="space-y-4">
                  <AnimatePresence>
                    {items.map((item) => (
                      <motion.li
                        key={item.productId}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex gap-4"
                      >
                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-brand-ivory">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>

                        <div className="flex flex-1 flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between">
                              <h3 className="text-sm font-medium">{item.name}</h3>
                              <button
                                onClick={() => removeItem(item.productId)}
                                className="text-brand-stone transition-colors hover:text-destructive"
                  aria-label={t('cart.remove')}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                              <p className="mt-1 text-sm font-medium text-brand-gold">
                                {formatCurrency(item.price, currencyLocale(locale))}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full border transition-colors hover:bg-brand-ivory"
                              aria-label={t('cart.decrease')}
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-6 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full border transition-colors hover:bg-brand-ivory"
                              aria-label={t('cart.increase')}
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-brand-ivory px-6 py-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm uppercase tracking-wider">{t('common.total')}</span>
                  <span className="text-lg font-semibold">{formatCurrency(total, currencyLocale(locale))}</span>
                </div>

                {mounted && user ? (
                  <Link
                    href="/checkout"
                    onClick={closeCart}
                    className="flex h-12 w-full items-center justify-center rounded-full bg-brand-black text-sm font-medium uppercase tracking-wider text-white transition-all hover:bg-brand-black/90"
                  >
                    {t('cart.checkout')}
                  </Link>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={closeCart}
                    className="flex h-12 w-full items-center justify-center rounded-full bg-brand-black text-sm font-medium uppercase tracking-wider text-white transition-all hover:bg-brand-black/90"
                  >
                    {mounted ? t('cart.signInToCheckout') : t('cart.checkout')}
                  </Link>
                )}

                <button
                  onClick={closeCart}
                  className="mt-3 flex w-full items-center justify-center text-xs uppercase tracking-wider text-brand-stone transition-colors hover:text-brand-black"
                >
                  {t('common.continueShopping')}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
