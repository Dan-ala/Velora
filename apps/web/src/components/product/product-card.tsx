'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency, currencyLocale } from '@/lib/utils';
import { useCartStore } from '@/stores/cart-store';
import { useLocale } from '@/providers/locale-provider';
import { ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import type { Product } from '@velora/types';
import { cn } from '@/lib/utils';
import { useRef, useCallback } from 'react';

interface Props {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const { locale, t } = useLocale();
  const image = product.images?.[0];
  const hasDiscount = false;
  const addingRef = useRef(false);

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (addingRef.current) return;
    if (image) {
      addingRef.current = true;
      addItem({
        id: product.id,
        productId: product.id,
        name: product.name,
        price: product.price,
        image: image.url,
        stock: product.stock,
      });
      openCart();
      toast({ title: t('common.addedToCart'), description: product.name, variant: 'success' });
      setTimeout(() => { addingRef.current = false; }, 500);
    }
  }, [addItem, openCart, t, image, product]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4 }}
      className="group relative"
    >
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-brand-ivory">
          {image ? (
            <Image
              src={image.url}
              alt={product.name}
              fill
              priority={priority}
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-brand-stone">
              <ShoppingBag size={32} />
            </div>
          )}

          <div className="absolute inset-0 bg-brand-black/0 transition-colors duration-300 group-hover:bg-brand-black/5" />

          {product.stock <= 5 && product.stock > 0 && (
            <span className="absolute left-3 top-3 rounded-full bg-brand-gold px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-black">
              {t('common.lowStock')}
            </span>
          )}

          {product.stock === 0 && (
            <span className="absolute left-3 top-3 rounded-full bg-brand-black/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
              {t('common.outOfStock')}
            </span>
          )}

          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={cn(
              'absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300',
              product.stock === 0
                ? 'bg-brand-stone/50 cursor-not-allowed'
                : 'bg-white shadow-lg hover:bg-brand-gold hover:text-white translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100',
            )}
            aria-label={t('common.addToCart')}
          >
            <ShoppingBag size={16} />
          </button>
        </div>

        <div className="mt-3 space-y-1 px-1">
          <h3 className="text-sm font-medium text-brand-black line-clamp-1">{product.name}</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-brand-gold">
              {formatCurrency(product.price, currencyLocale(locale))}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-brand-stone">
              {product.category}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
