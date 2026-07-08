'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  ArrowLeft, Package, Truck, MapPin, Clock, CreditCard,
  FileText, Plus, Loader2, Check, ExternalLink, BarChart3,
} from 'lucide-react';
import type { Order, OrderTimeline, OrderNote, ShippingGuide } from '@velora/types';

interface OrderDetail extends Omit<Order, 'trackingToken'> {
  timeline: OrderTimeline[];
  notes: OrderNote[];
  guides: ShippingGuide[];
  trackingToken: { id: string; token: string; orderId: string; expiresAt: string | null; createdAt: string } | null;
}

const eventLabels: Record<string, string> = {
  order_created: 'Pedido creado',
  payment_confirmed: 'Pago confirmado',
  preparing: 'Preparando',
  packed: 'Empacado',
  guide_generated: 'Guía generada',
  handed_to_carrier: 'Entregado a transportadora',
  in_transit: 'En camino',
  out_for_delivery: 'En destino final',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  returned: 'Devuelto',
  note_added: 'Nota interna',
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteContent, setNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [generatingGuide, setGeneratingGuide] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }
    if (!params.id) return;

    async function load() {
      try {
        const res = await api.get<{ success: boolean; data: OrderDetail }>(
          `/admin/orders/${params.id}`,
        );
        if (!res.success || !res.data) throw new Error('Order not found');
        setOrder(res.data);
      } catch (err: any) {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [params.id, user, router]);

  const handleUpdateStatus = async (status: string) => {
    try {
      await api.put(`/admin/orders/${params.id}/status`, { status });
      toast({ title: 'Estado actualizado', variant: 'success' });
      const res = await api.get<{ success: boolean; data: OrderDetail }>(
        `/admin/orders/${params.id}`,
      );
      if (res.data) setOrder(res.data);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    setAddingNote(true);
    try {
      const res = await api.post<{ success: boolean; data: OrderNote }>(
        `/admin/orders/${params.id}/notes`,
        { content: noteContent },
      );
      setNoteContent('');
      toast({ title: 'Nota agregada', variant: 'success' });
      if (order && res.data) {
        setOrder({ ...order, notes: [res.data, ...order.notes] });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setAddingNote(false);
    }
  };

  const handleGenerateGuide = async () => {
    setGeneratingGuide(true);
    try {
      const res = await api.post<{ success: boolean; data: ShippingGuide }>(
        `/admin/orders/${params.id}/guides`,
        { provider: 'interrapidisimo' },
      );
      toast({ title: 'Guía generada', description: `Guía: ${res.data.guideNumber}`, variant: 'success' });
      const refresh = await api.get<{ success: boolean; data: OrderDetail }>(
        `/admin/orders/${params.id}`,
      );
      if (refresh.data) setOrder(refresh.data);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setGeneratingGuide(false);
    }
  };

  if (!user || user.role !== 'admin') return null;

  if (loading) {
    return (
      <div className="flex min-h-dynamic items-center justify-center bg-brand-ivory">
        <Loader2 size={32} className="animate-spin text-brand-gold" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-dynamic items-center justify-center bg-brand-ivory">
        <p className="text-sm text-brand-stone">Orden no encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-dynamic bg-brand-ivory">
      <header className="sticky top-0 z-40 bg-brand-black text-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 tablet:px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/admin/orders')} className="text-brand-stone hover:text-white">
              <ArrowLeft size={18} />
            </button>
            <span className="font-display text-lg font-bold tracking-[0.3em]">VELORA</span>
            <span className="rounded bg-brand-gold/20 px-2 py-0.5 text-[10px] font-medium text-brand-gold uppercase tracking-wider">
              Admin / Orden #{order.id.slice(0, 8)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {order.trackingToken && (
              <a
                href={`/tracking/${order.trackingToken.token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-brand-stone transition-colors hover:text-white"
              >
                <ExternalLink size={12} />
                Tracking público
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 tablet:px-6">
        <div className="grid gap-6 tablet:grid-cols-3">
          <div className="space-y-6 tablet:col-span-2">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider">Línea de tiempo</h2>
                <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                  order.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  order.status === 'shipped' ? 'bg-green-50 text-green-700' :
                  order.status === 'confirmed' ? 'bg-blue-50 text-blue-700' :
                  order.status === 'processing' ? 'bg-purple-50 text-purple-700' :
                  'bg-yellow-50 text-yellow-700'
                }`}>
                  {order.status}
                </span>
              </div>
              <div className="mt-6">
                {order.timeline.length === 0 ? (
                  <p className="text-sm text-brand-stone">Sin eventos registrados</p>
                ) : (
                  order.timeline.map((entry, i) => {
                    const isLast = i === order.timeline.length - 1;
                    return (
                      <div key={entry.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-ivory text-brand-gold">
                            <div className="h-2 w-2 rounded-full bg-brand-gold" />
                          </div>
                          {!isLast && <div className="mt-1 h-full w-px bg-brand-ivory" />}
                        </div>
                        <div className={`flex-1 ${isLast ? '' : 'pb-8'}`}>
                          <p className="text-sm font-medium">
                            {eventLabels[entry.event] || entry.event}
                          </p>
                          <p className="text-xs text-brand-stone">
                            {formatDate(entry.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wider">
                Información del pedido
              </h2>
              <div className="mt-4 grid gap-4 tablet:grid-cols-2">
                <div>
                  <p className="text-xs text-brand-stone">Referencia</p>
                  <p className="text-sm font-medium">{order.reference || order.id.slice(0, 8)}</p>
                </div>
                <div>
                  <p className="text-xs text-brand-stone">Cliente</p>
                  <p className="text-sm font-medium">{order.user?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-brand-stone">Total</p>
                  <p className="text-sm font-medium">{formatCurrency(order.total)}</p>
                </div>
                <div>
                  <p className="text-xs text-brand-stone">Fecha</p>
                  <p className="text-sm font-medium">{formatDate(order.createdAt)}</p>
                </div>
                <div className="tablet:col-span-2">
                  <p className="text-xs text-brand-stone">Estado</p>
                  <select
                    value={order.status}
                    onChange={(e) => handleUpdateStatus(e.target.value)}
                    className="mt-1 rounded-lg border px-3 py-1.5 text-xs font-medium capitalize focus:border-brand-gold focus:outline-none"
                  >
                    {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wider">Notas internas</h2>
              <div className="mt-4 space-y-3">
                <div className="flex gap-2">
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Agregar nota interna..."
                    rows={2}
                    className="flex-1 rounded-xl border border-brand-ivory px-4 py-2 text-sm outline-none focus:border-brand-gold"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={addingNote || !noteContent.trim()}
                    className="flex h-10 items-center gap-1 rounded-full bg-brand-black px-4 text-[10px] font-medium uppercase tracking-wider text-white disabled:opacity-50"
                  >
                    <Plus size={12} />
                    {addingNote ? '...' : 'Agregar'}
                  </button>
                </div>
                {order.notes.length === 0 ? (
                  <p className="text-sm text-brand-stone">Sin notas</p>
                ) : (
                  order.notes.map((note) => (
                    <div key={note.id} className="rounded-lg bg-brand-ivory p-3">
                      <p className="text-sm">{note.content}</p>
                      <p className="mt-1 text-[10px] text-brand-stone">
                        {note.author?.email || 'Anónimo'} — {formatDate(note.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {order.guides.length > 0 && (
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-wider">Guías de envío</h2>
                <div className="mt-4 space-y-3">
                  {order.guides.map((guide) => (
                    <div key={guide.id} className="flex items-center justify-between rounded-lg border border-brand-ivory p-3">
                      <div>
                        <p className="text-sm font-medium capitalize">{guide.provider}</p>
                        <p className="text-xs text-brand-stone">Guía: {guide.guideNumber}</p>
                        {guide.cost && (
                          <p className="text-xs text-brand-stone">Costo: {formatCurrency(guide.cost)}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {guide.labelUrl && (
                          <a href={guide.labelUrl} target="_blank" rel="noopener noreferrer"
                            className="flex h-8 items-center gap-1 rounded-full bg-brand-black px-3 text-[10px] font-medium uppercase tracking-wider text-white">
                            <FileText size={10} /> PDF
                          </a>
                        )}
                        {guide.trackingUrl && (
                          <a href={guide.trackingUrl} target="_blank" rel="noopener noreferrer"
                            className="flex h-8 items-center gap-1 rounded-full border border-brand-ivory px-3 text-[10px] font-medium">
                            <Truck size={10} /> Seguir
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
              <h2 className="text-sm font-semibold uppercase tracking-wider">Acciones</h2>
              <div className="mt-4 space-y-3">
                <button
                  onClick={handleGenerateGuide}
                  disabled={generatingGuide || order.status === 'cancelled' || order.status === 'delivered'}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-black text-xs font-medium uppercase tracking-wider text-white disabled:opacity-50"
                >
                  <FileText size={14} />
                  {generatingGuide ? 'Generando...' : 'Generar guía'}
                </button>
                {order.status === 'confirmed' && (
                  <button
                    onClick={() => handleUpdateStatus('processing')}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-brand-ivory text-xs font-medium uppercase tracking-wider transition-colors hover:bg-brand-ivory"
                  >
                    <Package size={14} />
                    Marcar en preparación
                  </button>
                )}
              </div>
            </div>

            {order.trackingNumber && (
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-wider">Envío</h2>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Truck size={16} className="text-brand-gold" />
                    <div>
                      <p className="text-xs text-brand-stone">Transportadora</p>
                      <p className="text-sm font-medium capitalize">{order.carrier || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <BarChart3 size={16} className="text-brand-gold" />
                    <div>
                      <p className="text-xs text-brand-stone">Guía</p>
                      <p className="text-sm font-medium">{order.trackingNumber}</p>
                    </div>
                  </div>
                  {order.shippingAddress && (
                    <div className="flex items-center gap-3">
                      <MapPin size={16} className="text-brand-gold" />
                      <div>
                        <p className="text-xs text-brand-stone">Dirección</p>
                        <p className="text-sm font-medium">{order.shippingAddress}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wider">
                Productos ({order.items.length})
              </h2>
              <div className="mt-4 space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-brand-ivory">
                      {item.product.images?.[0] ? (
                        <img src={item.product.images[0].url} alt={item.product.name}
                          className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-brand-stone">?</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.product.name}</p>
                      <p className="text-xs text-brand-stone">
                        {item.quantity} x {formatCurrency(item.price)}
                      </p>
                    </div>
                    <p className="text-sm font-medium">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
