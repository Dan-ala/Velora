'use client';

import * as ToastPrimitive from '@radix-ui/react-toast';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {toasts.map((t) => (
        <ToastPrimitive.Root
          key={t.id}
          open={t.open}
          onOpenChange={(open) => {
            if (!open) dismiss(t.id);
          }}
          className={
            'fixed bottom-4 right-4 z-[100] flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg ' +
            'data-[state=open]:animate-in data-[state=closed]:animate-out ' +
            'data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 ' +
            'data-[state=open]:slide-in-from-right-full data-[state=closed]:slide-out-to-right-full ' +
            'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] ' +
            'data-[swipe=cancel]:translate-x-0 ' +
            'data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] ' +
            (t.variant === 'destructive'
              ? 'bg-destructive text-white'
              : t.variant === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-brand-black text-white')
          }
        >
          <div className="flex-1">
            {t.title && (
              <ToastPrimitive.Title className="text-sm font-medium">
                {t.title}
              </ToastPrimitive.Title>
            )}
            {t.description && (
              <ToastPrimitive.Description className="mt-0.5 text-xs opacity-80">
                {t.description}
              </ToastPrimitive.Description>
            )}
          </div>
          <ToastPrimitive.Close className="flex-shrink-0 rounded-lg p-1 opacity-70 transition-opacity hover:opacity-100">
            <X size={14} />
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-[100] m-0 flex max-w-[420px] list-none flex-col gap-2 p-4 outline-none" />
    </ToastPrimitive.Provider>
  );
}
