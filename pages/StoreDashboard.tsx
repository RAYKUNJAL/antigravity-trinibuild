import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Package, ShoppingBag, Palette, Settings, TrendingUp, Mail, Gift, Zap,
  FileText, Layout, Menu, ShoppingCart, Tag, Star, MessageSquare, Truck,
  CreditCard, Bell, BarChart3, Save, Eye, Plus, Edit2, Trash2,
  Search, Filter, DollarSign, Upload, RefreshCw, AlertCircle, Check, X,
  MapPin, Phone, Globe, Clock, Loader2, ArrowUpRight, ArrowDownRight, QrCode, Image, Home,
  Store, Share2, ChevronUp, ChevronDown, GripVertical, ToggleLeft, ToggleRight, Send, Users
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { storeService } from '../services/storeService';
import { subscriptionService } from '../services/subscriptionService';
import type { Store as StoreType, Product, Order } from '../types';
import { getPlaceholderImage } from '../components/templates/placeholderImage';

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

// ---- Visual Block Editor types ----
type SectionType = 'hero' | 'productGrid' | 'featured' | 'about' | 'contact';

interface SectionConfig {
  id: string;
  type: SectionType;
  label: string;
  visible: boolean;
  heading: string;
  body: string;
  bgColor: string;
  image: string;
}

const SECTION_LABELS: Record<SectionType, string> = {
  hero: 'Hero Banner',
  productGrid: 'Product Grid',
  featured: 'Featured Products',
  about: 'About Us',
  contact: 'Contact',
};

const DEFAULT_SECTIONS: SectionConfig[] = [
  { id: 'hero', type: 'hero', label: 'Hero Banner', visible: true,
    heading: 'Welcome to our store', body: 'Quality products, island-wide delivery.', bgColor: '#0D1117', image: '' },
  { id: 'productGrid', type: 'productGrid', label: 'Product Grid', visible: true,
    heading: 'Our Products', body: 'Browse our full catalog.', bgColor: '#FFFFFF', image: '' },
  { id: 'featured', type: 'featured', label: 'Featured Products', visible: true,
    heading: 'Featured', body: 'Hand-picked favourites.', bgColor: '#F8F9FA', image: '' },
  { id: 'about', type: 'about', label: 'About Us', visible: true,
    heading: 'About', body: 'Our story and mission.', bgColor: '#FFFFFF', image: '' },
  { id: 'contact', type: 'contact', label: 'Contact', visible: true,
    heading: 'Get in touch', body: 'Reach us anytime.', bgColor: '#0D1117', image: '' },
];

function loadSectionsFromStore(store: StoreType | null): SectionConfig[] {
  if (!store) return DEFAULT_SECTIONS;
  const tc = (store as any).theme_config;
  if (tc && Array.isArray(tc.sections) && tc.sections.length > 0) {
    // Merge stored sections over defaults to ensure all keys exist
    return tc.sections.map((s: any) => ({ ...DEFAULT_SECTIONS.find(d => d.id === s.id)!, ...s }));
  }
  return DEFAULT_SECTIONS;
}

// ============================================
// SPARKLINE (pure SVG, no chart lib)
// ============================================

const Sparkline: React.FC<{ values: number[]; width?: number; height?: number; color?: string }> = ({
  values, width = 320, height = 80, color = '#E5182A'
}) => {
  if (!values.length) {
    return (
      <div className="flex items-center justify-center text-gray-400 text-sm" style={{ height }}>
        No revenue data yet
      </div>
    );
  }
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const pts = values.map((v, i) => `${i * step},${height - ((v - min) / range) * height}`);
  const path = `M ${pts.join(' L ')}`;
  const areaPath = `${path} L ${width},${height} L 0,${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#spark-fill)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {values.map((v, i) => (
        <circle key={i} cx={i * step} cy={height - ((v - min) / range) * height} r="2.5" fill={color} />
      ))}
    </svg>
  );
};

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
  const [maxProducts, setMaxProducts] = useState<number>(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // ---- Block editor state ----
  const [sections, setSections] = useState<SectionConfig[]>(DEFAULT_SECTIONS);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('hero');
  const [designSaving, setDesignSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

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
        setError('No store found');
        setLoading(false);
        return;
      }

      setStore(storeData);
      setSections(loadSectionsFromStore(storeData));

      // Load products
      const storeProducts = await storeService.getProducts(storeData.id);
      setProducts(storeProducts);

      // Load orders
      const storeOrders = await storeService.getStoreOrders(storeData.id);
      setOrders(storeOrders);

      // Load plan limit
      if (user) {
        const { plan } = await subscriptionService.getUserPlan(user.id);
        setMaxProducts(plan?.max_products ?? 5);
      }

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

  const openCreateProduct = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { plan } = await subscriptionService.getUserPlan(user.id);
        const limit = plan?.max_products ?? 5;
        setMaxProducts(limit);
        if (products.length >= limit) {
          alert('Upgrade plan to add more products');
          return;
        }
      }
    } catch (err) {
      console.error('Plan check failed:', err);
    }
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
        base_price: Number(productForm.price),
        stock: Number(productForm.stock),
        category: productForm.category,
        image_url: productForm.image_url,
        status: productForm.status,
      };

      let result;
      if (editingProduct) {
        result = await storeService.updateProduct(editingProduct.id, payload);
      } else {
        result = await storeService.addProduct(store.id, payload);
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
      const data = await storeService.updateStore(store.id, updates);
      setStore(data);
      setSuccess('Settings saved');
    } catch (err: any) {
      setError(err?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // BLOCK EDITOR OPERATIONS
  // ============================================

  const selectedSection = useMemo(
    () => sections.find(s => s.id === selectedSectionId) || sections[0],
    [sections, selectedSectionId]
  );

  const updateSection = (id: string, patch: Partial<SectionConfig>) => {
    setSections(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)));
  };

  const moveSection = (index: number, dir: -1 | 1) => {
    setSections(prev => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  // HTML5 native drag-and-drop reorder
  const onDragStart = (index: number) => setDragIndex(index);
  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setSections(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(index);
  };
  const onDragEnd = () => setDragIndex(null);

  const persistTheme = async (publish: boolean) => {
    if (!store) return;
    const isSaving = publish;
    if (publish) setPublishing(true); else setDesignSaving(true);
    setError(null);
    try {
      const themeConfig = { sections, updatedAt: new Date().toISOString() };
      // 1. Try Supabase (works for logged-in merchant)
      try {
        await storeService.updateStoreTheme(store.id, themeConfig);
        setSuccess(publish ? 'Published to live store!' : 'Design saved');
      } catch (supaErr: any) {
        console.warn('Supabase theme save failed, using localStorage fallback:', supaErr?.message);
        setSuccess(publish ? 'Saved locally (will sync when online)' : 'Design saved locally');
      }
      // 2. Always mirror to localStorage as a fallback
      localStorage.setItem(`trinibuild_theme_${store.id}`, JSON.stringify(themeConfig));
      if (publish) {
        // Update local store state too
        setStore({ ...store, theme_config: themeConfig } as any);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save design');
    } finally {
      setDesignSaving(false);
      setPublishing(false);
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

  // KPI: orders today
  const todayStr = new Date().toDateString();
  const ordersToday = orders.filter(o => new Date(o.created_at).toDateString() === todayStr);

  // 30-day revenue sparkline (daily buckets)
  const revenueSparkline = useMemo(() => {
    const days: number[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const ds = d.toDateString();
      const rev = orders
        .filter(o => new Date(o.created_at).toDateString() === ds)
        .reduce((s, o) => s + (o.total || 0), 0);
      days.push(rev);
    }
    return days;
  }, [orders]);

  const recentOrders = orders.slice(0, 5);

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
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-sm border border-gray-200">
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

  const navItems = [
    { id: 'overview', name: 'Overview', icon: <BarChart3 className="w-5 h-5" />, emoji: '📊' },
    { id: 'products', name: 'Products', icon: <Package className="w-5 h-5" />, emoji: '🛍️' },
    { id: 'orders', name: 'Orders', icon: <ShoppingBag className="w-5 h-5" />, emoji: '📦' },
    { id: 'design', name: 'Store Design', icon: <Palette className="w-5 h-5" />, emoji: '🎨' },
    { id: 'payments', name: 'Payments', icon: <CreditCard className="w-5 h-5" />, emoji: '💳' },
    { id: 'settings', name: 'Settings', icon: <Settings className="w-5 h-5" />, emoji: '⚙️' },
  ];

  // Mobile bottom nav (subset)
  const mobileNav = navItems.filter(n => ['overview', 'products', 'orders', 'design', 'settings'].includes(n.id));

  return (
    <>
      <Helmet>
        <title>{store?.name || 'Dashboard'} - TriniBuild</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
        {/* ===== Desktop Sidebar ===== */}
        <aside className="w-64 bg-white border-r border-gray-200 flex-col shrink-0 hidden md:flex">
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
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-4 py-3 text-left transition-colors ${
                  activeTab === item.id
                    ? 'bg-red-50 text-red-700 border-r-2 border-red-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className={activeTab === item.id ? 'text-red-600' : 'text-gray-500'}>{item.icon}</span>
                <span className="ml-3 text-sm font-medium">{item.name}</span>
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
        </aside>

        {/* ===== Mobile Header ===== */}
        <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-sm font-medium text-gray-700">← Back</button>
          <h1 className="font-bold text-gray-900">{store?.name}</h1>
          <button onClick={() => navigate(`/store/${store?.slug}`)} className="text-sm text-red-600 font-medium">View</button>
        </div>

        {/* ===== Main Content ===== */}
        <main className="flex-1 overflow-y-auto md:ml-0 pt-16 md:pt-0 pb-24 md:pb-0">
          <div className="max-w-6xl mx-auto p-4 md:p-8">
            {/* Alerts */}
            {error && error !== 'No store found' && (
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

            {/* ===== OVERVIEW ===== */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
                  <p className="text-gray-600 text-sm mt-1">Your store at a glance.</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Revenue', value: `TT$${orderStats.revenue.toFixed(2)}`,
                      empty: orders.length === 0, icon: <DollarSign className="w-5 h-5" /> },
                    { label: 'Orders Today', value: ordersToday.length,
                      empty: ordersToday.length === 0, icon: <ShoppingBag className="w-5 h-5" /> },
                    { label: 'Active Products', value: products.filter(p => p.status === 'active').length,
                      empty: products.length === 0, icon: <Package className="w-5 h-5" /> },
                    { label: 'Store Visitors', value: 0, empty: true, icon: <Users className="w-5 h-5" /> },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-700 text-sm font-medium">{stat.label}</span>
                        <span className="text-red-600">{stat.icon}</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      {stat.empty && (
                        <div className="text-xs mt-1 text-gray-400 italic">No data yet</div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Revenue Sparkline */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Revenue — Last 30 Days</h3>
                    <span className="text-sm text-gray-600">
                      TT${revenueSparkline.reduce((a, b) => a + b, 0).toFixed(2)} total
                    </span>
                  </div>
                  <Sparkline values={revenueSparkline} width={560} height={100} />
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={openCreateProduct}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg"
                    >
                      <Plus className="w-4 h-4" /> Add Product
                    </button>
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/store/${store?.slug}`;
                        if (navigator.share) {
                          navigator.share({ title: store?.name || 'My store', url }).catch(() => {});
                        } else {
                          navigator.clipboard?.writeText(url);
                          setSuccess('Store link copied to clipboard!');
                        }
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-lg border border-gray-300"
                    >
                      <Share2 className="w-4 h-4" /> Share Store
                    </button>
                    <button
                      onClick={() => navigate(`/store/${store?.slug}`)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-lg border border-gray-300"
                    >
                      <Eye className="w-4 h-4" /> View Live Store
                    </button>
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Recent Orders</h3>
                  {recentOrders.length === 0 ? (
                    <div className="py-8 text-center">
                      <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No orders yet. Your recent orders will appear here.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-2 font-medium text-gray-600">Order ID</th>
                            <th className="text-left py-3 px-2 font-medium text-gray-600">Customer</th>
                            <th className="text-left py-3 px-2 font-medium text-gray-600">Total</th>
                            <th className="text-left py-3 px-2 font-medium text-gray-600">Status</th>
                            <th className="text-left py-3 px-2 font-medium text-gray-600">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentOrders.map(order => (
                            <tr key={order.id} className="border-b border-gray-100">
                              <td className="py-3 px-2 font-medium text-gray-900">#{order.id.slice(0, 8)}</td>
                              <td className="py-3 px-2 text-gray-700">{order.customer_id}</td>
                              <td className="py-3 px-2 text-gray-900 font-medium">TT${order.total?.toFixed(2)}</td>
                              <td className="py-3 px-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>{order.status}</span>
                              </td>
                              <td className="py-3 px-2 text-gray-600">{new Date(order.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===== PRODUCTS ===== */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                    <p className="text-gray-600 text-sm mt-1">Manage your catalog.</p>
                  </div>
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
                    {products.length >= maxProducts ? (
                      <button
                        onClick={() => navigate('/pricing')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg border border-gray-300"
                      >
                        <Plus className="w-4 h-4" /> Upgrade
                      </button>
                    ) : (
                      <button
                        onClick={openCreateProduct}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg"
                      >
                        <Plus className="w-4 h-4" /> Add Product
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {filteredProducts.length === 0 ? (
                    <div className="p-12 text-center">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600">No products found. Add your first product to get started.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Product</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Price</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Stock</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
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

            {/* ===== ORDERS ===== */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                  <p className="text-gray-600 text-sm mt-1">{orderStats.total} total · {orderStats.pending} pending</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  {orders.length === 0 ? (
                    <div className="py-8 text-center">
                      <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm">No orders yet. When customers order, they'll appear here.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map(order => (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="font-medium text-gray-900">Order #{order.id.slice(0, 8)}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              {new Date(order.created_at).toLocaleString()} · Customer: {order.customer_id}
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

            {/* ===== STORE DESIGN (Visual Block Editor) ===== */}
            {activeTab === 'design' && store && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Store Design</h1>
                    <p className="text-gray-600 text-sm mt-1">Drag to reorder sections. Click a section to edit its settings.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => persistTheme(false)}
                      disabled={designSaving}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-lg border border-gray-300 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" /> {designSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => persistTheme(true)}
                      disabled={publishing}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" /> {publishing ? 'Publishing...' : 'Publish'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* === Section List (left) === */}
                  <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Sections</h3>
                      <div className="space-y-2">
                        {sections.map((section, index) => (
                          <div
                            key={section.id}
                            draggable
                            onDragStart={() => onDragStart(index)}
                            onDragOver={(e) => onDragOver(e, index)}
                            onDragEnd={onDragEnd}
                            onClick={() => setSelectedSectionId(section.id)}
                            className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedSectionId === section.id
                                ? 'border-red-500 bg-red-50'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            } ${dragIndex === index ? 'opacity-50' : ''} ${!section.visible ? 'opacity-60' : ''}`}
                          >
                            <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0 cursor-grab" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">{section.label}</div>
                              <div className="text-xs text-gray-500 truncate">{section.heading}</div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveSection(index, -1);
                                }}
                                disabled={index === 0}
                                className="p-1 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30"
                                title="Move up"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveSection(index, 1);
                                }}
                                disabled={index === sections.length - 1}
                                className="p-1 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30"
                                title="Move down"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateSection(section.id, { visible: !section.visible });
                                }}
                                className="p-1 hover:bg-gray-100 rounded text-gray-500"
                                title={section.visible ? 'Hide section' : 'Show section'}
                              >
                                {section.visible
                                  ? <ToggleRight className="w-5 h-5 text-green-600" />
                                  : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* === Settings Panel (middle) === */}
                  <div className="lg:col-span-1">
                    {selectedSection && (
                      <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-4">
                        <h3 className="font-bold text-gray-900 mb-1">{selectedSection.label} Settings</h3>
                        <p className="text-xs text-gray-500 mb-4">Edit the content for this section.</p>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Heading Text</label>
                            <input
                              type="text"
                              value={selectedSection.heading}
                              onChange={(e) => updateSection(selectedSection.id, { heading: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Body Text</label>
                            <textarea
                              value={selectedSection.body}
                              onChange={(e) => updateSection(selectedSection.id, { body: e.target.value })}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 text-gray-900 resize-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={selectedSection.bgColor}
                                onChange={(e) => updateSection(selectedSection.id, { bgColor: e.target.value })}
                                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={selectedSection.bgColor}
                                onChange={(e) => updateSection(selectedSection.id, { bgColor: e.target.value })}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 text-gray-900"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                            <input
                              type="url"
                              value={selectedSection.image}
                              onChange={(e) => updateSection(selectedSection.id, { image: e.target.value })}
                              placeholder="https://..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 text-gray-900"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                              Leave blank to use a category-aware placeholder.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* === Live Preview (right) === */}
                  <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-900 text-sm">Live Preview</h3>
                        <span className="text-xs text-gray-400">Auto-updates</span>
                      </div>
                      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                        {/* Render stacked section preview */}
                        {sections.filter(s => s.visible).map(section => {
                          const isDark = ['#0D1117', '#111827', '#000000', '#1a1a1a'].includes(section.bgColor.toUpperCase());
                          const textColor = isDark ? '#FFFFFF' : '#0D1117';
                          const subColor = isDark ? '#9CA3AF' : '#4B5563';
                          const img = section.image || getPlaceholderImage(store.category || undefined, section.id);
                          return (
                            <div key={section.id} style={{ backgroundColor: section.bgColor }} className="p-4 border-b border-gray-100 last:border-b-0">
                              {section.type === 'hero' && (
                                <div className="text-center py-4">
                                  <h2 className="text-lg font-bold" style={{ color: textColor }}>{section.heading}</h2>
                                  <p className="text-sm mt-1" style={{ color: subColor }}>{section.body}</p>
                                  {img && <img src={img} alt="" className="w-full h-24 object-cover rounded mt-2" />}
                                </div>
                              )}
                              {section.type === 'productGrid' && (
                                <div className="py-2">
                                  <h3 className="text-sm font-bold mb-2" style={{ color: textColor }}>{section.heading}</h3>
                                  <div className="grid grid-cols-3 gap-1.5">
                                    {products.slice(0, 3).map(p => (
                                      <div key={p.id} className="text-center">
                                        <img src={p.image_url || getPlaceholderImage(p.category || undefined, p.id)} alt="" className="w-full h-12 object-cover rounded" />
                                        <p className="text-[10px] mt-1 truncate" style={{ color: subColor }}>{p.name}</p>
                                      </div>
                                    ))}
                                    {products.length === 0 && <p className="text-xs col-span-3" style={{ color: subColor }}>No products yet</p>}
                                  </div>
                                </div>
                              )}
                              {section.type === 'featured' && (
                                <div className="py-2">
                                  <h3 className="text-sm font-bold mb-2" style={{ color: textColor }}>{section.heading}</h3>
                                  <div className="flex gap-2">
                                    {products.slice(0, 2).map(p => (
                                      <div key={p.id} className="flex-1 text-center">
                                        <img src={p.image_url || getPlaceholderImage(p.category || undefined, p.id)} alt="" className="w-full h-14 object-cover rounded" />
                                        <p className="text-[10px] mt-1 truncate" style={{ color: subColor }}>{p.name}</p>
                                        <p className="text-[10px] font-bold" style={{ color: textColor }}>TT${p.price.toFixed(0)}</p>
                                      </div>
                                    ))}
                                    {products.length === 0 && <p className="text-xs" style={{ color: subColor }}>No featured products</p>}
                                  </div>
                                </div>
                              )}
                              {section.type === 'about' && (
                                <div className="py-2">
                                  <h3 className="text-sm font-bold mb-1" style={{ color: textColor }}>{section.heading}</h3>
                                  <p className="text-xs" style={{ color: subColor }}>{section.body}</p>
                                </div>
                              )}
                              {section.type === 'contact' && (
                                <div className="py-2 text-center">
                                  <h3 className="text-sm font-bold mb-1" style={{ color: textColor }}>{section.heading}</h3>
                                  <p className="text-xs" style={{ color: subColor }}>{section.body}</p>
                                  <div className="flex justify-center gap-2 mt-2 text-xs" style={{ color: subColor }}>
                                    <span>📞 {store.whatsapp || 'N/A'}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => navigate(`/store/${store?.slug}`)}
                        className="mt-3 w-full text-center text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        View full live store →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== PAYMENTS ===== */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
                  <p className="text-gray-600 text-sm mt-1">Configure how you get paid.</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Payment Methods</h3>
                  <div className="space-y-3">
                    {[
                      { name: 'Cash on Delivery (COD)', desc: 'Collect payment on delivery.', enabled: true },
                      { name: 'WhatsApp Order', desc: 'Customers order via WhatsApp chat.', enabled: true },
                      { name: 'Online Card Payment', desc: 'Accept credit/debit cards (coming soon).', enabled: false },
                    ].map((method, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{method.name}</div>
                          <div className="text-xs text-gray-500">{method.desc}</div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${method.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {method.enabled ? 'Active' : 'Coming soon'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ===== SETTINGS ===== */}
            {activeTab === 'settings' && store && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                  <p className="text-gray-600 text-sm mt-1">Manage your store information.</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Store Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={store.whatsapp || ''}
                        onChange={(e) => setStore({ ...store, whatsapp: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
                      <input
                        type="tel"
                        value={store.whatsapp || ''}
                        onChange={(e) => setStore({ ...store, whatsapp: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-900"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-900"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => saveStoreSettings({
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
        </main>

        {/* ===== Mobile Bottom Nav ===== */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 flex">
          {mobileNav.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center py-2 ${
                activeTab === item.id ? 'text-red-600' : 'text-gray-500'
              }`}
            >
              {item.icon}
              <span className="text-[10px] mt-0.5">{item.name.split(' ')[0]}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* ===== Product Modal ===== */}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-900 resize-none"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <input
                  type="text"
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                <input
                  type="url"
                  value={productForm.image_url}
                  onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-900"
                />
                <div className="mt-2">
                  <label className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm cursor-pointer text-gray-700">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-900"
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
