import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Package, ShoppingBag, Palette, Settings, TrendingUp, Mail, Gift, Zap,
  FileText, Layout, Menu, ShoppingCart, Tag, Star, MessageSquare, Truck,
  CreditCard, Bell, BarChart3, Save, Eye, Plus, Edit2, Trash2,
  Search, Filter, DollarSign, Upload, RefreshCw, AlertCircle, Check, X,
  MapPin, Phone, Globe, Clock, Loader2, ArrowUpRight, ArrowDownRight, QrCode, Image, Home
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { storeService } from '../services/storeService';
import { subscriptionService } from '../services/subscriptionService';
import type { Store as StoreType, Product, Order } from '../types';

// ============================================
// TYPES
// ============================================

interface ProductForm {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image_url: string;
  status: 'active' | 'draft' | 'archived';
}

interface StoreSettings {
  tagline: string;
  description: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  primaryColor: string;
}

// ============================================
// MAIN DASHBOARD
// ============================================

export const StoreDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  // Core state
  const [store, setStore] = useState<StoreType | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Forms
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>({
    name: '', description: '', price: 0, stock: 0, category: '', image_url: '', status: 'active'
  });
  const [showProductModal, setShowProductModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // ============================================
  // DATA LOADING
  // ============================================

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Auth check
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login?redirect=/store-builder');
        return;
      }

      // Load store - prefer slug from URL, fallback to user's store
      let storeData: StoreType | null = null;
      if (slug) {
        storeData = await storeService.getStoreBySlug(slug);
      }
      if (!storeData) {
        storeData = await storeService.getMyStore();
      }

      if (!storeData) {
        setError('No store found. Create one first.');
        setLoading(false);
        return;
      }

      setStore(storeData);

      // Load products
      const storeProducts = await storeService.getProducts(storeData.id);
      setProducts(storeProducts);

      // Load orders
      const storeOrders = await storeService.getStoreOrders(storeData.id);
      setOrders(storeOrders);

    } catch (err: any) {
      console.error('Dashboard load error:', err);
      setError(err?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [navigate, slug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ============================================
  // PRODUCT OPERATIONS
  // ============================================

  const openCreateProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '', description: '', price: 0, stock: 0,
      category: '', image_url: '', status: 'active'
    });
    setShowProductModal(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock ?? 0,
      category: product.category || '',
      image_url: product.image_url || '',
      status: (product as any).status || 'active'
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async () => {
    if (!store) return;
    setSaving(true);
    setError(null);

    try {
      const payload = {
        store_id: store.id,
        name: productForm.name,
        description: productForm.description,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
        category: productForm.category,
        image_url: productForm.image_url,
        status: productForm.status,
      };

      let result;
      if (editingProduct) {
        result = await storeService.updateProduct(editingProduct.id, payload);
      } else {
        result = await storeService.createProduct(payload);
      }

      if (result) {
        setSuccess(editingProduct ? 'Product updated' : 'Product created');
        await loadData();
        setShowProductModal(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"?`)) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id);

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Product deleted');
      await loadData();
    }
  };

  // ============================================
  // IMAGE UPLOAD
  // ============================================

  const handleImageUpload = async (file: File) => {
    if (!store) return;
    setUploading(true);
    setError(null);

    try {
      const ext = file.name.split('.').pop();
      const filePath = `products/${store.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setProductForm(prev => ({ ...prev, image_url: publicUrl }));
      setSuccess('Image uploaded');
    } catch (err: any) {
      setError(err?.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  // ============================================
  // ORDER OPERATIONS
  // ============================================

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Order updated');
      await loadData();
    }
  };

  // ============================================
  // STORE SETTINGS
  // ============================================

  const saveStoreSettings = async (updates: Partial<StoreType>) => {
    if (!store) return;
    setSaving(true);

    try {
      const { data, error } = await supabase
        .from('stores')
        .update(updates)
        .eq('id', store.id)
        .select()
        .single();

      if (error) throw error;
      setStore(data);
      setSuccess('Settings saved');
    } catch (err: any) {
      setError(err?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // HELPERS
  // ============================================

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    completed: orders.filter(o => o.status === 'completed').length,
    revenue: orders.reduce((sum, o) => sum + (o.total || 0), 0)
  };

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto" />
          <p className="mt-3 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error === 'No store found') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-sm border">
          <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No store yet</h2>
          <p className="text-gray-600 mb-6">Create your store first to access the dashboard.</p>
          <button
            onClick={() => navigate('/create-store')}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
          >
            Create your store
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'products', name: 'Products', icon: <Package className="w-5 h-5" /> },
    { id: 'orders', name: 'Orders', icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 'design', name: 'Design', icon: <Palette className="w-5 h-5" /> },
    { id: 'settings', name: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <>
      <Helmet>
        <title>{store?.name || 'Dashboard'} - TriniBuild</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 hidden md:flex">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold">
                {store?.name?.charAt(0) || 'S'}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-gray-900 truncate">{store?.name}</h2>
                <p className="text-xs text-gray-500 truncate">{store?.slug}</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/store/${store?.slug}`)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
            >
              <Eye className="w-4 h-4" /> View Store
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-4 py-3 text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-red-50 text-red-700 border-r-2 border-red-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className={activeTab === tab.id ? 'text-red-600' : 'text-gray-500'}>{tab.icon}</span>
                <span className="ml-3 text-sm font-medium">{tab.name}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <Home className="w-4 h-4" /> Back to TriniBuild
            </button>
          </div>
        </div>

        {/* Mobile header */}
        <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-sm font-medium text-gray-700">← Back</button>
          <h1 className="font-bold text-gray-900">{store?.name}</h1>
          <button onClick={() => navigate(`/store/${store?.slug}`)} className="text-sm text-red-600 font-medium">View</button>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto md:ml-0 pt-16 md:pt-0">
          <div className="max-w-6xl mx-auto p-4 md:p-8">
            {/* Alerts */}
            {error && (
              <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="text-red-600"><X className="w-4 h-4" /></button>
              </div>
            )}

            {success && (
              <div className="mb-6 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <Check className="w-5 h-5 text-green-600" />
                <p className="text-sm text-green-800">{success}</p>
                <button onClick={() => setSuccess(null)} className="ml-auto text-green-600"><X className="w-4 h-4" /></button>
              </div>
            )}

            {/* Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Revenue', value: `$${orderStats.revenue.toFixed(2)}`, change: '+12.5%', up: true, icon: <DollarSign className="w-5 h-5" /> },
                    { label: 'Orders', value: orderStats.total, change: '+8.3%', up: true, icon: <ShoppingBag className="w-5 h-5" /> },
                    { label: 'Pending', value: orderStats.pending, change: 'Needs action', up: false, icon: <Clock className="w-5 h-5" /> },
                    { label: 'Products', value: products.length, change: 'Active', up: true, icon: <Package className="w-5 h-5" /> },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-500 text-sm">{stat.label}</span>
                        <span className={stat.up ? 'text-green-600' : 'text-gray-400'}>{stat.icon}</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      <div className={`text-xs mt-1 ${stat.up ? 'text-green-600' : 'text-gray-500'}`}>{stat.change}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Recent Orders</h3>
                  {orders.length === 0 ? (
                    <p className="text-gray-500 text-sm">No orders yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-2 font-medium text-gray-500">Order ID</th>
                            <th className="text-left py-3 px-2 font-medium text-gray-500">Customer</th>
                            <th className="text-left py-3 px-2 font-medium text-gray-500">Total</th>
                            <th className="text-left py-3 px-2 font-medium text-gray-500">Status</th>
                            <th className="text-left py-3 px-2 font-medium text-gray-500">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.slice(0, 10).map(order => (
                            <tr key={order.id} className="border-b border-gray-100">
                              <td className="py-3 px-2 font-medium text-gray-900">#{order.id.slice(0, 8)}</td>
                              <td className="py-3 px-2 text-gray-700">{order.customer_id}</td>
                              <td className="py-3 px-2 text-gray-900 font-medium">${order.total?.toFixed(2)}</td>
                              <td className="py-3 px-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>{order.status}</span>
                              </td>
                              <td className="py-3 px-2 text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Products */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search products..."
                        className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="all">All status</option>
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <button
                    onClick={openCreateProduct}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg"
                  >
                    <Plus className="w-4 h-4" /> Add Product
                  </button>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {filteredProducts.length === 0 ? (
                    <div className="p-12 text-center">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No products found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="text-left py-3 px-4 font-medium text-gray-500">Product</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-500">Category</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-500">Price</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-500">Stock</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProducts.map(product => (
                            <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  {product.image_url ? (
                                    <img src={product.image_url} alt="" className="w-10 h-10 rounded object-cover" />
                                  ) : (
                                    <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                                      <Image className="w-5 h-5" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-medium text-gray-900">{product.name}</div>
                                    <div className="text-xs text-gray-500 truncate max-w-[200px]">{product.description}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-gray-700">{product.category || '-'}</td>
                              <td className="py-3 px-4 font-medium text-gray-900">TT${product.price.toFixed(2)}</td>
                              <td className="py-3 px-4 text-gray-700">{product.stock ?? 0}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  product.status === 'active' ? 'bg-green-100 text-green-700' :
                                  product.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                                  'bg-red-100 text-red-700'
                                }`}>{(product as any).status || 'active'}</span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => openEditProduct(product)}
                                    className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(product)}
                                    className="p-1.5 hover:bg-red-50 rounded text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Orders */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 mb-4">All Orders</h3>
                  {orders.length === 0 ? (
                    <p className="text-gray-500 text-sm">No orders yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {orders.map(order => (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="font-medium text-gray-900">Order #{order.id.slice(0, 8)}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              {new Date(order.created_at).toLocaleString()} • Customer: {order.customer_id}
                            </div>
                            <div className="text-sm font-medium text-gray-900 mt-1">TT${order.total?.toFixed(2) || '0.00'}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                              className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Design */}
            {activeTab === 'design' && store && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Appearance</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
                      <input
                        type="text"
                        value={store.name}
                        onChange={(e) => setStore({ ...store, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tagline</label>
                      <input
                        type="text"
                        value={store.tagline || ''}
                        onChange={(e) => setStore({ ...store, tagline: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                      <input
                        type="color"
                        value={(store.color_scheme as any)?.primary || '#E61E2B'}
                        onChange={(e) => setStore({
                          ...store,
                          color_scheme: { primary: e.target.value }
                        })}
                        className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                    </div>
                    <button
                      onClick={() => saveStoreSettings({
                        name: store.name,
                        tagline: store.tagline,
                        color_scheme: store.color_scheme
                      })}
                      disabled={saving}
                      className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Design'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Settings */}
            {activeTab === 'settings' && store && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Store Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={store.phone || ''}
                        onChange={(e) => setStore({ ...store, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
                      <input
                        type="tel"
                        value={store.whatsapp || ''}
                        onChange={(e) => setStore({ ...store, whatsapp: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                      <textarea
                        value={(store.settings as any)?.address || ''}
                        onChange={(e) => setStore({
                          ...store,
                          settings: { ...(store.settings as any || {}), address: e.target.value }
                        })}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => saveStoreSettings({
                      phone: store.phone,
                      whatsapp: store.whatsapp,
                      settings: store.settings
                    })}
                    disabled={saving}
                    className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{editingProduct ? 'Edit Product' : 'New Product'}</h3>
              <button onClick={() => setShowProductModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (TT$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <input
                  type="text"
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                <input
                  type="url"
                  value={productForm.image_url}
                  onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
                <div className="mt-2">
                  <label className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm cursor-pointer">
                    <Upload className="w-4 h-4" /> Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                    />
                  </label>
                  {uploading && <span className="ml-2 text-xs text-gray-500">Uploading...</span>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={productForm.status}
                  onChange={(e) => setProductForm({ ...productForm, status: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowProductModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={saving}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
