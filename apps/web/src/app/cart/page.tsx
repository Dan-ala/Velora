'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BottomNav } from '@/components/layout/bottom-nav';
import { CartSidebar } from '@/components/layout/cart-sidebar';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';
import { formatCurrency } from '@/lib/utils';
import { Minus, Plus, ShoppingBag, Trash2, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal, getItemCount } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const total = getTotal();
  const itemCount = getItemCount();
  const freeShippingThreshold = 200000;

  return (
    <>
      <Header />
      <CartSidebar />

      <main className="min-h-screen pb-16 tablet:pb-0">
        <div className="bg-brand-black py-12 tablet:py-16">
          <div className="mx-auto max-w-7xl px-4 tablet:px-6 wide:px-8">
            <h1 className="font-display text-3xl font-bold text-white tablet:text-5xl">Shopping Cart</h1>
            <p className="mt-2 text-sm text-brand-stone">{itemCount} items</p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 tablet:px-6 wide:px-8">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ShoppingBag size={64} className="mb-6 text-brand-stone/30" />
              <h2 className="text-xl font-semibold">Your cart is empty</h2>
              <p className="mt-2 text-sm text-brand-stone">Add some products to get started</p>
              <Link
                href="/products"
                className="mt-6 flex h-11 items-center justify-center rounded-full bg-brand-black px-8 text-xs font-medium uppercase tracking-wider text-white"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 tablet:grid-cols-3 desktop:grid-cols-4">
              <div className="space-y-4 tablet:col-span-2 desktop:col-span-3">
                {items.map((item) => (
                  <motion.div
                    key={item.productId}
                    layout
                    className="flex gap-4 rounded-xl bg-white p-4 shadow-sm"
                  >
                    <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-brand-ivory">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>

                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link
                            href={`/products/${item.productId}`}
                            className="text-sm font-medium hover:text-brand-gold transition-colors"
                          >
                            {item.name}
                          </Link>
                          <p className="mt-1 text-sm font-semibold text-brand-gold">
                            {formatCurrency(item.price)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-brand-stone transition-colors hover:text-destructive"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border transition-colors hover:bg-brand-ivory"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border transition-colors hover:bg-brand-ivory"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="tablet:col-span-1">
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-wider">Order Summary</h3>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-brand-stone">Subtotal</span>
                      <span className="font-medium">{formatCurrency(total)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-brand-stone">Shipping</span>
                      <span className="font-medium">
                        {total >= freeShippingThreshold ? 'Free' : formatCurrency(15000)}
                      </span>
                    </div>
                    {total < freeShippingThreshold && (
                      <p className="text-[10px] text-brand-gold">
                        Add {formatCurrency(freeShippingThreshold - total)} more for free shipping
                      </p>
                    )}
                    <hr />
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span>Total</span>
                      <span>{formatCurrency(total + (total >= freeShippingThreshold ? 0 : 15000))}</span>
                    </div>
                  </div>

                  {user ? (
                    <Link
                      href="/checkout"
                      className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-brand-black text-sm font-medium uppercase tracking-wider text-white transition-all hover:bg-brand-black/90"
                    >
                      Checkout
                    </Link>
                  ) : (
                    <Link
                      href="/auth/login"
                      className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-brand-black text-sm font-medium uppercase tracking-wider text-white transition-all hover:bg-brand-black/90"
                    >
                      Sign in to Checkout
                    </Link>
                  )}

                  <Link
                    href="/products"
                    className="mt-3 flex w-full items-center justify-center gap-2 text-xs uppercase tracking-wider text-brand-stone transition-colors hover:text-brand-black"
                  >
                    <ArrowLeft size={14} /> Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <BottomNav />
    </>
  );
}
