'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Package, ShoppingBag, TrendingUp, AlertTriangle, Plus, X, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Product, Order } from '@velora/types';

export default function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'inventory'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'shirts',
    stock: '0',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }
    loadData();
  }, [user, router, activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'products') {
        const res = await api.get<{ success: boolean; data: Product[] }>('/admin/products?limit=100');
        setProducts(res.data || []);
      } else if (activeTab === 'orders') {
        const res = await api.get<{ success: boolean; data: Order[] }>('/admin/orders?limit=100');
        setOrders(res.data || []);
      }
    } catch {}
    setIsLoading(false);
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      let imageUrl = '';
      let imagePublicId = '';

      if (imageFile) {
        const b64 = await toBase64(imageFile);
        const uploadRes = await api.post<{ success: boolean; data: { url: string; publicId: string } }>(
          '/cloudinary/upload',
          { image: b64, folder: 'velora' },
        );
        imageUrl = uploadRes.data.url;
        imagePublicId = uploadRes.data.publicId;
      }

      const productRes = await api.post<{ success: boolean; data: { id: string } }>('/admin/products', {
        name: formData.name,
        description: formData.description,
        price: parseInt(formData.price),
        category: formData.category,
        stock: parseInt(formData.stock),
      });

      if (imageUrl && imagePublicId) {
        await api.post(`/admin/products/${productRes.data.id}/images`, {
          url: imageUrl,
          publicId: imagePublicId,
        });
      }

      setShowProductForm(false);
      setFormData({ name: '', description: '', price: '', category: 'shirts', stock: '0' });
      setImageFile(null);
      setImagePreview(null);
      setIsUploading(false);
      loadData();
      toast({ title: 'Product created', variant: 'success' });
    } catch (err: any) {
      setIsUploading(false);
      toast({ title: 'Failed to create product', description: err.message, variant: 'destructive' });
    }
  };

  const handleUpdateStock = async (productId: string, stock: number) => {
    try {
      await api.put(`/admin/products/${productId}`, { stock });
      loadData();
      toast({ title: 'Stock updated', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Failed to update stock', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/admin/products/${productId}`);
      loadData();
      toast({ title: 'Product deleted', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Failed to delete product', description: err.message, variant: 'destructive' });
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status });
      loadData();
      toast({ title: 'Order status updated', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Failed to update order', description: err.message, variant: 'destructive' });
    }
  };

  if (!user || user.role !== 'admin') return null;

  const lowStockProducts = products.filter((p) => p.stock <= 10);
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="min-h-screen bg-brand-ivory">
      <header className="sticky top-0 z-50 bg-brand-black text-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 tablet:px-6">
          <div className="flex items-center gap-4">
            <span className="font-display text-lg font-bold tracking-[0.3em]">VELORA</span>
            <span className="rounded bg-brand-gold/20 px-2 py-0.5 text-[10px] font-medium text-brand-gold uppercase tracking-wider">
              Admin
            </span>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-xs text-brand-stone transition-colors hover:text-white"
          >
            View Store
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 tablet:px-6">
        <div className="grid grid-cols-2 gap-4 tablet:grid-cols-4">
          {[
            { label: 'Total Products', value: products.length, icon: ShoppingBag, color: 'text-blue-600 bg-blue-50' },
            { label: 'Total Orders', value: orders.length, icon: Package, color: 'text-purple-600 bg-purple-50' },
            { label: 'Revenue', value: formatCurrency(totalRevenue), icon: TrendingUp, color: 'text-green-600 bg-green-50' },
            { label: 'Low Stock', value: lowStockProducts.length, icon: AlertTriangle, color: 'text-orange-600 bg-orange-50' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-white p-4 shadow-sm">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-brand-stone">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-2 border-b border-brand-stone/20">
          {(['products', 'orders', 'inventory'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-xs font-medium uppercase tracking-wider transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-brand-black text-brand-black'
                  : 'text-brand-stone hover:text-brand-black'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === 'products' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-brand-stone">{products.length} products</p>
                <button
                  onClick={() => setShowProductForm(true)}
                  className="flex items-center gap-2 rounded-full bg-brand-black px-4 py-2 text-xs font-medium uppercase tracking-wider text-white"
                >
                  <Plus size={14} /> Add Product
                </button>
              </div>

              {showProductForm && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 rounded-xl bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">New Product</h3>
                    <button onClick={() => setShowProductForm(false)}>
                      <X size={16} />
                    </button>
                  </div>
                  <form onSubmit={handleCreateProduct} className="grid gap-4 tablet:grid-cols-2">
                    <input
                      placeholder="Product name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="rounded-lg border px-4 py-2.5 text-sm focus:border-brand-gold focus:outline-none"
                    />
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="rounded-lg border px-4 py-2.5 text-sm focus:border-brand-gold focus:outline-none"
                    >
                      <option value="shirts">Shirts</option>
                      <option value="hoodies">Hoodies</option>
                      <option value="shoes">Shoes</option>
                      <option value="pants">Pants</option>
                      <option value="accessories">Accessories</option>
                      <option value="outerwear">Outerwear</option>
                    </select>
                    <textarea
                      placeholder="Description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      className="rounded-lg border px-4 py-2.5 text-sm focus:border-brand-gold focus:outline-none"
                      rows={3}
                    />
                    <div className="flex gap-4">
                      <input
                        type="number"
                        placeholder="Price (COP)"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                        className="flex-1 rounded-lg border px-4 py-2.5 text-sm focus:border-brand-gold focus:outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Stock"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        required
                        className="w-24 rounded-lg border px-4 py-2.5 text-sm focus:border-brand-gold focus:outline-none"
                      />
                    </div>
                    <div className="tablet:col-span-2">
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-brand-stone/30 px-4 py-6 text-sm text-brand-stone transition-colors hover:border-brand-gold/50 hover:text-brand-gold"
                      >
                        {imagePreview ? (
                          <img src={imagePreview} alt="" className="h-16 w-16 rounded-lg object-cover" />
                        ) : (
                          <Upload size={20} />
                        )}
                        <span>{imagePreview ? 'Change image' : 'Click to upload product image'}</span>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setImageFile(file);
                            setImagePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </div>
                    <div className="tablet:col-span-2">
                      <button
                        type="submit"
                        disabled={isUploading}
                        className="flex items-center gap-2 rounded-full bg-brand-black px-6 py-2.5 text-xs font-medium uppercase tracking-wider text-white disabled:opacity-50"
                      >
                        {isUploading ? 'Uploading...' : 'Create Product'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-xl bg-white" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-xl bg-white px-6 py-4 shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-brand-ivory">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0].url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-brand-stone">
                              <Upload size={14} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{product.name}</p>
                          <p className="text-xs text-brand-stone">{product.category} — {formatCurrency(product.price)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-brand-stone">Stock:</span>
                          <input
                            type="number"
                            value={product.stock}
                            onChange={(e) => handleUpdateStock(product.id, parseInt(e.target.value))}
                            className="w-16 rounded-lg border px-2 py-1 text-xs text-center"
                          />
                        </div>
                        <label className="cursor-pointer text-xs text-brand-gold hover:underline">
                          Add Image
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.readAsDataURL(file);
                              reader.onload = async () => {
                                try {
                                  const uploadRes = await api.post<{ success: boolean; data: { url: string; publicId: string } }>(
                                    '/cloudinary/upload',
                                    { image: reader.result, folder: 'velora' },
                                  );
                                  await api.post(`/admin/products/${product.id}/images`, {
                                    url: uploadRes.data.url,
                                    publicId: uploadRes.data.publicId,
                                  });
                                  loadData();
                                  toast({ title: 'Image added', variant: 'success' });
                                } catch (err: any) {
                                  toast({ title: 'Failed to add image', description: err.message, variant: 'destructive' });
                                }
                              };
                            }}
                          />
                        </label>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-xs text-destructive hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-3">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl bg-white" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <p className="text-sm text-brand-stone">No orders yet</p>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="rounded-xl bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-brand-stone">
                          Order #{order.id.slice(0, 8)} — {formatDate(order.createdAt)}
                        </p>
                        <p className="mt-1 text-sm font-medium">{formatCurrency(order.total)}</p>
                      </div>
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        className="rounded-lg border px-3 py-1.5 text-xs font-medium capitalize focus:border-brand-gold focus:outline-none"
                      >
                        {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                      <p className="mt-2 text-xs text-brand-stone">
                        {order.items?.length || 0} items
                      </p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-3">
              {lowStockProducts.length === 0 ? (
                <p className="text-sm text-brand-stone">All products are well stocked</p>
              ) : (
                lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-xl bg-white p-6 shadow-sm"
                  >
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-brand-stone">{product.category}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          product.stock === 0
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-orange-50 text-orange-600'
                        }`}
                      >
                        {product.stock === 0 ? 'Out of stock' : `${product.stock} left`}
                      </span>
                      <input
                        type="number"
                        defaultValue={product.stock}
                        onBlur={(e) => handleUpdateStock(product.id, parseInt(e.target.value))}
                        className="w-16 rounded-lg border px-2 py-1 text-xs text-center"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
