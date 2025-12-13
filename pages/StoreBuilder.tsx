import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import {
    Store, Package, Palette, Settings, Users, TrendingUp, Mail, Gift, Zap,
    FileText, Layout, Menu, ShoppingBag, Tag, Star, MessageSquare, Truck,
    CreditCard, Bell, BarChart3, Save, Eye, Plus, Edit2, Trash2,
    Search, Filter, DollarSign, Upload, RefreshCw, AlertCircle, Check, X,
    MapPin, Phone, Globe, Clock, Loader2, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { storeService } from '../services/storeService';
import type { Store as StoreType, Product, Order } from '../types';

// ============================================
// TYPES
// ============================================
interface StoreStats {
    totalSales: number;
    totalOrders: number;
    totalCustomers: number;
    conversionRate: number;
    salesChange: number;
    ordersChange: number;
    customersChange: number;
    conversionChange: number;
}

interface BuilderTab {
    id: string;
    name: string;
    icon: React.ReactNode;
    description: string;
}

// ============================================
// MAIN COMPONENT
// ============================================
export const StoreBuilder: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [store, setStore] = useState<StoreType | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState<StoreStats>({
        totalSales: 0, totalOrders: 0, totalCustomers: 0, conversionRate: 0,
        salesChange: 0, ordersChange: 0, customersChange: 0, conversionChange: 0
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Tab definitions
    const tabs: BuilderTab[] = [
        { id: 'dashboard', name: 'Dashboard', icon: <BarChart3 className="h-5 w-5" />, description: 'Overview & Analytics' },
        { id: 'products', name: 'Products', icon: <Package className="h-5 w-5" />, description: 'Manage inventory' },
        { id: 'orders', name: 'Orders', icon: <ShoppingBag className="h-5 w-5" />, description: 'Manage orders' },
        { id: 'customers', name: 'Customers', icon: <Users className="h-5 w-5" />, description: 'Customer management' },
        { id: 'design', name: 'Design', icon: <Palette className="h-5 w-5" />, description: 'Customize appearance' },
        { id: 'marketing', name: 'Marketing', icon: <TrendingUp className="h-5 w-5" />, description: 'Promotions & SEO' },
        { id: 'delivery', name: 'Delivery', icon: <Truck className="h-5 w-5" />, description: 'Shipping options' },
        { id: 'payments', name: 'Payments', icon: <CreditCard className="h-5 w-5" />, description: 'Payment methods' },
        { id: 'settings', name: 'Settings', icon: <Settings className="h-5 w-5" />, description: 'Store configuration' }
    ];

    // Load store data
    const loadStoreData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const myStore = await storeService.getMyStore();
            if (!myStore) {
                setError('No store found. Please create a store first.');
                setLoading(false);
                return;
            }
            setStore(myStore);

            // Load products
            const storeProducts = await storeService.getProducts(myStore.id);
            setProducts(storeProducts);

            // Load orders
            const storeOrders = await storeService.getStoreOrders(myStore.id);
            setOrders(storeOrders);

            // Calculate stats
            const totalSales = storeOrders.reduce((sum, o) => sum + (o.total || 0), 0);
            const uniqueCustomers = new Set(storeOrders.map(o => o.customer_id)).size;

            setStats({
                totalSales,
                totalOrders: storeOrders.length,
                totalCustomers: uniqueCustomers,
                conversionRate: storeProducts.length > 0 ? (storeOrders.length / storeProducts.length * 100) : 0,
                salesChange: 12.5,
                ordersChange: 8.3,
                customersChange: 15.2,
                conversionChange: 2.1
            });
        } catch (err) {
            console.error('Error loading store:', err);
            setError('Failed to load store data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStoreData();
    }, [loadStoreData]);

    const handleSave = async () => {
        if (!store) return;
        setSaving(true);
        try {
            await storeService.updateStore(store.id, store);
        } catch (err) {
            console.error('Save failed:', err);
        } finally {
            setSaving(false);
        }
    };

    const renderTabContent = () => {
        if (loading) return <LoadingState />;
        if (error) return <ErrorState message={error} onRetry={loadStoreData} />;
        if (!store) return <NoStoreState />;

        switch (activeTab) {
            case 'dashboard': return <DashboardTab stats={stats} orders={orders} products={products} />;
            case 'products': return <ProductsTab storeId={store.id} products={products} onRefresh={loadStoreData} />;
            case 'orders': return <OrdersTab orders={orders} />;
            case 'customers': return <CustomersTab orders={orders} />;
            case 'design': return <DesignTab store={store} onUpdate={(updates) => setStore({ ...store, ...updates })} />;
            case 'marketing': return <MarketingTab store={store} />;
            case 'delivery': return <DeliveryTab />;
            case 'payments': return <PaymentsTab />;
            case 'settings': return <SettingsTab store={store} onUpdate={(updates) => setStore({ ...store, ...updates })} />;
            default: return <DashboardTab stats={stats} orders={orders} products={products} />;
        }
    };

    return (
        <>
            <Helmet>
                <title>{store?.name || 'Store Builder'} - TriniBuild Dashboard</title>
                <meta name="description" content="Manage your TriniBuild store with our commercial-grade dashboard" />
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            <div className="min-h-screen bg-gray-50 flex">
                {/* Sidebar */}
                <div className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="font-bold text-gray-900 truncate">{store?.name || 'Loading...'}</h2>
                            <button
                                onClick={() => store && navigate(`/store/${store.slug}`)}
                                className="p-1 hover:bg-gray-100 rounded"
                                title="Preview Store"
                            >
                                <Eye className="h-4 w-4 text-gray-600" />
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">Store Builder</p>
                    </div>

                    <div className="flex-1 overflow-y-auto py-4">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center px-4 py-3 text-left transition-colors ${activeTab === tab.id ? 'bg-trini-red text-white' : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <span className={activeTab === tab.id ? 'text-white' : 'text-gray-500'}>{tab.icon}</span>
                                <div className="ml-3 flex-1">
                                    <p className="text-sm font-medium">{tab.name}</p>
                                    <p className={`text-xs ${activeTab === tab.id ? 'text-white/80' : 'text-gray-500'}`}>{tab.description}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="p-4 border-t border-gray-200 space-y-2">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50"
                        >
                            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : <><Save className="h-4 w-4 mr-2" />Save Changes</>}
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{tabs.find(t => t.id === activeTab)?.name}</h1>
                            <p className="text-sm text-gray-500">{tabs.find(t => t.id === activeTab)?.description}</p>
                        </div>
                        <button onClick={loadStoreData} className="p-2 hover:bg-gray-100 rounded-lg" title="Refresh">
                            <RefreshCw className={`h-5 w-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    <div className="p-6">{renderTabContent()}</div>
                </div>
            </div>
        </>
    );
};

// ============================================
// STATE COMPONENTS
// ============================================
const LoadingState = () => (
    <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-trini-red" />
    </div>
);

const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
    <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-gray-600 mb-4">{message}</p>
        <button onClick={onRetry} className="bg-trini-red text-white px-6 py-2 rounded-lg font-bold">Retry</button>
    </div>
);

const NoStoreState = () => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
            <Store className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">You don't have a store yet</p>
            <button onClick={() => navigate('/create-store')} className="bg-trini-red text-white px-6 py-2 rounded-lg font-bold">Create Store</button>
        </div>
    );
};

// ============================================
// DASHBOARD TAB
// ============================================
const DashboardTab: React.FC<{ stats: StoreStats; orders: Order[]; products: Product[] }> = ({ stats, orders, products }) => (
    <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard title="Total Sales" value={`TT$${stats.totalSales.toLocaleString()}`} change={stats.salesChange} icon={<DollarSign />} />
            <StatCard title="Orders" value={stats.totalOrders.toString()} change={stats.ordersChange} icon={<ShoppingBag />} />
            <StatCard title="Customers" value={stats.totalCustomers.toString()} change={stats.customersChange} icon={<Users />} />
            <StatCard title="Conversion" value={`${stats.conversionRate.toFixed(1)}%`} change={stats.conversionChange} icon={<TrendingUp />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Recent Orders</h3>
                {orders.length === 0 ? (
                    <p className="text-gray-500 text-sm">No orders yet. Share your store to get started!</p>
                ) : (
                    <div className="space-y-3">
                        {orders.slice(0, 5).map(order => (
                            <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-sm">Order #{order.id.slice(0, 8)}</p>
                                    <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-green-600">TT${order.total}</p>
                                    <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                                        }`}>{order.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Top Products */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Top Products</h3>
                {products.length === 0 ? (
                    <p className="text-gray-500 text-sm">No products yet. Add your first product!</p>
                ) : (
                    <div className="space-y-3">
                        {products.slice(0, 5).map(product => (
                            <div key={product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                                    {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{product.name}</p>
                                    <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                                </div>
                                <p className="font-bold text-green-600">TT${product.price}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
);

// ============================================
// PRODUCTS TAB
// ============================================
const ProductsTab: React.FC<{ storeId: string; products: Product[]; onRefresh: () => void }> = ({ storeId, products, onRefresh }) => {
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleting, setDeleting] = useState<string | null>(null);

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleDelete = async (productId: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        setDeleting(productId);
        try {
            await storeService.deleteProduct(productId);
            onRefresh();
        } catch (err) {
            alert('Failed to delete product');
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                        />
                    </div>
                </div>
                <button
                    onClick={() => { setEditingProduct(null); setShowModal(true); }}
                    className="bg-trini-red text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 flex items-center"
                >
                    <Plus className="h-4 w-4 mr-2" />Add Product
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredProducts.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No products yet. Click "Add Product" to get started.</td></tr>
                        ) : filteredProducts.map(product => (
                            <tr key={product.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                                            {product.image_url && <img src={product.image_url} alt="" className="w-full h-full object-cover" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{product.name}</p>
                                            <p className="text-xs text-gray-500">{product.category}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-medium text-green-600">TT${product.price}</td>
                                <td className="px-6 py-4">
                                    <span className={`text-sm ${product.stock < 5 ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                                        {product.stock} {product.stock < 5 && '⚠️'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs rounded-full ${product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                        }`}>{product.status}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => { setEditingProduct(product); setShowModal(true); }} className="text-blue-600 hover:text-blue-800 mr-3"><Edit2 className="h-4 w-4" /></button>
                                    <button onClick={() => handleDelete(product.id)} disabled={deleting === product.id} className="text-red-600 hover:text-red-800">
                                        {deleting === product.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && <ProductModal storeId={storeId} product={editingProduct} onClose={() => setShowModal(false)} onSave={onRefresh} />}
        </div>
    );
};

// ============================================
// PRODUCT MODAL
// ============================================
const ProductModal: React.FC<{ storeId: string; product: Product | null; onClose: () => void; onSave: () => void }> = ({ storeId, product, onClose, onSave }) => {
    const [form, setForm] = useState({
        name: product?.name || '',
        description: product?.description || '',
        price: product?.price || 0,
        stock: product?.stock || 0,
        category: product?.category || '',
        image_url: product?.image_url || '',
        status: product?.status || 'active',
        seo_title: product?.seo?.title || '',
        seo_description: product?.seo?.description || ''
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const productData = {
                name: form.name,
                description: form.description,
                base_price: form.price,
                stock: form.stock,
                category: form.category,
                image_url: form.image_url,
                status: form.status as 'active' | 'draft',
                seo: { title: form.seo_title, description: form.seo_description }
            };
            if (product) {
                await storeService.updateProduct(product.id, productData);
            } else {
                await storeService.addProduct(storeId, productData);
            }
            onSave();
            onClose();
        } catch (err) {
            alert('Failed to save product');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-xl font-bold">{product ? 'Edit Product' : 'Add Product'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                        <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-trini-red" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-trini-red" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price (TT$) *</label>
                            <input type="number" required min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) })}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                            <input type="number" required min="0" value={form.stock} onChange={e => setForm({ ...form, stock: parseInt(e.target.value) })}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                        <input type="url" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="https://..." />
                    </div>

                    {/* SEO Section */}
                    <div className="border-t border-gray-200 pt-4 mt-4">
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center"><Globe className="h-4 w-4 mr-2" />SEO Settings</h4>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">SEO Title</label>
                                <input type="text" value={form.seo_title} onChange={e => setForm({ ...form, seo_title: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Product title for search engines" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">SEO Description</label>
                                <textarea value={form.seo_description} onChange={e => setForm({ ...form, seo_description: e.target.value })} rows={2}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Description for search results" />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={saving} className="flex-1 py-3 bg-trini-red text-white rounded-lg font-bold hover:bg-red-700 flex items-center justify-center">
                            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : (product ? 'Update Product' : 'Add Product')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ============================================
// ORDERS TAB
// ============================================
const OrdersTab: React.FC<{ orders: Order[] }> = ({ orders }) => {
    const [filter, setFilter] = useState<string>('all');
    const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                {['all', 'pending', 'processing', 'completed', 'cancelled'].map(status => (
                    <button key={status} onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === status ? 'bg-trini-red text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredOrders.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No orders found</td></tr>
                        ) : filteredOrders.map(order => (
                            <tr key={order.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium">#{order.id.slice(0, 8)}</td>
                                <td className="px-6 py-4 text-gray-600">{new Date(order.created_at).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-gray-600">{order.items?.length || 0} items</td>
                                <td className="px-6 py-4 font-bold text-green-600">TT${order.total}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                            order.status === 'processing' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                                        }`}>{order.status}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ============================================
// CUSTOMERS TAB
// ============================================
const CustomersTab: React.FC<{ orders: Order[] }> = ({ orders }) => {
    const customerMap = new Map<string, { id: string; orders: number; totalSpent: number; lastOrder: string }>();
    orders.forEach(o => {
        const existing = customerMap.get(o.customer_id) || { id: o.customer_id, orders: 0, totalSpent: 0, lastOrder: o.created_at };
        customerMap.set(o.customer_id, {
            ...existing,
            orders: existing.orders + 1,
            totalSpent: existing.totalSpent + o.total,
            lastOrder: o.created_at > existing.lastOrder ? o.created_at : existing.lastOrder
        });
    });
    const customers = Array.from(customerMap.values());

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-sm text-gray-500">Total Customers</p>
                    <p className="text-3xl font-bold text-gray-900">{customers.length}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-sm text-gray-500">Avg. Orders/Customer</p>
                    <p className="text-3xl font-bold text-gray-900">{customers.length ? (orders.length / customers.length).toFixed(1) : 0}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-sm text-gray-500">Avg. Lifetime Value</p>
                    <p className="text-3xl font-bold text-green-600">TT${customers.length ? (customers.reduce((s, c) => s + c.totalSpent, 0) / customers.length).toFixed(0) : 0}</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Order</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {customers.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No customers yet</td></tr>
                        ) : customers.map(c => (
                            <tr key={c.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium">{c.id.slice(0, 12)}...</td>
                                <td className="px-6 py-4">{c.orders}</td>
                                <td className="px-6 py-4 font-bold text-green-600">TT${c.totalSpent.toFixed(0)}</td>
                                <td className="px-6 py-4 text-gray-600">{new Date(c.lastOrder).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ============================================
// DESIGN TAB
// ============================================
const DesignTab: React.FC<{ store: StoreType; onUpdate: (updates: Partial<StoreType>) => void }> = ({ store, onUpdate }) => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center"><Palette className="h-5 w-5 mr-2 text-trini-red" />Theme Colors</h3>
                <div className="space-y-4">
                    <ColorInput label="Primary Color" value={store.theme?.colors?.primary || '#CE1126'} onChange={v => onUpdate({ theme: { ...store.theme, colors: { ...store.theme?.colors, primary: v } } as any })} />
                    <ColorInput label="Secondary Color" value={store.theme?.colors?.secondary || '#000000'} onChange={v => onUpdate({ theme: { ...store.theme, colors: { ...store.theme?.colors, secondary: v } } as any })} />
                    <ColorInput label="Accent Color" value={store.theme?.colors?.accent || '#00A651'} onChange={v => onUpdate({ theme: { ...store.theme, colors: { ...store.theme?.colors, accent: v } } as any })} />
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Store Images</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
                        <input type="url" value={store.logo_url || ''} onChange={e => onUpdate({ logo_url: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="https://..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Banner URL</label>
                        <input type="url" value={store.banner_url || ''} onChange={e => onUpdate({ banner_url: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="https://..." />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// ============================================
// MARKETING TAB (SEO & CRO)
// ============================================
const MarketingTab: React.FC<{ store: StoreType }> = ({ store }) => (
    <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-xl text-white">
            <h3 className="text-xl font-bold mb-2">SEO & Conversion Optimization</h3>
            <p className="opacity-90">Maximize your store's visibility and sales</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center"><Globe className="h-5 w-5 mr-2 text-blue-600" />SEO Score</h4>
                <div className="text-center py-6">
                    <div className="text-5xl font-bold text-green-600 mb-2">85%</div>
                    <p className="text-gray-500">Good - Room for improvement</p>
                </div>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center text-green-600"><Check className="h-4 w-4 mr-2" />Meta title set</div>
                    <div className="flex items-center text-green-600"><Check className="h-4 w-4 mr-2" />Meta description set</div>
                    <div className="flex items-center text-yellow-600"><AlertCircle className="h-4 w-4 mr-2" />Add more product descriptions</div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center"><TrendingUp className="h-5 w-5 mr-2 text-green-600" />CRO Tips</h4>
                <ul className="space-y-3 text-sm">
                    <li className="flex items-start"><Star className="h-4 w-4 mr-2 text-yellow-500 mt-0.5" />Add product reviews to build trust</li>
                    <li className="flex items-start"><Zap className="h-4 w-4 mr-2 text-orange-500 mt-0.5" />Create urgency with flash sales</li>
                    <li className="flex items-start"><Gift className="h-4 w-4 mr-2 text-pink-500 mt-0.5" />Offer bundle discounts</li>
                    <li className="flex items-start"><Mail className="h-4 w-4 mr-2 text-blue-500 mt-0.5" />Set up abandoned cart emails</li>
                </ul>
            </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h4 className="font-bold text-gray-900 mb-4">Store Meta Tags</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                    <input type="text" defaultValue={`${store.name} - Shop Online`} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                    <input type="text" defaultValue={store.description || ''} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                </div>
            </div>
        </div>
    </div>
);

// ============================================
// DELIVERY TAB
// ============================================
const DeliveryTab = () => (
    <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-xl text-white">
            <h3 className="text-xl font-bold mb-2">TriniBuild Go Integration</h3>
            <p className="mb-4 opacity-90">Connect your store to our driver network for fast, reliable delivery</p>
            <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-bold hover:bg-gray-100">Enable TriniBuild Go</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center"><MapPin className="h-5 w-5 mr-2 text-red-600" />Delivery Zones</h4>
                <p className="text-gray-600 text-sm mb-4">Set up delivery areas and pricing for your store</p>
                <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200">Configure Zones</button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center"><Clock className="h-5 w-5 mr-2 text-purple-600" />Pickup Options</h4>
                <p className="text-gray-600 text-sm mb-4">Allow customers to collect orders from your location</p>
                <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200">Add Pickup Location</button>
            </div>
        </div>
    </div>
);

// ============================================
// PAYMENTS TAB
// ============================================
const PaymentsTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
            { name: 'Cash on Delivery', desc: 'Most popular in Trinidad', enabled: true, icon: '💵' },
            { name: 'WiPay', desc: 'Credit/Debit/Linx', enabled: false, icon: '💳' },
            { name: 'Bank Transfer', desc: 'Direct deposit', enabled: true, icon: '🏦' },
            { name: 'Google Pay', desc: 'Fast mobile payments', enabled: false, icon: '📱' },
            { name: 'PayPal', desc: 'International payments', enabled: false, icon: '🅿️' }
        ].map(pm => (
            <div key={pm.name} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                    <span className="text-4xl">{pm.icon}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked={pm.enabled} className="sr-only peer" aria-label={`Enable ${pm.name}`} />
                        <div className="w-11 h-6 bg-gray-200 peer-checked:bg-green-600 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                </div>
                <h4 className="font-bold text-gray-900">{pm.name}</h4>
                <p className="text-sm text-gray-500">{pm.desc}</p>
            </div>
        ))}
    </div>
);

// ============================================
// SETTINGS TAB
// ============================================
const SettingsTab: React.FC<{ store: StoreType; onUpdate: (updates: Partial<StoreType>) => void }> = ({ store, onUpdate }) => (
    <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">Store Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                    <input type="text" value={store.name} onChange={e => onUpdate({ name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input type="text" value={store.category || ''} onChange={e => onUpdate({ category: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea value={store.description || ''} onChange={e => onUpdate({ description: e.target.value })} rows={3} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                </div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                    <input type="tel" value={store.whatsapp || ''} onChange={e => onUpdate({ whatsapp: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="1868-XXX-XXXX" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input type="text" value={store.location || ''} onChange={e => onUpdate({ location: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                </div>
            </div>
        </div>
    </div>
);

// ============================================
// HELPER COMPONENTS
// ============================================
const StatCard: React.FC<{ title: string; value: string; change: number; icon: React.ReactNode }> = ({ title, value, change, icon }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">{title}</span>
            <span className="text-gray-400">{icon}</span>
        </div>
        <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-gray-900">{value}</span>
            <span className={`text-sm font-medium flex items-center ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {Math.abs(change)}%
            </span>
        </div>
    </div>
);

const ColorInput: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <div className="flex items-center space-x-3">
            <input type="color" value={value} onChange={e => onChange(e.target.value)} className="h-10 w-20 border border-gray-300 rounded cursor-pointer" />
            <input type="text" value={value} onChange={e => onChange(e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg" />
        </div>
    </div>
);

export default StoreBuilder;
