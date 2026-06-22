'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BottomNav } from '@/components/layout/bottom-nav';
import { CartSidebar } from '@/components/layout/cart-sidebar';
import { ProductCard } from '@/components/product/product-card';
import { useLocale } from '@/providers/locale-provider';
import { api } from '@/lib/api';
import { Search as SearchIcon } from 'lucide-react';
import type { Product } from '@velora/types';

export default function SearchPage() {
  const { t } = useLocale();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: Product[] }>(`/products?search=${encodeURIComponent(q)}`);
      setResults(res.data || []);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  return (
    <>
      <Header />
      <CartSidebar />
      <main className="min-h-dynamic pb-16 tablet:pb-0">
        <div className="bg-brand-black py-12 tablet:py-16">
          <div className="mx-auto max-w-7xl px-4 tablet:px-6 wide:px-8">
            <div className="relative mx-auto max-w-lg">
              <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-stone" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('nav.searchProducts')}
                autoFocus
                className="h-12 w-full rounded-full border border-white/20 bg-transparent pl-12 pr-4 text-sm text-white outline-none placeholder:text-brand-stone/60 transition-colors focus:border-brand-gold"
              />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 tablet:px-6 wide:px-8">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 tablet:grid-cols-3 desktop:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] rounded-xl bg-brand-ivory" />
                  <div className="mt-3 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-brand-ivory" />
                    <div className="h-4 w-1/3 rounded bg-brand-ivory" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <>
              <p className="mb-6 text-sm text-brand-stone">{results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;</p>
              <div className="grid grid-cols-2 gap-4 tablet:grid-cols-3 desktop:grid-cols-4">
                {results.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          ) : query ? (
            <p className="text-center text-brand-stone">No results for &ldquo;{query}&rdquo;</p>
          ) : null}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
