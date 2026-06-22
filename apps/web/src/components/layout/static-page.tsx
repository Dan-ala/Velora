'use client';

import type { ReactNode } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { BottomNav } from '@/components/layout/bottom-nav';
import { CartSidebar } from '@/components/layout/cart-sidebar';

interface Props {
  title: string;
  children: ReactNode;
}

export function StaticPage({ title, children }: Props) {
  return (
    <>
      <Header />
      <CartSidebar />
      <main className="min-h-dynamic pb-16 tablet:pb-0">
        <div className="bg-brand-black py-12 tablet:py-16">
          <div className="mx-auto max-w-3xl px-4 tablet:px-6 wide:px-8">
            <h1 className="font-display text-3xl font-bold text-white tablet:text-5xl">{title}</h1>
          </div>
        </div>
        <div className="mx-auto max-w-3xl px-4 py-12 tablet:px-6 wide:px-8">
          {children}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
