'use client';

import { useState, useEffect } from 'react';

export type ToastVariant = 'default' | 'destructive' | 'success';

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  open: boolean;
}

type Listener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l([...toasts]));
}

export function toast(t: Omit<Toast, 'id' | 'open'>) {
  const id = Math.random().toString(36).slice(2, 10);
  toasts = [...toasts, { ...t, id, open: true }];
  emit();
  setTimeout(() => {
    toasts = toasts.map((item) => (item.id === id ? { ...item, open: false } : item));
    emit();
    setTimeout(() => {
      toasts = toasts.filter((item) => item.id !== id);
      emit();
    }, 200);
  }, 4000);
}

export function dismiss(id: string) {
  toasts = toasts.map((item) => (item.id === id ? { ...item, open: false } : item));
  emit();
  setTimeout(() => {
    toasts = toasts.filter((item) => item.id !== id);
    emit();
  }, 200);
}

export function useToast() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener: Listener = () => forceUpdate((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return { toasts, toast, dismiss };
}
