'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BottomNav } from '@/components/layout/bottom-nav';
import { CartSidebar } from '@/components/layout/cart-sidebar';
import { api } from '@/lib/api';
import { useLocale } from '@/providers/locale-provider';
import { formatCurrency, currencyLocale } from '@/lib/utils';
import { useCartStore } from '@/stores/cart-store';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ShoppingBag, ChevronLeft, ChevronRight, Minus, Plus, Truck, Shield, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import type { Product } from '@velora/types';

export default function ProductDetailPage() {
  const params = useParams();
  const { locale, t } = useLocale();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const addingRef = useRef(false);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const images = product?.images?.length ? product.images : [{ url: '', publicId: '', position: 0, id: '' }];
  const isOutOfStock = product ? product.stock === 0 : true;

  const handleAddToCart = useCallback(() => {
    if (addingRef.current || !product) return;
    addingRef.current = true;
    setIsAdding(true);
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: images[0]?.url || '',
      stock: product.stock,
    });
    openCart();
    setTimeout(() => {
      addingRef.current = false;
      setIsAdding(false);
    }, 500);
  }, [addItem, openCart, product, images]);

  useEffect(() => {
    api.get<{ success: boolean; data: Product }>(`/products/${params.id}`)
      .then((res) => setProduct(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [params.id]);

  if (isLoading) {
    return (
      <>
        <Header />
        <CartSidebar />
        <main className="min-h-dynamic pb-16 tablet:pb-0">
          <div className="mx-auto max-w-7xl px-4 py-8 tablet:px-6">
            <div className="animate-pulse grid gap-8 tablet:grid-cols-2">
              <div className="aspect-[4/5] rounded-2xl bg-brand-ivory" />
              <div className="space-y-4">
                <div className="h-8 w-3/4 rounded bg-brand-ivory" />
                <div className="h-6 w-1/4 rounded bg-brand-ivory" />
                <div className="h-20 rounded bg-brand-ivory" />
              </div>
            </div>
          </div>
        </main>
        <BottomNav />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <CartSidebar />
        <main className="flex min-h-dynamic items-center justify-center pb-16 tablet:pb-0">
          <div className="text-center">
            <p className="text-brand-stone">{t('common.productNotFound')}</p>
            <Link href="/products" className="mt-4 inline-flex text-sm text-brand-gold underline underline-offset-4">
              {t('common.backToProducts')}
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
        <div className="mx-auto max-w-7xl px-4 py-6 tablet:px-6 wide:px-8">
          <Link
            href="/products"
            className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-wider text-brand-stone transition-colors hover:text-brand-black"
          >
            <ChevronLeft size={14} /> {t('common.backToProducts')}
          </Link>

          <div className="grid gap-8 tablet:grid-cols-2 tablet:gap-12">
            <div className="space-y-4">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-brand-ivory">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative h-full w-full"
                  >
                    {images[currentImage]?.url ? (
                      <Image
                        src={images[currentImage].url}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-brand-stone">
                        <ShoppingBag size={48} />
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                      className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-lg backdrop-blur-sm transition-colors hover:bg-white"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() => setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                      className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-lg backdrop-blur-sm transition-colors hover:bg-white"
                      aria-label="Next image"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}

                {isOutOfStock && (
                  <div className="absolute inset-0 flex items-center justify-center bg-brand-black/60 backdrop-blur-sm">
                    <span className="text-lg font-semibold uppercase tracking-widest text-white">
                      {t('common.outOfStock')}
                    </span>
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImage(i)}
                      className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg transition-all ${
                        i === currentImage ? 'ring-2 ring-brand-gold ring-offset-2' : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      <Image
                        src={img.url}
                        alt={`${product.name} ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
                {product.category}
              </p>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 font-display text-3xl font-bold text-brand-black tablet:text-4xl"
              >
                {product.name}
              </motion.h1>

              <p className="mt-4 text-2xl font-semibold text-brand-gold">
                {formatCurrency(product.price, currencyLocale(locale))}
              </p>

              <p className="mt-6 leading-relaxed text-brand-stone">{product.description}</p>

              <div className="mt-4 flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-destructive'}`}
                />
                <span className="text-xs text-brand-stone">
                  {product.stock > 10
                    ? t('common.inStock')
                    : product.stock > 0
                      ? t('common.onlyLeft', { stock: product.stock })
                      : t('common.outOfStock')}
                </span>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-medium uppercase tracking-wider">{t('common.quantity')}</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:bg-brand-ivory"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:bg-brand-ivory"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 tablet:flex-row">
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock || isAdding}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand-black text-sm font-medium uppercase tracking-wider text-white transition-all hover:bg-brand-black/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ShoppingBag size={16} />
                    {isOutOfStock ? t('common.outOfStock') : isAdding ? t('common.adding') || 'Adding...' : t('common.addToCart')}
                  </button>
                </div>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-4 border-t border-brand-ivory pt-8">
                <div className="text-center">
                  <Truck size={20} className="mx-auto text-brand-gold" />
                  <p className="mt-2 text-[10px] font-medium uppercase tracking-wider">
                    {t('common.freeShipping')}
                  </p>
                  <p className="mt-1 text-[10px] text-brand-stone">{t('common.over', { amount: formatCurrency(200000, currencyLocale(locale)) })}</p>
                </div>
                <div className="text-center">
                  <Shield size={20} className="mx-auto text-brand-gold" />
                  <p className="mt-2 text-[10px] font-medium uppercase tracking-wider">
                    {t('common.securePayment')}
                  </p>
                  <p className="mt-1 text-[10px] text-brand-stone">{t('common.secure')}</p>
                </div>
                <div className="text-center">
                  <RotateCcw size={20} className="mx-auto text-brand-gold" />
                  <p className="mt-2 text-[10px] font-medium uppercase tracking-wider">
                    {t('common.daysReturn')}
                  </p>
                  <p className="mt-1 text-[10px] text-brand-stone">{t('common.easyReturns')}</p>
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
