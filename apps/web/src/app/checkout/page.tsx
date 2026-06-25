'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Check, Lock, Landmark, Zap, Smartphone, CreditCard, ExternalLink, ChevronDown, ShieldCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FinancialInstitution {
  code: string;
  name: string;
}

type PaymentMethod = 'PSE' | 'BANCOLOMBIA_TRANSFER' | 'NEQUI' | 'CARD';

interface PaymentState {
  step: 'select' | 'form' | 'processing' | 'redirecting' | 'pending' | 'complete' | 'failed';
  method: PaymentMethod | null;
  transactionId: string | null;
  reference: string | null;
  asyncPaymentUrl: string | null;
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const { locale, t } = useLocale();
  const { items, getTotal, clearCart } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [payment, setPayment] = useState<PaymentState>({
    step: 'select',
    method: null,
    transactionId: null,
    reference: null,
    asyncPaymentUrl: null,
  });
  const [institutions, setInstitutions] = useState<FinancialInstitution[]>([]);
  const [selectedBank, setSelectedBank] = useState('');
  const [bankOpen, setBankOpen] = useState(false);
  const [pseForm, setPseForm] = useState({
    documentType: 'CC',
    documentNumber: '',
    fullName: '',
    phoneNumber: '',
  });

  const total = getTotal();
  const shipping = total >= 200000 ? 0 : 15000;
  const grandTotal = total + shipping;

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  const wompiReference = searchParams.get('wompi_reference');

  const checkTransactionStatus = useCallback(async (id: string) => {
    setIsProcessing(true);
    setError('');

    try {
      const res = await api.post<{ success: boolean; data: any }>('/payments/confirm', {
        paymentIntentId: id,
        provider: 'wompi',
      });

      if (res.success) {
        clearCart();
        setPayment((prev) => ({ ...prev, step: 'complete' }));
      }
    } catch (err: any) {
      setError(err.message || 'Transaction not completed');
      setPayment((prev) => ({ ...prev, step: 'failed' }));
    } finally {
      setIsProcessing(false);
    }
  }, [clearCart]);

  useEffect(() => {
    if (wompiReference && payment.step === 'select') {
      setPayment((prev) => ({
        ...prev,
        step: 'pending',
        reference: wompiReference,
      }));
      checkTransactionStatus(wompiReference);
    }
  }, [wompiReference, payment.step, checkTransactionStatus]);

  const fetchInstitutions = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: FinancialInstitution[] }>(
        '/payments/wompi/financial-institutions',
      );
      setInstitutions(res.data || []);
    } catch {
      // fallback banks if API fails
      setInstitutions([
        { code: '1001', name: 'Bancolombia' },
        { code: '1002', name: 'Banco de Bogotá' },
        { code: '1003', name: 'Davivienda' },
        { code: '1004', name: 'Banco Popular' },
        { code: '1005', name: 'BBVA Colombia' },
        { code: '1006', name: 'Banco de Occidente' },
        { code: '1007', name: 'Nequi' },
      ]);
    }
  }, []);

  const handleCardPayment = async () => {
    const checkoutTotal = getTotal();
    if (checkoutTotal < 1500) {
      toast({ title: 'El monto mínimo para pagar con Wompi es $1,500 COP', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      await syncCartToBackend();

      const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error('Wompi no está configurado');
      }

      const res = await api.post<{
        success: boolean;
        data: { orderId: string; reference: string; signature: string; amountInCents: number };
      }>('/payments/wompi/card-init');

      const { reference, signature, amountInCents } = res.data;

      setPayment((prev) => ({
        ...prev,
        step: 'redirecting',
        transactionId: null,
        reference,
      }));

      const redirectUrl = `${window.location.origin}/checkout?wompi_reference=${reference}`;

      const script = document.createElement('script');
      script.src = 'https://checkout.wompi.co/widget.js';
      script.onload = () => {
        const WidgetCheckout = (window as any).WidgetCheckout;
        if (!WidgetCheckout) {
          setError('Error al cargar el widget de pago');
          setIsProcessing(false);
          return;
        }

        const checkout = new WidgetCheckout({
          currency: 'COP',
          amountInCents,
          reference,
          publicKey,
          signature: { integrity: signature },
          redirectUrl,
          customerEmail: user?.email || '',
        });

        checkout.open(() => {
          setIsProcessing(false);
        });
      };
      script.onerror = () => {
        setError('Error al cargar el widget de pago');
        setIsProcessing(false);
      };
      document.head.appendChild(script);
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago');
      setPayment((prev) => ({ ...prev, step: 'failed' }));
      setIsProcessing(false);
    }
  };

  const handleSelectMethod = (method: PaymentMethod) => {
    setPayment((prev) => ({ ...prev, method }));
    if (method === 'CARD') {
      handleCardPayment();
    } else if (method === 'PSE') {
      setPayment((prev) => ({ ...prev, step: 'form' }));
      fetchInstitutions();
    } else if (method === 'NEQUI' || method === 'BANCOLOMBIA_TRANSFER') {
      setPayment((prev) => ({ ...prev, step: 'form' }));
    } else {
      handleCreateTransaction(method);
    }
  };

  const syncCartToBackend = async () => {
    await api.put('/cart/sync', {
      items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    });
  };

  const handleCreateTransaction = async (method: PaymentMethod, pseData?: typeof pseForm) => {
    const checkoutTotal = getTotal();
    if (checkoutTotal < 1500) {
      toast({ title: 'El monto mínimo para pagar con Wompi es $1,500 COP', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      await syncCartToBackend();

      const body: Record<string, unknown> = {
        paymentMethodType: method,
      };

      if (pseData) {
        body.userType = 0;
        body.userLegalIdType = pseData.documentType;
        body.userLegalId = pseData.documentNumber;
        body.fullName = pseData.fullName;
        body.phoneNumber = pseData.phoneNumber;
        if (method === 'PSE') {
          body.financialInstitutionCode = selectedBank;
        }
      }

      const res = await api.post<{
        success: boolean;
        data: {
          transactionId: string;
          reference: string;
          asyncPaymentUrl: string | null;
          status: string;
        };
      }>('/payments/wompi/create', body);

      const { transactionId, reference, asyncPaymentUrl, status } = res.data;

      setPayment((prev) => ({
        ...prev,
        transactionId,
        reference,
        asyncPaymentUrl,
        step: asyncPaymentUrl ? 'redirecting' : 'pending',
      }));

      if (asyncPaymentUrl) {
        window.location.href = asyncPaymentUrl;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create transaction');
      setPayment((prev) => ({ ...prev, step: 'failed' }));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (payment.method) {
      handleCreateTransaction(payment.method, pseForm);
    }
  };

  const handleConfirmOrder = async () => {
    if (!payment.transactionId) return;
    await checkTransactionStatus(payment.transactionId);
  };

  if (payment.step === 'complete') {
    return (
      <>
        <Header />
        <CartSidebar />
        <main className="flex min-h-dynamic items-center justify-center pb-16 tablet:pb-0">
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
        <main className="flex min-h-dynamic items-center justify-center pb-16 tablet:pb-0">
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

  const methods: { id: PaymentMethod; icon: typeof Landmark; label: string; desc: string; badge?: string }[] = [
    { id: 'PSE', icon: Landmark, label: t('checkout.pse'), desc: t('checkout.pseDesc'), badge: 'Débito' },
    { id: 'BANCOLOMBIA_TRANSFER', icon: Zap, label: 'Bre-B', desc: t('checkout.brebDesc'), badge: '24/7' },
    { id: 'NEQUI', icon: Smartphone, label: t('checkout.nequi'), desc: t('checkout.nequiDesc'), badge: 'Rápido' },
    { id: 'CARD', icon: CreditCard, label: t('checkout.card'), desc: t('checkout.cardDesc'), badge: 'Débito/Crédito' },
  ];

  return (
    <>
      <Header />
      <CartSidebar />

      <main className="min-h-dynamic pb-16 tablet:pb-0">
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
                <h2 className="text-sm font-semibold uppercase tracking-wider">{t('checkout.paymentMethod')}</h2>

                {payment.step === 'select' && (
                  <div className="mt-4 grid gap-3">
                    {methods.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleSelectMethod(m.id)}
                        disabled={isProcessing}
                        className="group flex items-center gap-4 rounded-xl border border-brand-ivory p-4 text-left transition-all hover:border-brand-gold hover:bg-brand-ivory/30 hover:shadow-md disabled:opacity-50"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-ivory transition-colors group-hover:bg-brand-gold/10">
                          <m.icon size={20} className="text-brand-black transition-colors group-hover:text-brand-gold" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{m.label}</p>
                            {m.badge && (
                              <span className="rounded-full bg-brand-gold/10 px-2 py-0.5 text-[10px] font-medium text-brand-gold">
                                {m.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-brand-stone">{m.desc}</p>
                        </div>
                        <ChevronDown size={16} className="text-brand-stone -rotate-90 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    ))}
                    <div className="mt-2 flex items-center justify-center gap-2 text-[10px] text-brand-stone">
                      <ShieldCheck size={12} className="text-brand-gold" />
                      <span>{t('checkout.wompiProcessing')}</span>
                    </div>
                  </div>
                )}

                {payment.step === 'form' && payment.method && payment.method !== 'CARD' && (
                  <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
                    {payment.method === 'PSE' && (
                      <div className="relative">
                        <label className="text-xs font-medium uppercase tracking-wider text-brand-stone">
                          {t('checkout.selectBank')}
                        </label>
                        <button
                          type="button"
                          onClick={() => setBankOpen(!bankOpen)}
                          className="mt-1 flex h-11 w-full items-center justify-between rounded-xl border border-brand-ivory px-4 text-sm text-brand-black transition-colors hover:border-brand-gold"
                        >
                          <span className={selectedBank ? 'text-brand-black' : 'text-brand-stone'}>
                            {selectedBank
                              ? institutions.find((i) => i.code === selectedBank)?.name || selectedBank
                              : t('checkout.selectBank')}
                          </span>
                          <ChevronDown size={14} className={cn('transition-transform', bankOpen && 'rotate-180')} />
                        </button>
                        {bankOpen && (
                          <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-brand-ivory bg-white shadow-lg">
                            {institutions.map((inst) => (
                              <button
                                key={inst.code}
                                type="button"
                                onClick={() => {
                                  setSelectedBank(inst.code);
                                  setBankOpen(false);
                                }}
                                className={cn(
                                  'w-full px-4 py-2.5 text-left text-sm text-brand-black transition-colors hover:bg-brand-ivory',
                                  selectedBank === inst.code && 'bg-brand-ivory font-medium',
                                )}
                              >
                                {inst.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-medium uppercase tracking-wider text-brand-stone">
                        {t('checkout.documentType')}
                      </label>
                      <select
                        value={pseForm.documentType}
                        onChange={(e) => setPseForm((prev) => ({ ...prev, documentType: e.target.value }))}
                        className="mt-1 h-11 w-full rounded-xl border border-brand-ivory px-4 text-sm"
                      >
                        <option value="CC">{t('checkout.cc')}</option>
                        <option value="CE">{t('checkout.ce')}</option>
                        <option value="NIT">{t('checkout.nit')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium uppercase tracking-wider text-brand-stone">
                        {t('checkout.documentNumber')}
                      </label>
                      <input
                        type="text"
                        value={pseForm.documentNumber}
                        onChange={(e) => setPseForm((prev) => ({ ...prev, documentNumber: e.target.value }))}
                        required
                        className="mt-1 h-11 w-full rounded-xl border border-brand-ivory px-4 text-sm outline-none transition-colors focus:border-brand-gold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium uppercase tracking-wider text-brand-stone">
                        {t('checkout.fullName')}
                      </label>
                      <input
                        type="text"
                        value={pseForm.fullName}
                        onChange={(e) => setPseForm((prev) => ({ ...prev, fullName: e.target.value }))}
                        required
                        className="mt-1 h-11 w-full rounded-xl border border-brand-ivory px-4 text-sm outline-none transition-colors focus:border-brand-gold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium uppercase tracking-wider text-brand-stone">
                        {t('checkout.phoneNumber')}
                      </label>
                      <input
                        type="tel"
                        value={pseForm.phoneNumber}
                        onChange={(e) => setPseForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                        required={payment.method === 'NEQUI'}
                        className="mt-1 h-11 w-full rounded-xl border border-brand-ivory px-4 text-sm outline-none transition-colors focus:border-brand-gold"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setPayment((prev) => ({ ...prev, step: 'select', method: null }))}
                        className="flex h-12 flex-1 items-center justify-center rounded-full border border-brand-ivory text-sm font-medium transition-colors hover:bg-brand-ivory"
                      >
                        {t('common.backToProducts')}
                      </button>
                      <button
                        type="submit"
                        disabled={isProcessing || (payment.method === 'PSE' && !selectedBank)}
                        className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand-black text-sm font-medium uppercase tracking-wider text-white transition-all hover:bg-brand-black/90 disabled:opacity-50"
                      >
                        {isProcessing
                          ? t('checkout.processingPayment')
                          : payment.method === 'PSE'
                            ? t('checkout.payWithPse')
                            : payment.method === 'NEQUI'
                              ? t('checkout.payWithNequi')
                              : payment.method === 'BANCOLOMBIA_TRANSFER'
                                ? t('checkout.payWithBreb')
                                : t('checkout.payWithCard')}
                      </button>
                    </div>
                  </form>
                )}

                {(payment.step === 'redirecting' || payment.step === 'pending') && (
                  <div className="mt-6 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-ivory">
                      <ExternalLink size={24} className="text-brand-gold" />
                    </div>
                    <p className="mt-4 text-sm font-medium">
                      {payment.step === 'redirecting'
                        ? t('checkout.redirectingToWompi')
                        : t('checkout.paymentPendingDesc')}
                    </p>
                    {payment.step === 'pending' && (
                      <button
                        onClick={handleConfirmOrder}
                        disabled={isProcessing}
                        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-black text-sm font-medium uppercase tracking-wider text-white transition-all hover:bg-brand-black/90 disabled:opacity-50"
                      >
                        {isProcessing ? t('checkout.processingPayment') : t('checkout.placeOrder', { amount: formatCurrency(grandTotal, currencyLocale(locale)) })}
                      </button>
                    )}
                  </div>
                )}

                {payment.step === 'failed' && (
                  <div className="mt-6 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                      <Check size={24} className="text-red-500" />
                    </div>
                    <p className="mt-4 text-sm font-medium">{t('checkout.paymentFailed')}</p>
                    <p className="mt-1 text-xs text-brand-stone">{error || t('checkout.paymentFailedDesc')}</p>
                    <button
                      onClick={() => setPayment((prev) => ({ ...prev, step: 'select', method: null }))}
                      className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-black text-sm font-medium uppercase tracking-wider text-white transition-all hover:bg-brand-black/90"
                    >
                      {t('checkout.tryAgain')}
                    </button>
                  </div>
                )}
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

                {error && payment.step === 'select' && (
                  <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">{error}</p>
                )}

                {payment.step === 'select' && (
                  <p className="mt-6 text-center text-[10px] text-brand-stone">
                    {t('checkout.secureNotice')}
                  </p>
                )}

                {payment.step === 'pending' && (
                  <button
                    onClick={handleConfirmOrder}
                    disabled={isProcessing}
                    className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-black text-sm font-medium uppercase tracking-wider text-white transition-all hover:bg-brand-black/90 disabled:opacity-50"
                  >
                    <Lock size={14} />
                    {isProcessing ? t('checkout.processingPayment') : t('checkout.placeOrder', { amount: formatCurrency(grandTotal, currencyLocale(locale)) })}
                  </button>
                )}
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
