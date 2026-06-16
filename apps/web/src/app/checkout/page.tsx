'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BottomNav } from '@/components/layout/bottom-nav';
import { CartSidebar } from '@/components/layout/cart-sidebar';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';
import { formatCurrency } from '@/lib/utils';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Check, Lock } from 'lucide-react';

export default function CheckoutPage() {
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
            <h1 className="mt-6 font-display text-3xl font-bold">Order Confirmed!</h1>
            <p className="mt-3 text-sm text-brand-stone">
              Thank you for your order. You will receive a confirmation email shortly.
            </p>
            <Link
              href="/account"
              className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-brand-black px-8 text-xs font-medium uppercase tracking-wider text-white"
            >
              View Orders
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
            <p className="text-brand-stone">Your cart is empty</p>
            <Link
              href="/products"
              className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-brand-black px-8 text-xs font-medium uppercase tracking-wider text-white"
            >
              Shop Now
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
            <h1 className="font-display text-3xl font-bold text-white tablet:text-5xl">Checkout</h1>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 tablet:px-6 wide:px-8">
          <div className="grid gap-8 tablet:grid-cols-3">
            <div className="space-y-6 tablet:col-span-2">
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-wider">Contact</h2>
                <p className="mt-1 text-sm text-brand-stone">{user?.email}</p>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-wider">Order Summary</h2>
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
                          <p className="text-xs text-brand-stone">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-medium">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-wider">Summary</h2>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-brand-stone">Subtotal</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-brand-stone">Shipping</span>
                    <span>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
                  </div>
                  <hr />
                  <div className="flex items-center justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(grandTotal)}</span>
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
                  {isProcessing ? 'Processing...' : `Pay ${formatCurrency(grandTotal)}`}
                </button>

                <p className="mt-4 text-center text-[10px] text-brand-stone">
                  Your payment is securely processed. We do not store credit card details.
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
