'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BottomNav } from '@/components/layout/bottom-nav';
import { CartSidebar } from '@/components/layout/cart-sidebar';
import { ProductCard } from '@/components/product/product-card';
import { api } from '@/lib/api';
import { CATEGORIES, CATEGORY_LABELS } from '@velora/types';
import { motion } from 'framer-motion';
import Link from 'next/link';
import type { Product } from '@velora/types';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setActiveCategory(params.get('category') || '');
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (activeCategory) params.set('category', activeCategory);
    params.set('limit', '50');

    api.get<{ success: boolean; data: Product[] }>(`/products?${params.toString()}`)
      .then((res) => setProducts(Array.isArray(res.data) ? res.data : []))
      .catch(() => setProducts([]))
      .finally(() => setIsLoading(false));
  }, [activeCategory]);

  return (
    <>
      <Header />
      <CartSidebar />
      <main className="min-h-screen pb-16 tablet:pb-0">
        <div className="bg-brand-black py-12 tablet:py-16">
          <div className="mx-auto max-w-7xl px-4 tablet:px-6 wide:px-8">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-3xl font-bold text-white tablet:text-5xl"
            >
              {activeCategory && CATEGORY_LABELS[activeCategory as keyof typeof CATEGORY_LABELS]
                ? CATEGORY_LABELS[activeCategory as keyof typeof CATEGORY_LABELS]
                : 'All Products'}
            </motion.h1>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 tablet:px-6 wide:px-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Link
              href="/products"
              onClick={() => setActiveCategory('')}
              className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all ${
                !activeCategory
                  ? 'bg-brand-black text-white'
                  : 'bg-brand-ivory text-brand-stone hover:bg-brand-black/10'
              }`}
            >
              All
            </Link>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/products?category=${cat}`}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all ${
                  activeCategory === cat
                    ? 'bg-brand-black text-white'
                    : 'bg-brand-ivory text-brand-stone hover:bg-brand-black/10'
                }`}
              >
                {CATEGORY_LABELS[cat]}
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
            ) : products.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-brand-stone">No products found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 tablet:grid-cols-3 desktop:grid-cols-4">
                {products.map((product) => (
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
