'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BottomNav } from '@/components/layout/bottom-nav';
import { CartSidebar } from '@/components/layout/cart-sidebar';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';
import { useLocale } from '@/providers/locale-provider';
import { formatCurrency, currencyLocale } from '@/lib/utils';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Check, Lock } from 'lucide-react';

export default function CheckoutPage() {
  const { locale, t } = useLocale();
  const { items, getTotal, clearCart } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState('');

  const total = getTotal();
  const shipping = total >= 200000 ? 0 : 15000;
  const grandTotal = total + shipping;

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    setError('');

    try {
      const res = await api.post<{ success: boolean; data: any }>('/orders');
      if (res.success) {
        clearCart();
        setIsComplete(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to place order');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isComplete) {
    return (
      <>
        <Header />
        <CartSidebar />
        <main className="flex min-h-screen items-center justify-center pb-16 tablet:pb-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto max-w-md px-4 text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check size={32} className="text-green-600" />
            </div>
            <h1 className="mt-6 font-display text-3xl font-bold">{t('checkout.orderConfirmed')}</h1>
            <p className="mt-3 text-sm text-brand-stone">
              {t('checkout.confirmationMessage')}
            </p>
            <Link
              href="/account"
              className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-brand-black px-8 text-xs font-medium uppercase tracking-wider text-white"
            >
              {t('checkout.viewOrders')}
            </Link>
          </motion.div>
        </main>
        <BottomNav />
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <Header />
        <CartSidebar />
        <main className="flex min-h-screen items-center justify-center pb-16 tablet:pb-0">
          <div className="text-center">
            <p className="text-brand-stone">{t('checkout.empty')}</p>
            <Link
              href="/products"
              className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-brand-black px-8 text-xs font-medium uppercase tracking-wider text-white"
            >
              {t('home.shopNow')}
            </Link>
          </div>
        </main>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <Header />
      <CartSidebar />

      <main className="min-h-screen pb-16 tablet:pb-0">
        <div className="bg-brand-black py-12 tablet:py-16">
          <div className="mx-auto max-w-7xl px-4 tablet:px-6 wide:px-8">
            <h1 className="font-display text-3xl font-bold text-white tablet:text-5xl">{t('checkout.title')}</h1>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 tablet:px-6 wide:px-8">
          <div className="grid gap-8 tablet:grid-cols-3">
            <div className="space-y-6 tablet:col-span-2">
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-wider">{t('checkout.contact')}</h2>
                <p className="mt-1 text-sm text-brand-stone">{user?.email}</p>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-wider">{t('checkout.orderSummary')}</h2>
                <div className="mt-4 space-y-4">
                  {items.map((item) => (
                    <div key={item.productId} className="flex gap-4">
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-brand-ivory">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <div className="flex flex-1 items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-brand-stone">{t('checkout.qty')}: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-medium">{formatCurrency(item.price * item.quantity, currencyLocale(locale))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-wider">{t('checkout.summary')}</h2>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-brand-stone">{t('common.subtotal')}</span>
                    <span>{formatCurrency(total, currencyLocale(locale))}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-brand-stone">{t('common.shipping')}</span>
                    <span>{shipping === 0 ? t('common.free') : formatCurrency(shipping, currencyLocale(locale))}</span>
                  </div>
                  <hr />
                  <div className="flex items-center justify-between font-semibold">
                    <span>{t('common.total')}</span>
                    <span>{formatCurrency(grandTotal, currencyLocale(locale))}</span>
                  </div>
                </div>

                {error && (
                  <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">{error}</p>
                )}

                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-black text-sm font-medium uppercase tracking-wider text-white transition-all hover:bg-brand-black/90 disabled:opacity-50"
                >
                  <Lock size={14} />
                  {isProcessing ? t('checkout.processing') : t('checkout.placeOrder', { amount: formatCurrency(grandTotal, currencyLocale(locale)) })}
                </button>

                <p className="mt-4 text-center text-[10px] text-brand-stone">
                  {t('checkout.secureNotice')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
    </>
  );
}
