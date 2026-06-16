'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BottomNav } from '@/components/layout/bottom-nav';
import { CartSidebar } from '@/components/layout/cart-sidebar';
import { ProductCard } from '@/components/product/product-card';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@velora/types';

const CATEGORIES = [
  { name: 'Shirts', slug: 'shirts', image: 'https://res.cloudinary.com/dvjfilxjp/image/upload/q_auto,f_auto/v1/velora/category-shirts' },
  { name: 'Hoodies', slug: 'hoodies', image: 'https://res.cloudinary.com/dvjfilxjp/image/upload/q_auto,f_auto/v1/velora/category-hoodies' },
  { name: 'Shoes', slug: 'shoes', image: 'https://res.cloudinary.com/dvjfilxjp/image/upload/q_auto,f_auto/v1/velora/category-shoes' },
  { name: 'Accessories', slug: 'accessories', image: 'https://res.cloudinary.com/dvjfilxjp/image/upload/q_auto,f_auto/v1/velora/category-accessories' },
];

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    api.get<{ success: boolean; data: Product[] }>('/products/featured')
      .then((res) => setFeatured(res.data))
      .catch(() => {});
  }, []);

  return (
    <>
      <Header />
      <CartSidebar />

      <main className="min-h-screen pb-16 tablet:pb-0">
        <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden bg-brand-black">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-black via-brand-black/95 to-brand-olive/30" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(200,169,106,0.08)_0%,_transparent_60%)]" />

          <div className="relative z-10 mx-auto max-w-7xl px-4 text-center tablet:px-6">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold"
            >
              Premium Collection
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="font-display text-5xl font-bold leading-tight text-white tablet:text-7xl desktop:text-8xl"
            >
              Define Your
              <br />
              <span className="text-brand-gold">Identity</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mx-auto mt-6 max-w-md text-base text-brand-stone tablet:text-lg"
            >
              Discover premium clothing that speaks to your individuality. Every piece tells a story of elegance and confidence.
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
                Shop Now
              </Link>
              <Link
                href="/products?sort=newest"
                className="flex h-12 w-full max-w-xs items-center justify-center rounded-full border border-white/20 px-8 text-sm font-medium uppercase tracking-wider text-white transition-all hover:bg-white/10"
              >
                New Arrivals
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-16 flex items-center justify-center gap-8 text-xs text-brand-stone/60"
            >
              <span>Free shipping over {formatCurrency(200000)}</span>
              <span className="hidden h-4 w-px bg-brand-stone/30 tablet:block" />
              <span className="hidden tablet:block">30-day returns</span>
              <span className="hidden h-4 w-px bg-brand-stone/30 desktop:block" />
              <span className="hidden desktop:block">Secure checkout</span>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 tablet:px-6 wide:px-8">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
                Curated Selection
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold text-brand-black tablet:text-4xl">
                Featured Products
              </h2>
            </div>
            <Link
              href="/products"
              className="hidden text-sm font-medium text-brand-black underline underline-offset-4 transition-colors hover:text-brand-gold tablet:block"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 tablet:grid-cols-3 desktop:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-8 text-center tablet:hidden">
            <Link
              href="/products"
              className="inline-flex h-11 items-center justify-center rounded-full border border-brand-black px-6 text-xs font-medium uppercase tracking-wider"
            >
              View All Products
            </Link>
          </div>
        </section>

        <section className="bg-brand-ivory py-20">
          <div className="mx-auto max-w-7xl px-4 tablet:px-6 wide:px-8">
            <div className="mb-10 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
                Collections
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold text-brand-black tablet:text-4xl">
                Shop by Category
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
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-lg font-semibold text-white">{cat.name}</h3>
                    <p className="mt-1 text-xs text-brand-stone">Explore collection</p>
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
              The VELORA Philosophy
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-4 font-display text-3xl font-bold text-white tablet:text-5xl"
            >
              Wear your identity
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-brand-stone"
            >
              VELORA is more than clothing. It is a statement of elegance, confidence, and modern style. Every piece is crafted for those who embrace their uniqueness.
            </motion.p>
          </div>
        </section>
      </main>

      <Footer />
      <BottomNav />
    </>
  );
}
