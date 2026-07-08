'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BottomNav } from '@/components/layout/bottom-nav';
import { CartSidebar } from '@/components/layout/cart-sidebar';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Check, Package, Truck, MapPin, Clock, CreditCard, Loader2, FileText, BarChart3 } from 'lucide-react';
import Link from 'next/link';

interface TimelineItem {
  id: string;
  event: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface GuideItem {
  id: string;
  provider: string;
  guideNumber: string;
  labelUrl: string | null;
  barcodeUrl: string | null;
  trackingUrl: string | null;
  cost: number | null;
}

interface TrackingOrderData {
  id: string;
  reference: string | null;
  status: string;
  total: number;
  shippingCost: number | null;
  trackingNumber: string | null;
  carrier: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  estimatedDelivery: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: { name: string; image: string | null };
  }>;
  payments: Array<{ provider: string; status: string }> | null;
  timeline: TimelineItem[];
  guides: GuideItem[];
  carrierTracking: {
    status: string;
    events: Array<{ date: string; description: string; location?: string }>;
    estimatedDelivery?: string;
  } | null;
}

const eventLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  order_created: { label: 'Pedido creado', icon: <Package size={14} /> },
  payment_confirmed: { label: 'Pago confirmado', icon: <CreditCard size={14} /> },
  preparing: { label: 'Preparando', icon: <Package size={14} /> },
  packed: { label: 'Empacado', icon: <Package size={14} /> },
  guide_generated: { label: 'Guía generada', icon: <FileText size={14} /> },
  handed_to_carrier: { label: 'Entregado a transportadora', icon: <Truck size={14} /> },
  in_transit: { label: 'En camino', icon: <Truck size={14} /> },
  out_for_delivery: { label: 'En destino final', icon: <MapPin size={14} /> },
  delivered: { label: 'Entregado', icon: <Check size={14} /> },
  cancelled: { label: 'Cancelado', icon: <Loader2 size={14} /> },
  returned: { label: 'Devuelto', icon: <Loader2 size={14} /> },
  note_added: { label: 'Nota interna', icon: <FileText size={14} /> },
};

const providerNames: Record<string, string> = {
  interrapidisimo: 'Inter Rapidísimo',
  coordinadora: 'Coordinadora',
  servientrega: 'Servientrega',
  envia: 'Envia',
  manual: 'Mensajero propio',
};

export default function PublicTrackingPage() {
  const params = useParams();
  const [data, setData] = useState<TrackingOrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!params.token) return;

    async function load() {
      try {
        const res = await fetch(`/api/tracking/${params.token}`);
        const json = await res.json();
        if (!json.success || !json.data) throw new Error('Seguimiento no encontrado');
        setData(json.data);
      } catch (err: any) {
        setError(err.message || 'Error al cargar seguimiento');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [params.token]);

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

  if (error || !data) {
    return (
      <>
        <Header />
        <CartSidebar />
        <main className="flex min-h-dynamic items-center justify-center pb-16 tablet:pb-0">
          <div className="text-center">
            <p className="text-sm text-brand-stone">{error || 'Seguimiento no encontrado'}</p>
            <Link
              href="/"
              className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-brand-black px-8 text-xs font-medium uppercase tracking-wider text-white"
            >
              Volver a tienda
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
      <main className="min-h-dynamic pb-16 tablet:pb-0">
        <div className="sticky top-16 z-30 border-b border-brand-ivory bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex h-12 max-w-3xl items-center px-4 tablet:px-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-medium text-brand-stone transition-colors hover:text-brand-black"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5m7-7-7 7 7 7"/>
              </svg>
              Volver a tienda
            </Link>
          </div>
        </div>
        <div className="bg-brand-black py-12 tablet:py-16">
          <div className="mx-auto max-w-3xl px-4 tablet:px-6">
            <h1 className="font-display text-3xl font-bold text-white tablet:text-4xl">
              Seguimiento de pedido
            </h1>
            <p className="mt-2 text-sm text-brand-stone">
              Pedido #{data.id.slice(0, 8)}
              {data.reference && <> — Ref: {data.reference}</>}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-brand-gold/20 px-3 py-1 text-xs font-medium text-brand-gold capitalize">
                {data.status}
              </span>
              {data.carrier && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
                  {providerNames[data.carrier] || data.carrier}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 py-8 tablet:px-6">
          <div className="grid gap-6 tablet:grid-cols-3">
            <div className="tablet:col-span-2 space-y-6">
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-wider">
                  Línea de tiempo
                </h2>
                <div className="mt-6">
                  {data.timeline.length === 0 ? (
                    <p className="text-sm text-brand-stone">No hay eventos registrados</p>
                  ) : (
                    data.timeline.map((entry, index) => {
                      const eventConfig = eventLabels[entry.event] || { label: entry.event, icon: null };
                      const isLast = index === data.timeline.length - 1;
                      return (
                        <div key={entry.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-ivory text-brand-gold">
                              {eventConfig.icon || <div className="h-2 w-2 rounded-full bg-current" />}
                            </div>
                            {!isLast && <div className="mt-1 h-full w-px bg-brand-ivory" />}
                          </div>
                          <div className={`flex-1 ${isLast ? '' : 'pb-8'}`}>
                            <p className="text-sm font-medium text-brand-black">
                              {eventConfig.label}
                            </p>
                            <p className="mt-0.5 text-xs text-brand-stone">
                              {formatDate(entry.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {data.carrierTracking && (
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <h2 className="text-sm font-semibold uppercase tracking-wider">
                    Seguimiento transportadora
                  </h2>
                  <div className="mt-4 space-y-3">
                    {data.carrierTracking.events.map((evt, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-ivory">
                          <div className="h-2 w-2 rounded-full bg-brand-gold" />
                        </div>
                        <div>
                          <p className="text-sm">{evt.description}</p>
                          <p className="text-xs text-brand-stone">
                            {formatDate(evt.date)}{evt.location ? ` — ${evt.location}` : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(data.trackingNumber || data.carrier) && (
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <h2 className="text-sm font-semibold uppercase tracking-wider">
                    Información de envío
                  </h2>
                  <div className="mt-4 space-y-3">
                    {data.carrier && (
                      <div className="flex items-center gap-3">
                        <Truck size={16} className="text-brand-gold" />
                        <div>
                          <p className="text-xs text-brand-stone">Transportadora</p>
                          <p className="text-sm font-medium">
                            {providerNames[data.carrier] || data.carrier}
                          </p>
                        </div>
                      </div>
                    )}
                    {data.trackingNumber && (
                      <div className="flex items-center gap-3">
                        <BarChart3 size={16} className="text-brand-gold" />
                        <div>
                          <p className="text-xs text-brand-stone">Número de guía</p>
                          <p className="text-sm font-medium">{data.trackingNumber}</p>
                        </div>
                      </div>
                    )}
                    {data.estimatedDelivery && (
                      <div className="flex items-center gap-3">
                        <Clock size={16} className="text-brand-gold" />
                        <div>
                          <p className="text-xs text-brand-stone">Entrega estimada</p>
                          <p className="text-sm font-medium">{formatDate(data.estimatedDelivery)}</p>
                        </div>
                      </div>
                    )}
                    {data.shippingAddress && (
                      <div className="flex items-center gap-3">
                        <MapPin size={16} className="text-brand-gold" />
                        <div>
                          <p className="text-xs text-brand-stone">Dirección de envío</p>
                          <p className="text-sm font-medium">{data.shippingAddress}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {data.guides.length > 0 && (
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <h2 className="text-sm font-semibold uppercase tracking-wider">
                    Guías de envío
                  </h2>
                  <div className="mt-4 space-y-3">
                    {data.guides.map((guide) => (
                      <div key={guide.id} className="flex items-center justify-between rounded-lg border border-brand-ivory p-3">
                        <div>
                          <p className="text-sm font-medium">
                            {providerNames[guide.provider] || guide.provider}
                          </p>
                          <p className="text-xs text-brand-stone">Guía: {guide.guideNumber}</p>
                          {guide.cost && (
                            <p className="text-xs text-brand-stone">
                              Costo: {formatCurrency(guide.cost)}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {guide.labelUrl && (
                            <a
                              href={guide.labelUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex h-8 items-center gap-1 rounded-full bg-brand-black px-3 text-[10px] font-medium uppercase tracking-wider text-white"
                            >
                              <FileText size={10} />
                              Guía
                            </a>
                          )}
                          {guide.trackingUrl && (
                            <a
                              href={guide.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex h-8 items-center gap-1 rounded-full border border-brand-ivory px-3 text-[10px] font-medium uppercase tracking-wider"
                            >
                              <Truck size={10} />
                              Seguir
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
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
                    <span>{formatCurrency(data.total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-stone">Envío</span>
                    <span>
                      {data.shippingCost !== null && data.shippingCost !== undefined
                        ? formatCurrency(data.shippingCost)
                        : data.total >= 200000
                          ? 'Gratis'
                          : formatCurrency(15000)}
                    </span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(data.total)}</span>
                  </div>
                </div>
              </div>

              {data.payments && data.payments.length > 0 && (
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <h2 className="text-sm font-semibold uppercase tracking-wider">Pago</h2>
                  <div className="mt-3 space-y-2">
                    {data.payments.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{p.provider}</span>
                        <span className={`text-xs font-medium capitalize ${
                          p.status === 'completed' ? 'text-green-600' :
                          p.status === 'failed' ? 'text-red-600' : 'text-brand-stone'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-wider">
                  Productos ({data.items.length})
                </h2>
                <div className="mt-4 space-y-3">
                  {data.items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-brand-ivory">
                        {item.product.image ? (
                          <img
                            src={item.product.image}
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
