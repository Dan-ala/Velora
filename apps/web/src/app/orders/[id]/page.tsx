'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BottomNav } from '@/components/layout/bottom-nav';
import { CartSidebar } from '@/components/layout/cart-sidebar';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Check, Package, Truck, MapPin, Clock, Loader2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { Order } from '@velora/types';

function timelineStep(
  done: boolean,
  active: boolean,
  label: string,
  date?: string,
  icon?: React.ReactNode,
) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            done
              ? 'bg-green-100 text-green-600'
              : active
                ? 'bg-brand-gold/10 text-brand-gold'
                : 'bg-brand-ivory text-brand-stone/40'
          }`}
        >
          {done ? <Check size={14} /> : icon || <div className="h-2 w-2 rounded-full bg-current" />}
        </div>
        <div className="mt-1 h-full w-px bg-brand-ivory last:hidden" />
      </div>
      <div className="flex-1 pb-8">
        <p className={`text-sm font-medium ${active ? 'text-brand-gold' : done ? 'text-brand-black' : 'text-brand-stone/40'}`}>
          {label}
        </p>
        {date && (
          <p className="mt-0.5 text-xs text-brand-stone">{formatDate(date)}</p>
        )}
      </div>
    </div>
  );
}

export default function OrderTrackingPage() {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!params.id) return;

    async function load() {
      try {
        const res = await api.get<{ success: boolean; data: Order }>(
          `/orders/${params.id}`,
        );
        if (!res.success || !res.data) throw new Error('Orden no encontrada');
        setOrder(res.data);
      } catch (err: any) {
        setError(err.message || 'Error al cargar la orden');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [params.id]);

  if (loading) {
    return (
      <>
        <Header />
        <CartSidebar />
        <main className="flex min-h-dynamic items-center justify-center pb-16 tablet:pb-0">
          <Loader2 size={32} className="animate-spin text-brand-gold" />
        </main>
        <BottomNav />
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Header />
        <CartSidebar />
        <main className="flex min-h-dynamic items-center justify-center pb-16 tablet:pb-0">
          <div className="text-center">
            <p className="text-sm text-brand-stone">{error || 'Orden no encontrada'}</p>
            <Link
              href="/account"
              className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-brand-black px-8 text-xs font-medium uppercase tracking-wider text-white"
            >
              Mis pedidos
            </Link>
          </div>
        </main>
        <BottomNav />
      </>
    );
  }

  const statusIndex = ['pending', 'confirmed', 'shipped', 'delivered'].indexOf(order.status);
  const shipped = order.status === 'shipped' || order.status === 'delivered';
  const delivered = order.status === 'delivered';

  return (
    <>
      <Header />
      <CartSidebar />
      <main className="min-h-dynamic pb-16 tablet:pb-0">
        <div className="sticky top-16 z-30 border-b border-brand-ivory bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex h-12 max-w-3xl items-center px-4 tablet:px-6">
            <Link
              href="/account"
              className="flex items-center gap-2 text-sm font-medium text-brand-stone transition-colors hover:text-brand-black"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5m7-7-7 7 7 7"/>
              </svg>
              Mis pedidos
            </Link>
          </div>
        </div>
        <div className="bg-brand-black py-12 tablet:py-16">
          <div className="mx-auto max-w-3xl px-4 tablet:px-6">
            <h1 className="font-display text-3xl font-bold text-white tablet:text-4xl">
              Seguimiento de pedido
            </h1>
            <p className="mt-2 text-sm text-brand-stone">
              Pedido #{order.id.slice(0, 8)}
              {order.reference && <> — Ref: {order.reference}</>}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 py-8 tablet:px-6">
          <div className="grid gap-6 tablet:grid-cols-3">
            <div className="tablet:col-span-2 space-y-6">
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-wider">
                  Estado del pedido
                </h2>
                <div className="mt-6">
                  {timelineStep(
                    statusIndex >= 0,
                    order.status === 'confirmed',
                    'Pedido confirmado',
                    order.createdAt,
                    <Package size={14} />,
                  )}
                  {timelineStep(
                    shipped || delivered,
                    order.status === 'shipped',
                    'En camino',
                    shipped || delivered
                      ? order.estimatedDelivery
                        ? `Estimado: ${formatDate(order.estimatedDelivery)}`
                        : undefined
                      : undefined,
                    <Truck size={14} />,
                  )}
                  {timelineStep(delivered, false, 'Entregado')}
                </div>
              </div>

              {shipped && (order.trackingNumber || order.carrier) && (
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <h2 className="text-sm font-semibold uppercase tracking-wider">
                    Informacion de envio
                  </h2>
                  <div className="mt-4 space-y-3">
                    {order.carrier && (
                      <div className="flex items-center gap-3">
                        <Truck size={16} className="text-brand-gold" />
                        <div>
                          <p className="text-xs text-brand-stone">Transportadora</p>
                          <p className="text-sm font-medium">{order.carrier}</p>
                        </div>
                      </div>
                    )}
                    {order.trackingNumber && (
                      <div className="flex items-center gap-3">
                        <MapPin size={16} className="text-brand-gold" />
                        <div>
                          <p className="text-xs text-brand-stone">Numero de guia</p>
                          <p className="text-sm font-medium">{order.trackingNumber}</p>
                        </div>
                      </div>
                    )}
                    {order.estimatedDelivery && (
                      <div className="flex items-center gap-3">
                        <Clock size={16} className="text-brand-gold" />
                        <div>
                          <p className="text-xs text-brand-stone">Entrega estimada</p>
                          <p className="text-sm font-medium">
                            {formatDate(order.estimatedDelivery)}
                          </p>
                        </div>
                      </div>
                    )}
                    {order.shippingAddress && (
                      <div className="flex items-center gap-3">
                        <MapPin size={16} className="text-brand-gold" />
                        <div>
                          <p className="text-xs text-brand-stone">Direccion de envio</p>
                          <p className="text-sm font-medium">{order.shippingAddress}</p>
                        </div>
                      </div>
                    )}
                    {(order as any).trackingToken?.token && (
                      <a
                        href={`/tracking/${(order as any).trackingToken.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 flex items-center gap-2 text-xs font-medium text-brand-gold transition-colors hover:underline"
                      >
                        <ExternalLink size={12} />
                        Ver seguimiento detallado
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-wider">Resumen</h2>
                <div className="mt-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-stone">Subtotal</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-stone">Envio</span>
                    <span>{order.total >= 200000 ? 'Gratis' : formatCurrency(15000)}</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-wider">
                  Productos ({order.items.length})
                </h2>
                <div className="mt-4 space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-brand-ivory">
                        {item.product.images?.[0] ? (
                          <img
                            src={item.product.images[0].url}
                            alt={item.product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-brand-stone">
                            ?
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.product.name}</p>
                        <p className="text-xs text-brand-stone">
                          {item.quantity} x {formatCurrency(item.price)}
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
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
