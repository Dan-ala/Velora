'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Lock, Loader2, AlertCircle } from 'lucide-react';

interface WompiCheckoutProps {
  orderId: string;
  amountInCents: number;
  customerEmail: string;
}

export default function WompiCheckout({
  orderId,
  amountInCents,
  customerEmail,
}: WompiCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.post<{
        success: boolean;
        data: { reference: string; signature: string };
      }>('/wompi/signature', {
        orderId,
        amountInCents,
        currency: 'COP',
      });

      if (!res.success || !res.data) {
        throw new Error('Error al generar la firma de seguridad');
      }

      const { reference, signature } = res.data;

      const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error('Wompi no está configurado');
      }

      const redirectUrl = `${window.location.origin}/orders/confirmation`;

      const script = document.createElement('script');
      script.src = 'https://checkout.wompi.co/widget.js';
      script.onload = () => {
        const WidgetCheckout = (window as any).WidgetCheckout;
        if (!WidgetCheckout) {
          setError('Error al cargar el widget de pago');
          setLoading(false);
          return;
        }

        const checkout = new WidgetCheckout({
          currency: 'COP',
          amountInCents,
          reference,
          publicKey,
          signature: { integrity: signature },
          redirectUrl,
          customerEmail,
        });

        checkout.open((result: any) => {
          if (result?.transaction) {
            window.location.href = `/orders/confirmation?id=${result.transaction.id}`;
          }
        });
      };
      script.onerror = () => {
        setError('Error al cargar el widget de pago');
        setLoading(false);
      };
      document.head.appendChild(script);
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago');
      setLoading(false);
    }
  }, [orderId, amountInCents, customerEmail]);

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-black text-sm font-medium uppercase tracking-wider text-white transition-all hover:bg-brand-black/90 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <Lock size={14} />
            Pagar con Wompi
          </>
        )}
      </button>

      <p className="mt-3 text-center text-[10px] text-brand-stone">
        Tus datos están protegidos. Procesamos tu pago de forma segura a través de Wompi.
      </p>
    </div>
  );
}
