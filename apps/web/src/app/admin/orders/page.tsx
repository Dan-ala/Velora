'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Package, Search, X, Truck, Eye, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Order } from '@velora/types';

interface ShipForm {
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: string;
  shippingAddress: string;
}

const initialShipForm: ShipForm = {
  trackingNumber: '',
  carrier: '',
  estimatedDelivery: '',
  shippingAddress: '',
};

function ShipModal({
  order,
  onClose,
  onShip,
  processing,
}: {
  order: Order;
  onClose: () => void;
  onShip: (id: string, data: ShipForm) => Promise<void>;
  processing: boolean;
}) {
  const [form, setForm] = useState<ShipForm>(initialShipForm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onShip(order.id, form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-scale-in">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider">
            Marcar como enviado
          </h3>
          <button onClick={onClose} className="text-brand-stone hover:text-brand-black">
            <X size={18} />
          </button>
        </div>
        <p className="mb-4 text-xs text-brand-stone">
          Pedido #{order.id.slice(0, 8)} — {formatCurrency(order.total)}
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-brand-stone">
              Transportadora
            </label>
            <select
              value={form.carrier}
              onChange={(e) => setForm({ ...form, carrier: e.target.value })}
              required
              className="mt-1 h-10 w-full rounded-xl border border-brand-ivory px-4 text-sm outline-none focus:border-brand-gold"
            >
              <option value="">Seleccionar</option>
              <option value="Interrapidisimo">Interrapidisimo</option>
              <option value="Picap">Picap</option>
              <option value="Rappi">Rappi</option>
              <option value="Mensajero propio">Mensajero propio</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-brand-stone">
              Numero de guia
            </label>
            <input
              type="text"
              value={form.trackingNumber}
              onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })}
              required
              placeholder="ej. 1234-5678-90"
              className="mt-1 h-10 w-full rounded-xl border border-brand-ivory px-4 text-sm outline-none focus:border-brand-gold"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-brand-stone">
              Fecha estimada de entrega
            </label>
            <input
              type="datetime-local"
              value={form.estimatedDelivery}
              onChange={(e) => setForm({ ...form, estimatedDelivery: e.target.value })}
              className="mt-1 h-10 w-full rounded-xl border border-brand-ivory px-4 text-sm outline-none focus:border-brand-gold"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-brand-stone">
              Direccion de envio
            </label>
            <textarea
              value={form.shippingAddress}
              onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })}
              rows={2}
              placeholder="Calle 123 # 4-5, Barrio, Ciudad"
              className="mt-1 w-full rounded-xl border border-brand-ivory px-4 py-2 text-sm outline-none focus:border-brand-gold"
            />
          </div>
          <button
            type="submit"
            disabled={processing}
            className="flex h-11 w-full items-center justify-center rounded-full bg-brand-black text-xs font-medium uppercase tracking-wider text-white disabled:opacity-50"
          >
            {processing ? 'Enviando...' : 'Confirmar envio y notificar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [shipOrder, setShipOrder] = useState<Order | null>(null);
  const [processing, setProcessing] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (search) params.set('search', search);
      const res = await api.get<{ success: boolean; data: Order[] }>(
        `/admin/orders?${params}`,
      );
      setOrders(res.data || []);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }
    loadOrders();
  }, [user, router, loadOrders]);

  const handleShip = async (id: string, data: ShipForm) => {
    setProcessing(true);
    try {
      await api.patch(`/admin/orders/${id}/ship`, {
        ...data,
        estimatedDelivery: data.estimatedDelivery
          ? new Date(data.estimatedDelivery).toISOString()
          : undefined,
      });
      toast({ title: 'Pedido marcado como enviado', description: 'Correo enviado al cliente', variant: 'success' });
      setShipOrder(null);
      loadOrders();
    } catch (err: any) {
      toast({ title: 'Error al enviar', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const statusStyles: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-700',
    confirmed: 'bg-blue-50 text-blue-700',
    processing: 'bg-purple-50 text-purple-700',
    shipped: 'bg-green-50 text-green-700',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-50 text-red-700',
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-dynamic bg-brand-ivory">
      <header className="sticky top-0 z-40 bg-brand-black text-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 tablet:px-6">
          <div className="flex items-center gap-4">
            <span className="font-display text-lg font-bold tracking-[0.3em]">VELORA</span>
            <span className="rounded bg-brand-gold/20 px-2 py-0.5 text-[10px] font-medium text-brand-gold uppercase tracking-wider">
              Admin / Ordenes
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin')}
              className="text-xs text-brand-stone transition-colors hover:text-white"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 tablet:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Ordenes</h1>
            <p className="text-sm text-brand-stone">{orders.length} ordenes</p>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-stone" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-48 rounded-xl border border-brand-ivory bg-white pl-9 pr-4 text-sm outline-none focus:border-brand-gold"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-white" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-brand-stone">
            <Package size={48} className="mb-4 opacity-30" />
            <p className="text-sm font-medium">No hay ordenes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md tablet:p-6"
              >
                <div className="flex flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-brand-stone">
                        #{order.id.slice(0, 8)}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                          statusStyles[order.status] || 'bg-brand-ivory text-brand-stone'
                        }`}
                      >
                        {order.status}
                      </span>
                      {order.shippingStatus === 'shipped' && (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
                          Enviado
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-medium">
                      {formatCurrency(order.total)}
                    </p>
                    <p className="mt-0.5 text-xs text-brand-stone">
                      {order.user?.email || 'Sin email'} — {formatDate(order.createdAt)}
                    </p>
                    {order.trackingNumber && (
                      <p className="mt-1 text-xs text-brand-gold">
                        <Truck size={12} className="mr-1 inline" />
                        {order.carrier}: {order.trackingNumber}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/admin/orders/${order.id}`)}
                      className="flex h-9 items-center gap-1.5 rounded-full border border-brand-ivory px-4 text-[10px] font-medium uppercase tracking-wider text-brand-stone transition-colors hover:border-brand-gold hover:text-brand-gold"
                    >
                      <Eye size={12} />
                      Detalle
                    </button>
                    {order.status === 'confirmed' && !order.trackingNumber && (
                      <button
                        onClick={() => setShipOrder(order)}
                        className="flex h-9 items-center gap-1.5 rounded-full bg-brand-black px-4 text-[10px] font-medium uppercase tracking-wider text-white transition-colors hover:bg-brand-black/90"
                      >
                        <Truck size={12} />
                        Enviar
                      </button>
                    )}
                    {(order as Order & { trackingToken?: { token: string } }).trackingToken && (
                      <a
                        href={`/tracking/${(order as Order & { trackingToken?: { token: string } }).trackingToken!.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-9 items-center gap-1.5 rounded-full border border-brand-ivory px-3 text-[10px] font-medium text-brand-stone hover:text-brand-gold"
                      >
                        <ExternalLink size={10} />
                        Link
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {shipOrder && (
        <ShipModal
          order={shipOrder}
          onClose={() => setShipOrder(null)}
          onShip={handleShip}
          processing={processing}
        />
      )}
    </div>
  );
}
