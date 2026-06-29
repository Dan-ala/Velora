import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Product } from '@velora/types';

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: Product[] }>('/products/featured');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });
}

export function useProducts(category?: string) {
  return useQuery({
    queryKey: ['products', category || 'all'],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      params.set('limit', '50');
      const res = await api.get<{ success: boolean; data: Product[] }>(`/products?${params.toString()}`);
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: Product }>(`/products/${id}`);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    enabled: !!id,
  });
}
