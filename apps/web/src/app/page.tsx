'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BottomNav } from '@/components/layout/bottom-nav';
import { CartSidebar } from '@/components/layout/cart-sidebar';
import { ProductCard } from '@/components/product/product-card';
import { api } from '@/lib/api';
import { useLocale } from '@/providers/locale-provider';
import { formatCurrency, currencyLocale } from '@/lib/utils';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@velora/types';

const CATEGORIES: { slug: string; image: string }[] = [
  { slug: 'camisetas', image: 'https://res.cloudinary.com/dvjfilxjp/image/upload/q_auto,f_auto/v1/velora/category-shirts' },
  { slug: 'buzos', image: 'https://res.cloudinary.com/dvjfilxjp/image/upload/q_auto,f_auto/v1/velora/category-hoodies' },
  { slug: 'zapatos', image: 'https://res.cloudinary.com/dvjfilxjp/image/upload/q_auto,f_auto/v1/velora/category-shoes' },
  { slug: 'pantalones', image: 'https://res.cloudinary.com/dvjfilxjp/image/upload/q_auto,f_auto/v1/velora/category-shirts' },
  { slug: 'abrigos', image: 'https://res.cloudinary.com/dvjfilxjp/image/upload/q_auto,f_auto/v1/velora/category-hoodies' },
  { slug: 'accesorios', image: 'https://res.cloudinary.com/dvjfilxjp/image/upload/q_auto,f_auto/v1/velora/category-accessories' },
];

export default function HomePage() {
  const { locale, t } = useLocale();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const categoryLabels: Record<string, string> = {
    camisetas: t('nav.camisetas'),
    buzos: t('nav.buzos'),
    zapatos: t('nav.zapatos'),
    pantalones: t('nav.pantalones'),
    abrigos: t('nav.abrigos'),
    accesorios: t('nav.accesorios'),
  };

  useEffect(() => {
    setIsLoading(true);
    api.get<{ success: boolean; data: Product[] }>('/products/featured')
      .then((res) => setFeatured(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <>
      <Header />
      <CartSidebar />

      <main className="min-h-dynamic pb-16 tablet:pb-0">
        <section className="relative flex items-center justify-center overflow-hidden bg-brand-black" style={{ minHeight: '85dvh' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-brand-black via-brand-black/95 to-brand-olive/30" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(200,169,106,0.08)_0%,_transparent_60%)]" />

          <div className="relative z-10 mx-auto max-w-7xl px-4 text-center tablet:px-6">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold"
            >
              {t('home.premiumCollection')}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="font-display text-5xl font-bold leading-tight text-white tablet:text-7xl desktop:text-8xl"
            >
              {t('home.heroTitle')}
              <br />
              <span className="text-brand-gold">{t('home.heroTitleHighlight')}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mx-auto mt-6 max-w-md text-base text-brand-stone tablet:text-lg"
            >
              {t('home.heroDescription')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-10 flex flex-col items-center gap-4 tablet:flex-row tablet:justify-center"
            >
              <Link
                href="/products"
                className="flex h-12 w-full max-w-xs items-center justify-center rounded-full bg-brand-gold px-8 text-sm font-semibold uppercase tracking-wider text-brand-black transition-all hover:bg-brand-gold/90"
              >
                {t('home.shopNow')}
              </Link>
              <Link
                href="/products?sort=newest"
                className="flex h-12 w-full max-w-xs items-center justify-center rounded-full border border-white/20 px-8 text-sm font-medium uppercase tracking-wider text-white transition-all hover:bg-white/10"
              >
                {t('nav.newArrivals')}
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-16 flex items-center justify-center gap-8 text-xs text-brand-stone/60"
            >
              <span>{t('home.freeShipping', { amount: formatCurrency(200000, currencyLocale(locale)) })}</span>
              <span className="hidden h-4 w-px bg-brand-stone/30 tablet:block" />
              <span className="hidden tablet:block">{t('home.dayReturns')}</span>
              <span className="hidden h-4 w-px bg-brand-stone/30 desktop:block" />
              <span className="hidden desktop:block">{t('home.secureCheckout')}</span>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 tablet:px-6 wide:px-8">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
                {t('home.curatedSelection')}
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold text-brand-black tablet:text-4xl">
                {t('home.featuredProducts')}
              </h2>
            </div>
            <Link
              href="/products"
              className="hidden text-sm font-medium text-brand-black underline underline-offset-4 transition-colors hover:text-brand-gold tablet:block"
            >
              {t('common.viewAll')}
            </Link>
          </div>

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
          ) : featured.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-brand-stone">{t('common.noProducts')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 tablet:grid-cols-3 desktop:grid-cols-4">
              {featured.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} priority />
              ))}
              {featured.slice(4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="mt-8 text-center tablet:hidden">
            <Link
              href="/products"
              className="inline-flex h-11 items-center justify-center rounded-full border border-brand-black px-6 text-xs font-medium uppercase tracking-wider"
            >
              {t('common.viewAllProducts')}
            </Link>
          </div>
        </section>

        <section className="bg-brand-ivory py-20">
          <div className="mx-auto max-w-7xl px-4 tablet:px-6 wide:px-8">
            <div className="mb-10 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
                {t('home.collections')}
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold text-brand-black tablet:text-4xl">
                {t('home.shopByCategory')}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 tablet:grid-cols-4">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/products?category=${cat.slug}`}
                  className="group relative aspect-[3/4] overflow-hidden rounded-xl"
                >
                  <Image
                    src={cat.image}
                    alt={categoryLabels[cat.slug]}
                    fill
                    priority={cat.slug === 'camisetas' || cat.slug === 'buzos'}
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-lg font-semibold text-white">{categoryLabels[cat.slug]}</h3>
                    <p className="mt-1 text-xs text-brand-stone">{t('home.exploreCollection')}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-brand-black py-24">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-gold/5 to-transparent" />
          <div className="relative mx-auto max-w-7xl px-4 text-center tablet:px-6">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold"
            >
              {t('home.philosophy')}
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-4 font-display text-3xl font-bold text-white tablet:text-5xl"
            >
              {t('home.philosophyTitle')}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-brand-stone"
            >
              {t('home.philosophyDescription')}
            </motion.p>
          </div>
        </section>
      </main>

      <Footer />
      <BottomNav />
    </>
  );
}
