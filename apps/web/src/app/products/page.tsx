'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BottomNav } from '@/components/layout/bottom-nav';
import { CartSidebar } from '@/components/layout/cart-sidebar';
import { ProductCard } from '@/components/product/product-card';
import { CATEGORIES } from '@velora/types';
import { useLocale } from '@/providers/locale-provider';
import { useProducts } from '@/hooks/use-products';
import { motion } from 'framer-motion';
import Link from 'next/link';

function ProductsContent() {
  const { locale, t } = useLocale();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get('category') || '';
  const { data: products, isLoading } = useProducts(activeCategory || undefined);
  const firstBatch = useMemo(() => products?.slice(0, 4) ?? [], [products]);

  return (
    <>
      <Header />
      <CartSidebar />
      <main className="min-h-dynamic pb-16 tablet:pb-0">
        <div className="bg-brand-black py-12 tablet:py-16">
          <div className="mx-auto max-w-7xl px-4 tablet:px-6 wide:px-8">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-3xl font-bold text-white tablet:text-5xl"
            >
              {activeCategory ? t('nav.' + activeCategory) : t('common.viewAllProducts')}
            </motion.h1>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 tablet:px-6 wide:px-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Link
                href="/products"
                className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all ${
                  !activeCategory
                    ? 'bg-brand-black text-white'
                    : 'bg-brand-ivory text-brand-stone hover:bg-brand-black/10'
                }`}
              >
              {t('products.all')}
            </Link>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/products?category=${cat}`}
                className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all ${
                  activeCategory === cat
                    ? 'bg-brand-black text-white'
                    : 'bg-brand-ivory text-brand-stone hover:bg-brand-black/10'
                }`}
              >
                {t('nav.' + cat)}
              </Link>
            ))}
          </div>

          <div className="mt-8">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 tablet:grid-cols-3 desktop:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[3/4] rounded-xl bg-brand-ivory" />
                    <div className="mt-3 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-brand-ivory" />
                      <div className="h-4 w-1/3 rounded bg-brand-ivory" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !products || products.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-brand-stone">{t('common.noProducts')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 tablet:grid-cols-3 desktop:grid-cols-4">
                {firstBatch.map((product) => (
                  <ProductCard key={product.id} product={product} priority />
                ))}
                {products.slice(4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsContent />
    </Suspense>
  );
}
