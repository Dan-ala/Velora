'use client';

import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BottomNav } from '@/components/layout/bottom-nav';
import { CartSidebar } from '@/components/layout/cart-sidebar';
import { api } from '@/lib/api';
import { Check, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

type VerificationState = 'loading' | 'polling' | 'approved' | 'declined' | 'error';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const transactionId = searchParams.get('id');

  const [state, setState] = useState<VerificationState>('loading');
  const [statusText, setStatusText] = useState('');
  const [amount, setAmount] = useState(0);
  const [reference, setReference] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingCountRef = useRef(0);
  const POLLING_LIMIT = 36;

  const formatCOP = useCallback((cents: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(cents / 100);
  }, []);

  useEffect(() => {
    if (!transactionId) {
      setState('error');
      setStatusText('No se recibio el ID de la transaccion.');
      return;
    }

    async function verify() {
      try {
        const res = await api.get<{
          success: boolean;
          data: {
            status: string;
            amount_in_cents: number;
            reference: string;
            payment_method_type: string;
          };
        }>(`/wompi/transaction/${transactionId}`);

        if (!res.success || !res.data) {
          throw new Error('No se pudo verificar la transaccion');
        }

        const tx = res.data;
        setAmount(tx.amount_in_cents);
        setReference(tx.reference);

        if (tx.status === 'APPROVED') {
          setState('approved');
          setStatusText('Pago aprobado');
        } else if (tx.status === 'PENDING') {
          setState('polling');
          setStatusText('El pago esta siendo procesado...');
        } else if (['DECLINED', 'ERROR', 'VOIDED'].includes(tx.status)) {
          setState('declined');
          setStatusText(
            tx.status === 'DECLINED'
              ? 'Pago rechazado'
              : `Estado: ${tx.status}`,
          );
        } else {
          setState('error');
          setStatusText(`Estado inesperado: ${tx.status}`);
        }
      } catch (err: any) {
        setState('error');
        setStatusText(err.message || 'Error al verificar la transaccion');
      }
    }

    verify();
  }, [transactionId]);

  useEffect(() => {
    if (state !== 'polling' || !transactionId) return;

    pollingCountRef.current = 0;
    pollingRef.current = setInterval(async () => {
      pollingCountRef.current += 1;

      if (pollingCountRef.current >= POLLING_LIMIT) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setState('declined');
        setStatusText('El pago aun esta pendiente. Revisa tus pedidos mas tarde.');
        return;
      }

      try {
        const res = await api.get<{
          success: boolean;
          data: { status: string };
        }>(`/wompi/transaction/${transactionId}`);

        const status = res.data?.status;

        if (status === 'APPROVED') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setState('approved');
          setStatusText('Pago aprobado');
        } else if (['DECLINED', 'ERROR', 'VOIDED'].includes(status || '')) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setState('declined');
          setStatusText(
            status === 'DECLINED' ? 'Pago rechazado' : `Estado: ${status}`,
          );
        }
      } catch {
        // keep polling on transient errors
      }
    }, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [state, transactionId]);

  return (
    <>
      <Header />
      <CartSidebar />
      <main className="flex min-h-dynamic items-center justify-center pb-16 tablet:pb-0">
        <div className="mx-auto max-w-md px-4 text-center">
          {(state === 'loading' || state === 'polling') && (
            <div>
              <Loader2 size={40} className="mx-auto animate-spin text-brand-gold" />
              <h1 className="mt-6 font-display text-2xl font-bold">
                {state === 'loading' ? 'Verificando tu pago...' : 'Tu pago esta siendo procesado'}
              </h1>
              <p className="mt-2 text-sm text-brand-stone">
                {state === 'loading'
                  ? 'Estamos confirmando tu transaccion con Wompi.'
                  : 'Esto puede tomar unos segundos. No cierres esta pagina.'}
              </p>
            </div>
          )}

          {state === 'approved' && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Check size={32} className="text-green-600" />
              </div>
              <h1 className="mt-6 font-display text-3xl font-bold">Pago exitoso!</h1>
              <p className="mt-3 text-sm text-brand-stone">
                Tu pedido ha sido confirmado. Recibiras un correo con los detalles.
              </p>
              {amount > 0 && (
                <p className="mt-2 text-lg font-semibold text-brand-black">
                  Total pagado: {formatCOP(amount)}
                </p>
              )}
              {reference && (
                <p className="mt-1 text-xs text-brand-stone">
                  Referencia: {reference}
                </p>
              )}
              <Link
                href="/account"
                className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-brand-black px-8 text-xs font-medium uppercase tracking-wider text-white"
              >
                Ver mis pedidos
              </Link>
            </>
          )}

          {(state === 'declined' || state === 'error') && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle size={32} className="text-red-500" />
              </div>
              <h1 className="mt-6 font-display text-3xl font-bold">
                {state === 'declined' ? 'Pago rechazado' : 'Error de verificacion'}
              </h1>
              <p className="mt-3 text-sm text-brand-stone">{statusText}</p>
              <button
                onClick={() => router.push('/checkout')}
                className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-brand-black px-8 text-xs font-medium uppercase tracking-wider text-white"
              >
                Intentar de nuevo
              </button>
            </>
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmationContent />
    </Suspense>
  );
}
