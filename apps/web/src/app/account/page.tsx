'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BottomNav } from '@/components/layout/bottom-nav';
import { CartSidebar } from '@/components/layout/cart-sidebar';
import { useAuthStore } from '@/stores/auth-store';
import { createClient } from '@/lib/supabase';
import { api } from '@/lib/api';
import { useLocale } from '@/providers/locale-provider';
import { formatCurrency, formatDate, currencyLocale, dateLocale } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Package, LogOut, User as UserIcon, ShoppingBag, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { Order } from '@velora/types';

export default function AccountPage() {
  const { locale, t } = useLocale();
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    api.get<{ success: boolean; data: Order[] }>('/orders')
      .then((res) => setOrders(res.data || []))
      .catch(() => {});
  }, [user, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };

  if (!user) return null;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'text-yellow-600 bg-yellow-50',
      confirmed: 'text-blue-600 bg-blue-50',
      processing: 'text-purple-600 bg-purple-50',
      shipped: 'text-brand-gold bg-brand-ivory',
      delivered: 'text-green-600 bg-green-50',
      cancelled: 'text-destructive bg-destructive/10',
    };
    return colors[status] || 'text-brand-stone bg-brand-ivory';
  };

  const statusLabels: Record<string, string> = {
    pending: t('account.pending'),
    confirmed: t('account.confirmed'),
    processing: t('account.processing'),
    shipped: t('account.shipped'),
    delivered: t('account.delivered'),
    cancelled: t('account.cancelled'),
  };

  return (
    <>
      <Header />
      <CartSidebar />

      <main className="min-h-screen pb-16 tablet:pb-0">
        <div className="bg-brand-black py-12 tablet:py-16">
          <div className="mx-auto max-w-7xl px-4 tablet:px-6 wide:px-8">
            <h1 className="font-display text-3xl font-bold text-white tablet:text-5xl">{t('account.title')}</h1>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 tablet:px-6 wide:px-8">
          <div className="grid gap-8 tablet:grid-cols-4">
            <div className="space-y-4 tablet:col-span-1">
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-ivory">
                    <UserIcon size={20} className="text-brand-stone" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.email}</p>
                    <p className="text-xs text-brand-stone capitalize">{user.role}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border py-2.5 text-xs font-medium uppercase tracking-wider transition-colors hover:bg-brand-ivory"
                >
                  <LogOut size={14} /> {t('account.signOut')}
                </button>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm">
                <nav className="space-y-2">
                  <Link
                    href="/account"
                    className="flex items-center justify-between rounded-lg bg-brand-ivory px-4 py-3 text-sm font-medium"
                  >
                    <div className="flex items-center gap-3">
                      <Package size={16} /> {t('account.orders')}
                    </div>
                    <ChevronRight size={14} />
                  </Link>
                </nav>
              </div>
            </div>

            <div className="space-y-4 tablet:col-span-3">
              <h2 className="text-lg font-semibold">{t('account.orderHistory')}</h2>

              {orders.length === 0 ? (
                <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                  <ShoppingBag size={32} className="mx-auto text-brand-stone/50" />
                  <p className="mt-3 text-sm text-brand-stone">{t('account.noOrders')}</p>
                  <Link href="/products" className="mt-3 inline-flex text-xs text-brand-gold underline underline-offset-4">
                    {t('account.startShopping')}
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl bg-white p-6 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-brand-stone">{t('account.orderId', { id: order.id.slice(0, 8) })}</p>
                          <p className="mt-1 text-sm font-medium">{formatCurrency(order.total, currencyLocale(locale))}</p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-wider ${getStatusColor(order.status)}`}
                        >
                          {statusLabels[order.status] || order.status}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-brand-stone">{formatDate(order.createdAt, dateLocale(locale))}</p>
                      {order.items && (
                        <div className="mt-3 flex gap-2">
                          {order.items.slice(0, 3).map((item) => (
                            <div
                              key={item.id}
                              className="h-10 w-10 overflow-hidden rounded-lg bg-brand-ivory"
                            >
                              {item.product?.images?.[0] && (
                                <img
                                  src={item.product.images[0].url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-ivory text-xs text-brand-stone">
                              +{order.items.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
    </>
  );
}
