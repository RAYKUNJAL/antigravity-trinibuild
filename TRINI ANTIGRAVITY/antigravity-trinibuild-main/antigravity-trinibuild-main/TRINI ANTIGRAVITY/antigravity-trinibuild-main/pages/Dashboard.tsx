import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line } from 'recharts';
import {
  DollarSign, Users, ShoppingBag, Plus, Edit, Trash2, X, Image as ImageIcon,
  ArrowUp, UploadCloud, Loader2, Sparkles, Wand2, ExternalLink,
  Store, Package, Settings as SettingsIcon, MessageCircle, ScanLine, Lock, TrendingUp, Crown,
  CheckCircle, Clock, Truck, AlertCircle, FileText, Briefcase, Plane, FileCheck,
  Car, Ticket, Home as HomeIcon, MapPin, Star, ChevronRight, LayoutGrid
} from 'lucide-react';
import { Product } from '../types';
import { generateProductDescription, generateProductImage, analyzeProductPhoto, generateStoreLogo } from '../services/geminiService';
import { orderService, OrderResponse } from '../services/orderService';
import { documentService, DocumentRequest } from '../services/documentService';
import { Link } from 'react-router-dom';
import { ChatWidget } from '../components/ChatWidget';
import { storeService } from '../services/storeService';

export const Dashboard: React.FC = () => {
  // App Context State
  const [activeApp, setActiveApp] = useState<'store' | 'driver' | 'pro' | 'promoter' | 'agent'>('store');

  // Store State
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'documents' | 'settings'>('overview');

  // User Subscription State (Simulated)
  const [isPro, setIsPro] = useState(false);

  // Data States
  const [vendorOrders, setVendorOrders] = useState<OrderResponse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Product Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    price: 0,
    stock: 0,
    description: '',
    image: '',
    status: 'active'
  });
  const [uploading, setUploading] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Branding / Settings State
  const [logoPrompt, setLogoPrompt] = useState({ name: 'My Store', type: 'Restaurant' });
  const [generatedLogo, setGeneratedLogo] = useState('');
  const [generatingLogo, setGeneratingLogo] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // Document Generation State
  const [docType, setDocType] = useState<DocumentRequest['type']>('job_letter');
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [docSuccess, setDocSuccess] = useState<string | null>(null);

  // Agent Test State
  const [showAgentTest, setShowAgentTest] = useState(false);

  // Store Context for AI Agent
  const storeContext = {
    name: logoPrompt.name,
    description: "A local business powered by TriniBuild.",
    whatsapp: whatsappNumber,
    products: products
  };

  // Chart Data (Mock)
  const revenueData = [
    { name: 'Mon', sales: 0 },
    { name: 'Tue', sales: 0 },
    { name: 'Wed', sales: 0 },
    { name: 'Thu', sales: 0 },
    { name: 'Fri', sales: 0 },
    { name: 'Sat', sales: 0 },
    { name: 'Sun', sales: 0 },
  ];

  // Handlers
  const [storeId, setStoreId] = useState<string | null>(null);

  // ... 

  // Handlers
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({ title: '', price: 0, stock: 0, description: '', images: [], status: 'active' } as any); // Cast for now as interface mismatch might exist
    setIsProductModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      ...product,
      name: product.title, // Map title to name for form
      image: product.images[0] // Map first image
    } as any);
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Delete this product?')) {
      const success = await storeService.deleteProduct(id);
      if (success) {
        setProducts(products.filter(p => p.id !== id));
      } else {
        alert("Failed to delete product");
      }
    }
  };

  // ...

  // Load Store Data on Mount
  useEffect(() => {
    // Check Subscription
    const subscription = localStorage.getItem('trinibuild_subscription');
    if (subscription === 'Growth' || subscription === 'Empire') {
      setIsPro(true);
    }

    const loadStore = async () => {
      const store = await storeService.getMyStore();
      if (store) {
        setStoreId(store.id);
        setLogoPrompt({ name: store.businessName, type: 'Store' });
        setProducts(store.products || []);
        setWhatsappNumber(store.whatsapp || '');
      }
    };
    loadStore();

    // Fetch Orders
    const fetchOrders = async () => {
      const orders = await orderService.getVendorOrders();
      setVendorOrders(orders);
    };
    fetchOrders();
  }, []);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.price === undefined) return;
    setIsSaving(true);

    let finalImage = formData.image;
    if (!finalImage && formData.name) {
      try {
        finalImage = await generateProductImage(formData.name);
      } catch (e) { console.log("Auto-image failed"); }
    }

    const productData = {
      title: formData.name,
      price: Number(formData.price),
      description: formData.description,
      images: finalImage ? [finalImage] : [],
      category: 'General'
    };

    try {
      if (editingProduct) {
        const updated = await storeService.updateProduct(editingProduct.id, productData);
        if (updated) {
          setProducts(products.map(p => p.id === updated.id ? updated : p));
        }
      } else {
        if (storeId) {
          const newProduct = await storeService.addProduct(storeId, productData);
          if (newProduct) {
            setProducts([...products, newProduct]);
          }
        } else {
          alert("No store found. Please create a store first.");
        }
      }
    } catch (e) {
      console.error("Save failed", e);
      alert("Failed to save product");
    }

    setIsProductModalOpen(false);
    setIsSaving(false);
  };

  // --- APP SWITCHER LOGIC ---
  const apps = [
    { id: 'store', label: 'Marketplace', icon: Store, color: 'text-trini-red', bg: 'bg-red-50' },
    { id: 'driver', label: 'Driver', icon: Car, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'pro', label: 'Service Pro', icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'promoter', label: 'Promoter', icon: Ticket, color: 'text-pink-600', bg: 'bg-pink-50' },
    { id: 'agent', label: 'Real Estate', icon: HomeIcon, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col fixed h-full z-10">

        {/* App Switcher Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-trini-black rounded-full flex items-center justify-center text-white font-bold text-lg">
              RK
            </div>
            <div>
              <h2 className="font-bold text-gray-900 leading-tight">Ray Kunjal</h2>
              <p className="text-xs text-gray-500">Unified Account</p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase px-2 mb-2">My Apps</p>
            {apps.map(app => (
              <button
                key={app.id}
                onClick={() => setActiveApp(app.id as any)}
                className={`w-full flex items-center px-3 py-2 rounded-lg transition-all ${activeApp === app.id ? `${app.bg} ${app.color} font-bold shadow-sm` : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <app.icon className="h-4 w-4 mr-3" />
                {app.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contextual Navigation */}
        <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
          {activeApp === 'store' && (
            <>
              <p className="text-xs font-bold text-gray-400 uppercase px-2 mb-2 mt-2">Store Menu</p>
              {[
                { id: 'overview', icon: Sparkles, label: 'Overview' },
                { id: 'products', icon: ShoppingBag, label: 'Products' },
                { id: 'orders', icon: Package, label: 'Orders' },
                { id: 'documents', icon: FileText, label: 'Documents' },
                { id: 'settings', icon: SettingsIcon, label: 'Settings' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === item.id
                    ? 'bg-gray-100 text-gray-900 font-bold'
                    : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.label}
                </button>
              ))}
            </>
          )}

          {activeApp === 'driver' && (
            <div className="text-center py-8">
              <Car className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Driver Dashboard</p>
            </div>
          )}
          {/* Add similar placeholders for other apps if needed in nav */}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-100">
          {activeApp === 'store' && (
            <Link to="/store/preview" target="_blank" className="flex items-center justify-center w-full bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-bold hover:bg-gray-200">
              <ExternalLink className="h-4 w-4 mr-2" /> View Storefront
            </Link>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow md:ml-64 p-8">

        {/* --- STORE DASHBOARD --- */}
        {activeApp === 'store' && (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center">
                  <h1 className="text-2xl font-bold text-gray-900">Store Overview</h1>
                  {!isPro && (
                    <Link to="/pricing" className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center shadow-lg hover:scale-105 transition-transform">
                      <Crown className="h-4 w-4 mr-2" /> Upgrade to Pro
                    </Link>
                  )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-2">TT$ {vendorOrders.reduce((acc, order) => acc + order.total, 0).toFixed(2)}</h3>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg text-green-600">
                        <DollarSign className="h-6 w-6" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500 font-medium">Total Orders</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-2">{vendorOrders.length}</h3>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                        <Package className="h-6 w-6" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 opacity-75 relative overflow-hidden">
                    {!isPro && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10">
                        <Link to="/pricing" className="flex items-center text-sm font-bold text-gray-900 bg-white px-3 py-1 rounded-full shadow border border-gray-200 hover:bg-gray-50">
                          <Lock className="h-3 w-3 mr-2 text-trini-red" /> Unlock Insights
                        </Link>
                      </div>
                    )}
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500 font-medium">Customer LTV</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-2">--</h3>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                        <TrendingUp className="h-6 w-6" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chart Area (Gated) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-80 relative">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Sales Performance</h3>
                  {!isPro && (
                    <div className="absolute inset-0 top-16 z-10 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm rounded-b-xl">
                      <Lock className="h-10 w-10 text-gray-400 mb-2" />
                      <h4 className="font-bold text-gray-900">Analytics Locked</h4>
                      <p className="text-sm text-gray-500 mb-4">Upgrade to see detailed sales trends.</p>
                      <Link to="/pricing" className="bg-trini-black text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-gray-800">
                        Unlock Charts
                      </Link>
                    </div>
                  )}
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="sales" stroke="#CE1126" strokeWidth={3} fillOpacity={0.1} fill="#CE1126" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* PRODUCTS TAB */}
            {activeTab === 'products' && (
              <div className="animate-in fade-in">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Products ({products.length}/10 Free)</h1>
                  <div className="flex gap-3">
                    <button className="bg-gray-100 text-gray-400 px-4 py-2 rounded-lg font-bold flex items-center cursor-not-allowed" title="Upgrade to Pro for Bulk Upload">
                      <UploadCloud className="h-5 w-5 mr-2" /> Bulk Upload (Pro)
                    </button>
                    <button onClick={handleOpenAdd} className="bg-trini-red text-white px-4 py-2 rounded-lg font-bold flex items-center hover:bg-red-700 transition-colors">
                      <Plus className="h-5 w-5 mr-2" /> Add Product
                    </button>
                  </div>
                </div>

                {products.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-300">
                    <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">No Products Yet</h3>
                    <p className="text-gray-500 mb-6">Start building your catalog.</p>
                    <button onClick={handleOpenAdd} className="text-trini-red font-bold hover:underline">
                      Add your first product
                    </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {products.map((product) => (
                          <tr key={product.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0">
                                  <img className="h-10 w-10 rounded-lg object-cover" src={product.image || 'https://via.placeholder.com/40'} alt="" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                  <div className="text-xs text-gray-500">Stock: {product.stock}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              TT$ {product.price}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {product.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button onClick={() => handleOpenEdit(product)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit className="h-4 w-4" /></button>
                              <button onClick={() => handleDeleteProduct(product.id)} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="text-center py-10">
                <h2 className="text-xl font-bold">Settings</h2>
                <p className="text-gray-500">Configure your store branding here.</p>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="animate-in fade-in">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>
                {vendorOrders.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-16">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-gray-900">No Orders Yet</h3>
                    <p className="text-gray-500">Share your store link to start selling.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {vendorOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                              {order.orderNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.customerName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              TT$ {order.total.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold uppercase">{order.deliveryOption}</span>
                                <span className="text-[10px] text-gray-400">{order.paymentMethod?.replace(/_/g, ' ')}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full 
                                                ${order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                  order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                                    order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                      'bg-gray-100 text-gray-800'}`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end gap-2">
                                {order.status === 'PENDING' && (
                                  <button
                                    onClick={() => handleStatusUpdate(order.id, 'PROCESSING')}
                                    className="text-blue-600 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded text-xs font-bold"
                                  >
                                    Accept
                                  </button>
                                )}
                                {order.status === 'PROCESSING' && (
                                  <button
                                    onClick={() => handleStatusUpdate(order.id, 'COMPLETED')}
                                    className="text-green-600 hover:text-green-900 bg-green-50 px-2 py-1 rounded text-xs font-bold"
                                  >
                                    Complete
                                  </button>
                                )}
                                <button className="text-gray-400 hover:text-gray-600">
                                  <ExternalLink className="h-4 w-4" />
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
            )}

            {/* DOCUMENTS TAB */}
            {activeTab === 'documents' && (
              <div className="animate-in fade-in">
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-gray-900">Documentation Freedom</h1>
                  <p className="text-gray-500 mt-2">Stop getting rejected. Automatically generate the paperwork financial institutions require.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                  {[
                    { id: 'job_letter', icon: Briefcase, title: 'Job Letters', desc: 'Proof of self-employment for loans.' },
                    { id: 'proof_of_income', icon: DollarSign, title: 'Proof of Income', desc: 'Verified statements from sales data.' },
                    { id: 'visa_letter', icon: Plane, title: 'Visa Letters', desc: 'Support docs for US/UK/Canada interviews.' },
                    { id: 'invoice', icon: FileText, title: 'Invoices', desc: 'Professional white-label invoices.' },
                  ].map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => setDocType(doc.id as any)}
                      className={`p-6 rounded-xl border text-left transition-all ${docType === doc.id
                        ? 'border-trini-red bg-red-50 ring-2 ring-trini-red ring-opacity-20'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                        }`}
                    >
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${docType === doc.id ? 'bg-trini-red text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                        <doc.icon className="h-6 w-6" />
                      </div>
                      <h3 className="font-bold text-gray-900 mb-1">{doc.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">{doc.desc}</p>
                    </button>
                  ))}
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-2xl relative overflow-hidden">
                  {!isPro && (
                    <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8">
                      <div className="bg-gray-100 p-4 rounded-full mb-4">
                        <Lock className="h-8 w-8 text-gray-500" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Premium Feature</h3>
                      <p className="text-gray-500 mb-6 max-w-sm">
                        Official document generation is available exclusively to Pro and Empire members.
                      </p>
                      <Link to="/pricing" className="bg-gradient-to-r from-trini-red to-red-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform flex items-center">
                        <Crown className="h-5 w-5 mr-2" /> Upgrade to Unlock
                      </Link>
                    </div>
                  )}

                  <h2 className="text-xl font-bold text-gray-900 mb-6">Generate {docType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h2>

                  {docSuccess ? (
                    <div className="text-center py-8 animate-in zoom-in">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Document Ready!</h3>
                      <p className="text-gray-500 mb-6">{docSuccess}</p>
                      <div className="flex gap-4 justify-center">
                        <button onClick={() => setDocSuccess(null)} className="text-gray-500 hover:text-gray-700 font-bold">Generate Another</button>
                        <button className="bg-trini-black text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-gray-800 flex items-center">
                          <FileCheck className="h-4 w-4 mr-2" /> Download PDF
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-800">
                          This document will be generated using your verified store data (Name: <strong>{logoPrompt.name}</strong>). Ensure your profile details are up to date before generating.
                        </p>
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={handleGenerateDocument}
                          disabled={isGeneratingDoc || !isPro}
                          className="bg-trini-red text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-red-700 disabled:opacity-70 flex items-center transition-all"
                        >
                          {isGeneratingDoc ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Generating...
                            </>
                          ) : (
                            <>
                              Generate Document <ArrowUp className="h-4 w-4 ml-2 rotate-45" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* --- DRIVER DASHBOARD --- */}
        {activeApp === 'driver' && (
          <div className="animate-in fade-in">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Driver Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">Today's Earnings</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">TT$ 450.00</h3>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">Trips Completed</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">12</h3>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">Driver Rating</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2 flex items-center">4.9 <Star className="h-5 w-5 text-yellow-400 ml-1 fill-current" /></h3>
              </div>
            </div>
            <div className="bg-blue-50 p-8 rounded-xl border border-blue-100 text-center">
              <Car className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Drive?</h3>
              <p className="text-gray-600 mb-6">Go online to start receiving ride requests.</p>
              <Link to="/rides" className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 shadow-lg inline-flex items-center">
                Launch Driver App <ChevronRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>
        )}

        {/* --- PRO DASHBOARD --- */}
        {activeApp === 'pro' && (
          <div className="animate-in fade-in">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Service Pro Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">Active Leads</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">5</h3>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">Profile Views</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">128</h3>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">Response Rate</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">98%</h3>
              </div>
            </div>
            <div className="bg-purple-50 p-8 rounded-xl border border-purple-100 text-center">
              <Briefcase className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Grow Your Business</h3>
              <p className="text-gray-600 mb-6">Update your profile to attract more customers.</p>
              <Link to="/work/profile" className="bg-purple-600 text-white px-8 py-3 rounded-full font-bold hover:bg-purple-700 shadow-lg inline-flex items-center">
                Edit Profile <ChevronRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>
        )}

        {/* --- PROMOTER DASHBOARD --- */}
        {activeApp === 'promoter' && (
          <div className="animate-in fade-in">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Promoter Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">Tickets Sold</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">1,240</h3>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">Event Revenue</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">TT$ 85k</h3>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">Upcoming Events</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">2</h3>
              </div>
            </div>
            <div className="bg-pink-50 p-8 rounded-xl border border-pink-100 text-center">
              <Ticket className="h-12 w-12 text-pink-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Manage Your Events</h3>
              <p className="text-gray-600 mb-6">Create events, manage guest lists, and track sales.</p>
              <Link to="/tickets" className="bg-pink-600 text-white px-8 py-3 rounded-full font-bold hover:bg-pink-700 shadow-lg inline-flex items-center">
                Go to Event Manager <ChevronRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>
        )}

        {/* --- AGENT DASHBOARD --- */}
        {activeApp === 'agent' && (
          <div className="animate-in fade-in">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Real Estate Agent Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">Active Listings</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">8</h3>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">Total Views</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">3,450</h3>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">New Leads</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">12</h3>
              </div>
            </div>
            <div className="bg-green-50 p-8 rounded-xl border border-green-100 text-center">
              <HomeIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Manage Listings</h3>
              <p className="text-gray-600 mb-6">Post new properties and manage inquiries.</p>
              <Link to="/real-estate" className="bg-green-600 text-white px-8 py-3 rounded-full font-bold hover:bg-green-700 shadow-lg inline-flex items-center">
                Go to Property Manager <ChevronRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>
        )}

      </div>

      {/* Chat Widget for Testing */}
      {showAgentTest && (
        <ChatWidget mode="vendor" vendorContext={storeContext} />
      )}

      {/* Edit Modal (Preserved from original) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* ... Modal Content ... */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
            </div>
            <form onSubmit={handleSaveProduct} className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <label className="block text-sm font-bold text-gray-700 bg-white w-fit px-1">Product Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3 bg-white text-gray-900" required />
                <label className="block text-sm font-bold text-gray-700 bg-white w-fit px-1">Price</label>
                <input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} className="w-full border border-gray-300 rounded-lg p-3 bg-white text-gray-900" required />
              </div>
              <div className="flex justify-end pt-4">
                <button type="submit" className="bg-trini-red text-white px-6 py-2 rounded font-bold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
