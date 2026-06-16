export type Role = 'customer' | 'admin';

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  createdAt: string;
  images: ProductImage[];
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  publicId: string;
  position: number;
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
}

export interface Order {
  id: string;
  userId: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
  user?: { id: string; email: string };
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  product: Product;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Payment {
  id: string;
  orderId: string;
  provider: PaymentProvider;
  status: PaymentStatus;
}

export type PaymentProvider = 'stripe' | 'wompi';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface InventoryEvent {
  id: string;
  productId: string;
  oldStock: number;
  newStock: number;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  session: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  };
}

export type Category = 'shirts' | 'hoodies' | 'shoes' | 'pants' | 'accessories' | 'outerwear';

export const CATEGORIES: Category[] = [
  'shirts',
  'hoodies',
  'shoes',
  'pants',
  'accessories',
  'outerwear',
];

export const CATEGORY_LABELS: Record<Category, string> = {
  shirts: 'Shirts',
  hoodies: 'Hoodies',
  shoes: 'Shoes',
  pants: 'Pants',
  accessories: 'Accessories',
  outerwear: 'Outerwear',
};
