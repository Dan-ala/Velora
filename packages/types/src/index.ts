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
  shippingCost: number | null;
  status: OrderStatus;
  reference: string | null;
  paymentStatus: string | null;
  paymentMethod: string | null;
  phoneNumber: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  shippingStatus: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  estimatedDelivery: string | null;
  createdAt: string;
  items: OrderItem[];
  payments?: Payment[];
  user?: { id: string; email: string };
  timeline?: OrderTimeline[];
  notes?: OrderNote[];
  guides?: ShippingGuide[];
  trackingToken?: TrackingToken | null;
  notificationLogs?: NotificationLog[];
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
export type OrderEventType = 'order_created' | 'payment_confirmed' | 'preparing' | 'packed' | 'guide_generated' | 'handed_to_carrier' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned' | 'note_added';
export type NotificationChannelType = 'email' | 'whatsapp' | 'sms' | 'push';

export interface OrderTimeline {
  id: string;
  orderId: string;
  event: OrderEventType;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface OrderNote {
  id: string;
  orderId: string;
  content: string;
  authorId: string | null;
  author?: { id: string; email: string };
  createdAt: string;
}

export interface ShippingGuide {
  id: string;
  orderId: string;
  provider: string;
  guideNumber: string;
  trackingUrl: string | null;
  labelUrl: string | null;
  barcodeUrl: string | null;
  cost: number | null;
  status: string;
  createdAt: string;
}

export interface TrackingToken {
  id: string;
  orderId: string;
  token: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface NotificationLog {
  id: string;
  orderId: string;
  channel: NotificationChannelType;
  event: OrderEventType;
  status: string;
  recipient: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

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

export type Category = 'camisetas' | 'buzos' | 'zapatos' | 'pantalones' | 'abrigos' | 'accesorios';

export const CATEGORIES: Category[] = [
  'camisetas',
  'buzos',
  'zapatos',
  'pantalones',
  'abrigos',
  'accesorios',
];

export const CATEGORY_LABELS: Record<Category, string> = {
  camisetas: 'Camisetas',
  buzos: 'Buzos y Esqueletos',
  zapatos: 'Zapatos y Calzado',
  pantalones: 'Pantalones, Bermudas y Shorts',
  abrigos: 'Abrigos y Chaquetas',
  accesorios: 'Accesorios',
};
