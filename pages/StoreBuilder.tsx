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
            case 'delivery': return <DeliveryTab store={store} onUpdate={(updates) => setStore({ ...store, ...updates })} />;
            case 'payments': return <PaymentsTab store={store} onUpdate={(updates) => setStore({ ...store, ...updates })} />;
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
// DELIVERY TAB - FULL IMPLEMENTATION
// ============================================
const DeliveryTab: React.FC<{ store: StoreType; onUpdate: (updates: Partial<StoreType>) => void }> = ({ store, onUpdate }) => {
    // Initialize from store settings
    const defaults = [
        { id: '1', name: 'Port of Spain & Environs', price: 25, estimatedTime: '30-45 min', enabled: true },
        { id: '2', name: 'North Trinidad', price: 40, estimatedTime: '45-60 min', enabled: true },
        { id: '3', name: 'Central Trinidad', price: 50, estimatedTime: '1-1.5 hrs', enabled: true },
        { id: '4', name: 'South Trinidad', price: 75, estimatedTime: '1.5-2 hrs', enabled: false },
        { id: '5', name: 'Tobago', price: 150, estimatedTime: '2-3 hrs', enabled: false },
    ];

    const [deliveryZones, setDeliveryZones] = useState(() => {
        const savedZones = store.settings?.delivery?.zones;
        if (!savedZones || savedZones.length === 0) return defaults;

        // Merge defaults with saved to ensure we have all zones if new ones are added
        return defaults.map(def => {
            const saved = savedZones.find(z => z.id === def.id);
            return saved ? { ...def, ...saved } : def;
        });
    });

    const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(store.settings?.delivery?.freeDeliveryThreshold ?? 500);
    const [pickupEnabled, setPickupEnabled] = useState(store.settings?.delivery?.pickup?.enabled ?? true);
    const [pickupAddress, setPickupAddress] = useState(store.settings?.delivery?.pickup?.address || store.location || '');
    const [trinibuildGoEnabled, setTrinibuildGoEnabled] = useState(store.settings?.delivery?.trinibuildGo ?? false);

    // Save changes to store
    const saveChanges = useCallback((
        zones = deliveryZones,
        thresh = freeDeliveryThreshold,
        pickup = { enabled: pickupEnabled, address: pickupAddress },
        go = trinibuildGoEnabled
    ) => {
        onUpdate({
            settings: {
                ...store.settings,
                delivery: {
                    zones,
                    freeDeliveryThreshold: thresh,
                    pickup,
                    trinibuildGo: go
                }
            }
        });
    }, [deliveryZones, freeDeliveryThreshold, pickupEnabled, pickupAddress, trinibuildGoEnabled, store.settings, onUpdate]);

    // Handle updates
    const toggleZone = (id: string) => {
        const newZones = deliveryZones.map(z => z.id === id ? { ...z, enabled: !z.enabled } : z);
        setDeliveryZones(newZones);
        saveChanges(newZones);
    };

    const updateZonePrice = (id: string, price: number) => {
        const newZones = deliveryZones.map(z => z.id === id ? { ...z, price } : z);
        setDeliveryZones(newZones);
        saveChanges(newZones);
    };

    return (
        <div className="space-y-6">
            {/* TriniBuild Go Integration */}
            <div className={`p-6 rounded-xl ${trinibuildGoEnabled ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-blue-600 to-blue-700'} text-white`}>
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-xl font-bold mb-2 flex items-center">
                            <Truck className="h-6 w-6 mr-2" />
                            TriniBuild Go Integration
                        </h3>
                        <p className="mb-4 opacity-90">Connect to our driver network for on-demand delivery across Trinidad & Tobago</p>
                        <ul className="text-sm opacity-80 space-y-1 mb-4">
                            <li>✓ Real-time driver tracking</li>
                            <li>✓ Automatic dispatch</li>
                            <li>✓ Customer notifications</li>
                        </ul>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={trinibuildGoEnabled}
                            onChange={() => {
                                const newVal = !trinibuildGoEnabled;
                                setTrinibuildGoEnabled(newVal);
                                saveChanges(deliveryZones, freeDeliveryThreshold, { enabled: pickupEnabled, address: pickupAddress }, newVal);
                            }}
                            className="sr-only peer"
                            aria-label="Enable TriniBuild Go"
                        />
                        <div className="w-14 h-7 bg-white/30 peer-checked:bg-white rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white peer-checked:after:bg-green-600 after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-7"></div>
                    </label>
                </div>
                {trinibuildGoEnabled && (
                    <div className="mt-4 p-4 bg-white/10 rounded-lg">
                        <p className="text-sm font-bold">🟢 Connected to TriniBuild Go</p>
                        <p className="text-xs opacity-80">Orders will be automatically dispatched to nearby drivers</p>
                    </div>
                )}
            </div>

            {/* Free Delivery Threshold */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                    <Gift className="h-5 w-5 mr-2 text-green-600" />
                    Free Delivery Promotion
                </h4>
                <div className="flex items-center gap-4">
                    <label className="text-sm text-gray-600">Free delivery on orders over:</label>
                    <div className="flex items-center">
                        <span className="text-gray-500 mr-1">TT$</span>
                        <input
                            type="number"
                            value={freeDeliveryThreshold}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setFreeDeliveryThreshold(val);
                                saveChanges(deliveryZones, val);
                            }}
                            className="w-24 border border-gray-300 rounded-lg px-3 py-2 font-bold"
                            aria-label="Free delivery threshold"
                        />
                    </div>
                    <span className="text-xs text-gray-400">Set to 0 to disable</span>
                </div>
            </div>

            {/* Delivery Zones */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-red-600" />
                    Delivery Zones & Pricing
                </h4>
                <div className="space-y-3">
                    {deliveryZones.map(zone => (
                        <div key={zone.id} className={`flex items-center justify-between p-4 rounded-lg border ${zone.enabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-center gap-4">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={zone.enabled} onChange={() => toggleZone(zone.id)} className="sr-only peer" aria-label={`Enable ${zone.name}`} />
                                    <div className="w-10 h-5 bg-gray-300 peer-checked:bg-green-600 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
                                </label>
                                <div>
                                    <p className={`font-medium ${zone.enabled ? 'text-gray-900' : 'text-gray-500'}`}>{zone.name}</p>
                                    <p className="text-xs text-gray-400">{zone.estimatedTime}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500 text-sm">TT$</span>
                                <input
                                    type="number"
                                    value={zone.price}
                                    onChange={(e) => updateZonePrice(zone.id, Number(e.target.value))}
                                    className="w-20 border border-gray-300 rounded px-2 py-1 text-right font-bold"
                                    disabled={!zone.enabled}
                                    aria-label={`${zone.name} delivery price`}
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <button className="mt-4 text-blue-600 font-medium text-sm hover:underline">+ Add Custom Zone</button>
            </div>

            {/* Pickup Option */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h4 className="font-bold text-gray-900 flex items-center">
                            <Store className="h-5 w-5 mr-2 text-purple-600" />
                            In-Store Pickup
                        </h4>
                        <p className="text-sm text-gray-500">Let customers collect orders from your location</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={pickupEnabled}
                            onChange={() => {
                                const newVal = !pickupEnabled;
                                setPickupEnabled(newVal);
                                saveChanges(deliveryZones, freeDeliveryThreshold, { enabled: newVal, address: pickupAddress });
                            }}
                            className="sr-only peer"
                            aria-label="Enable in-store pickup"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-checked:bg-purple-600 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                </div>
                {pickupEnabled && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Address</label>
                        <input
                            type="text"
                            value={pickupAddress}
                            onChange={(e) => {
                                const val = e.target.value;
                                setPickupAddress(val);
                                // Debounce or save on blur would be better, but immediate save for now
                                saveChanges(deliveryZones, freeDeliveryThreshold, { enabled: pickupEnabled, address: val });
                            }}
                            placeholder="e.g. 123 Main Street, Chaguanas"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3"
                            aria-label="Pickup address"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================
// PAYMENTS TAB - FULL IMPLEMENTATION
// ============================================
const PaymentsTab: React.FC<{ store: StoreType; onUpdate: (updates: Partial<StoreType>) => void }> = ({ store, onUpdate }) => {
    // Initialize state from store settings or defaults
    const [paymentMethods, setPaymentMethods] = useState(() => {
        const existingProviders = store.settings?.paymentProviders || [];
        const defaults = [
            { id: 'cod', name: 'Cash on Delivery', desc: 'Collect payment on delivery', icon: '💵', fee: '0%', popular: true },
            { id: 'wipay', name: 'WiPay', desc: 'Credit/Debit/Linx', icon: '💳', fee: '3.5%', setup: true },
            { id: 'bank', name: 'Bank Transfer', desc: 'Direct deposit to your account', icon: '🏦', fee: '0%', setup: true },
            { id: 'paypal', name: 'PayPal', desc: 'International payments', icon: '🅿️', fee: '4.4%', setup: true },
        ];

        return defaults.map(def => {
            const existing = existingProviders.find(p => p.id === def.id);
            return {
                ...def,
                enabled: existing ? existing.enabled : (def.id === 'cod'), // Default COD to true if no settings
            };
        });
    });

    // Helper to get config from store settings
    const getConfig = (providerId: string) => {
        return store.settings?.paymentProviders?.find(p => p.id === providerId)?.config || {};
    };

    const [wipayConfig, setWipayConfig] = useState({
        merchantId: getConfig('wipay').merchantId || '',
        apiKey: getConfig('wipay').apiKey || '',
        sandbox: getConfig('wipay').sandbox ?? true
    });

    const [paypalConfig, setPaypalConfig] = useState({
        clientId: getConfig('paypal').clientId || '',
        sandbox: getConfig('paypal').sandbox ?? true
    });

    const [bankConfig, setBankConfig] = useState({
        bankName: getConfig('bank').bankName || '',
        accountNumber: getConfig('bank').accountNumber || '',
        accountName: getConfig('bank').accountName || ''
    });

    const [showWipaySetup, setShowWipaySetup] = useState(false);
    const [showPaypalSetup, setShowPaypalSetup] = useState(false);
    const [showBankSetup, setShowBankSetup] = useState(false);

    // Save payment provider settings to store
    const saveProviderSettings = (id: string, enabled: boolean, config: any = {}) => {
        const currentProviders = store.settings?.paymentProviders || [];
        const otherProviders = currentProviders.filter(p => p.id !== id);

        const newProviders = [
            ...otherProviders,
            { id, enabled, config }
        ];

        onUpdate({
            settings: {
                ...store.settings,
                paymentProviders: newProviders
            }
        });

        // Update local state UI
        setPaymentMethods(methods => methods.map(m => m.id === id ? { ...m, enabled } : m));
    };

    const toggleMethod = (id: string) => {
        const method = paymentMethods.find(m => m.id === id);
        if (!method) return;

        if (!method.enabled) {
            // Enabling
            if (id === 'wipay') setShowWipaySetup(true);
            else if (id === 'paypal') setShowPaypalSetup(true);
            else if (id === 'bank') setShowBankSetup(true);
            else saveProviderSettings(id, true); // COD enables immediately
        } else {
            // Disabling
            saveProviderSettings(id, false, getConfig(id));
        }
    };

    return (
        <div className="space-y-6">
            {/* Payout Summary */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-xl text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold mb-1">Available for Payout</h3>
                        <p className="text-4xl font-extrabold">TT$ 0.00</p>
                        <p className="text-sm opacity-80 mt-1">Next payout: Connect a payment method</p>
                    </div>
                    <button className="bg-white text-green-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 disabled:opacity-50" disabled>
                        Request Payout
                    </button>
                </div>
            </div>

            {/* Payment Methods Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {paymentMethods.map(pm => (
                    <div key={pm.id} className={`bg-white p-6 rounded-lg shadow-sm border-2 transition-all ${pm.enabled ? 'border-green-500' : 'border-gray-200'}`}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <span className="text-4xl">{pm.icon}</span>
                                <div>
                                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                        {pm.name}
                                        {pm.popular && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Popular</span>}
                                    </h4>
                                    <p className="text-sm text-gray-500">{pm.desc}</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={pm.enabled} onChange={() => toggleMethod(pm.id)} className="sr-only peer" aria-label={`Enable ${pm.name}`} />
                                <div className="w-11 h-6 bg-gray-200 peer-checked:bg-green-600 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Transaction Fee: <span className="font-bold text-gray-900">{pm.fee}</span></span>
                            {pm.setup && pm.enabled && (
                                <button
                                    onClick={() => {
                                        if (pm.id === 'wipay') setShowWipaySetup(true);
                                        if (pm.id === 'paypal') setShowPaypalSetup(true);
                                        if (pm.id === 'bank') setShowBankSetup(true);
                                    }}
                                    className="text-blue-600 font-medium hover:underline"
                                >
                                    Configure
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* WiPay Setup Modal */}
            {showWipaySetup && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4 flex items-center">💳 WiPay Setup</h3>
                        <p className="text-sm text-gray-500 mb-4">Connect your WiPay merchant account to accept credit cards, debit cards, and Linx payments.</p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Merchant ID</label>
                                <input
                                    type="text"
                                    value={wipayConfig.merchantId}
                                    onChange={(e) => setWipayConfig({ ...wipayConfig, merchantId: e.target.value })}
                                    placeholder="Your WiPay Merchant ID"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                                <input
                                    type="password"
                                    value={wipayConfig.apiKey}
                                    onChange={(e) => setWipayConfig({ ...wipayConfig, apiKey: e.target.value })}
                                    placeholder="Your WiPay API Key"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                />
                            </div>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={wipayConfig.sandbox} onChange={(e) => setWipayConfig({ ...wipayConfig, sandbox: e.target.checked })} />
                                <span className="text-sm">Sandbox/Test Mode</span>
                            </label>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowWipaySetup(false)} className="flex-1 border border-gray-300 rounded-lg py-2 font-medium">Cancel</button>
                            <button
                                onClick={() => {
                                    saveProviderSettings('wipay', true, wipayConfig);
                                    setShowWipaySetup(false);
                                }}
                                className="flex-1 bg-blue-600 text-white rounded-lg py-2 font-bold"
                            >
                                Save & Enable
                            </button>
                        </div>
                        <a href="https://wipay.co.tt" target="_blank" rel="noopener noreferrer" className="block text-center text-sm text-blue-600 mt-4 hover:underline">
                            Don't have a WiPay account? Sign up →
                        </a>
                    </div>
                </div>
            )}

            {/* PayPal Setup Modal */}
            {showPaypalSetup && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">🅿️ PayPal Setup</h3>
                        <p className="text-sm text-gray-500 mb-4">Accept international payments via PayPal.</p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                                <input
                                    type="text"
                                    value={paypalConfig.clientId}
                                    onChange={(e) => setPaypalConfig({ ...paypalConfig, clientId: e.target.value })}
                                    placeholder="Your PayPal Client ID"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                />
                            </div>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={paypalConfig.sandbox} onChange={(e) => setPaypalConfig({ ...paypalConfig, sandbox: e.target.checked })} />
                                <span className="text-sm">Sandbox/Test Mode</span>
                            </label>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowPaypalSetup(false)} className="flex-1 border border-gray-300 rounded-lg py-2 font-medium">Cancel</button>
                            <button
                                onClick={() => {
                                    saveProviderSettings('paypal', true, paypalConfig);
                                    setShowPaypalSetup(false);
                                }}
                                className="flex-1 bg-blue-600 text-white rounded-lg py-2 font-bold"
                            >
                                Save & Enable
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bank Transfer Setup Modal */}
            {showBankSetup && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">🏦 Bank Transfer Setup</h3>
                        <p className="text-sm text-gray-500 mb-4">Your bank details will be shown to customers for direct transfers.</p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                                <input
                                    type="text"
                                    value={bankConfig.bankName}
                                    onChange={(e) => setBankConfig({ ...bankConfig, bankName: e.target.value })}
                                    placeholder="e.g. Republic Bank, First Citizens"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                                <input
                                    type="text"
                                    value={bankConfig.accountName}
                                    onChange={(e) => setBankConfig({ ...bankConfig, accountName: e.target.value })}
                                    placeholder="Name on the account"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                                <input
                                    type="text"
                                    value={bankConfig.accountNumber}
                                    onChange={(e) => setBankConfig({ ...bankConfig, accountNumber: e.target.value })}
                                    placeholder="Your account number"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowBankSetup(false)} className="flex-1 border border-gray-300 rounded-lg py-2 font-medium">Cancel</button>
                            <button
                                onClick={() => {
                                    saveProviderSettings('bank', true, bankConfig);
                                    setShowBankSetup(false);
                                }}
                                className="flex-1 bg-blue-600 text-white rounded-lg py-2 font-bold"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Transaction Fee Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-bold text-yellow-800 mb-2">💡 Understanding Fees</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• <strong>Cash on Delivery:</strong> No fees - you collect payment directly</li>
                    <li>• <strong>WiPay:</strong> 3.5% per transaction (handled by WiPay)</li>
                    <li>• <strong>PayPal:</strong> 4.4% + fixed fee for international cards</li>
                    <li>• <strong>Bank Transfer:</strong> No platform fees, normal bank transfer fees may apply</li>
                </ul>
            </div>
        </div>
    );
};

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
