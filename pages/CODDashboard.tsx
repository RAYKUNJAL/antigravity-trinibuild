/**
 * CODDashboard.tsx — Full Cash-on-Delivery Management System
 * Live orders, status pipeline, WhatsApp integration, commission view
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Phone, MapPin, Clock, CheckCircle, Truck,
  MessageCircle, DollarSign, TrendingUp, Package, XCircle,
  AlertCircle, RefreshCw, ChevronRight, Banknote, Eye,
  Filter, Search, Copy, Check
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { codSystemService, CreateCODOrderInput, CODOrderFull } from '../services/codSystemService';
import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending:           { label: 'Pending',          color: '#92400E', bg: '#FEF3C7', icon: Clock },
  confirmed:         { label: 'Confirmed',         color: '#065F46', bg: '#D1FAE5', icon: CheckCircle },
  preparing:         { label: 'Preparing',         color: '#1E40AF', bg: '#DBEAFE', icon: Package },
  picked_up:         { label: 'Picked Up',         color: '#5B21B6', bg: '#EDE9FE', icon: Truck },
  out_for_delivery:  { label: 'Out for Delivery',  color: '#7C3AED', bg: '#EDE9FE', icon: Truck },
  delivered:         { label: 'Delivered',         color: '#065F46', bg: '#D1FAE5', icon: CheckCircle },
  cancelled:         { label: 'Cancelled',         color: '#991B1B', bg: '#FEE2E2', icon: XCircle },
  returned:          { label: 'Returned',          color: '#6B7280', bg: '#F3F4F6', icon: AlertCircle },
};

const NEXT_STATUS: Record<string, string> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'picked_up',
  picked_up: 'out_for_delivery',
  out_for_delivery: 'delivered',
};

export default function CODDashboard() {
  const [user, setUser] = useState<any>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState('My Store');
  const [storePhone, setStorePhone] = useState('');
  const [orders, setOrders] = useState<CODOrderFull[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<CODOrderFull | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [copied, setCopied] = useState('');
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    if (!storeId) return;
    const [ordersData, statsData] = await Promise.all([
      codSystemService.getStoreOrders(storeId),
      codSystemService.getDashboardStats(storeId),
    ]);
    setOrders(ordersData);
    setStats(statsData);
    setLoading(false);
  }, [storeId]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/login'); return; }
      setUser(user);
      supabase.from('stores').select('id, name, phone').eq('owner_id', user.id).single().then(({ data }) => {
        if (data) { setStoreId(data.id); setStoreName(data.name); setStorePhone(data.phone || ''); }
      });
    });
  }, [navigate]);

  useEffect(() => { if (storeId) loadData(); }, [storeId, loadData]);

  // Real-time subscription
  useEffect(() => {
    if (!storeId) return;
    const sub = supabase.channel('cod_orders').on('postgres_changes',
      { event: '*', schema: 'public', table: 'cod_orders', filter: `store_id=eq.${storeId}` },
      () => loadData()
    ).subscribe();
    return () => { sub.unsubscribe(); };
  }, [storeId, loadData]);

  const advanceStatus = async (order: CODOrderFull) => {
    const next = NEXT_STATUS[order.order_status];
    if (!next) return;
    setUpdating(order.id);
    try {
      const extras: Record<string, string> = {};
      if (next === 'delivered') extras.payment_status = 'collected';
      await codSystemService.updateOrderStatus(order.id, next, extras);
      await loadData();
      if (selectedOrder?.id === order.id) setSelectedOrder({ ...order, order_status: next });
    } finally { setUpdating(null); }
  };

  const cancelOrder = async (order: CODOrderFull, reason: string) => {
    setUpdating(order.id);
    try {
      await codSystemService.updateOrderStatus(order.id, 'cancelled', { note: reason });
      await loadData();
      setSelectedOrder(null);
    } finally { setUpdating(null); }
  };

  const openWhatsApp = (order: CODOrderFull) => {
    const msg = codSystemService.buildWhatsAppMessage(order, storeName);
    const phone = order.customer_phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/1868${phone.slice(-7)}?text=${msg}`, '_blank');
  };

  const copyOrderRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopied(ref);
    setTimeout(() => setCopied(''), 2000);
  };

  const filteredOrders = orders.filter(o => {
    const matchFilter = filter === 'all' || o.order_status === filter;
    const matchSearch = !search || 
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      (o.order_ref || '').toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone.includes(search);
    return matchFilter && matchSearch;
  });

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
        <RefreshCw className="w-8 h-8 text-red-600" />
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">COD Orders</h1>
            <p className="text-sm text-gray-500">{storeName} · Real-time</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadData} className="p-2 rounded-lg hover:bg-gray-100">
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => setShowNewOrder(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
            >
              + New Order
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Today's Orders", value: stats.todayOrders || 0, icon: ShoppingBag, color: 'bg-blue-50 text-blue-600' },
            { label: 'Active Orders', value: stats.pending || 0, icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
            { label: 'Delivered', value: stats.delivered || 0, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
            { label: 'Net Revenue', value: `TT$${(stats.netRevenue || 0).toFixed(0)}`, icon: DollarSign, color: 'bg-red-50 text-red-600' },
          ].map(stat => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-4 border border-gray-200">
              <div className={`inline-flex p-2 rounded-lg ${stat.color} mb-3`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Commission breakdown */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-yellow-400" />
            <span className="font-semibold">Revenue Summary (All Time)</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-gray-400 text-xs mb-1">Gross Orders</p>
              <p className="text-xl font-bold">TT${(stats.grossRevenue || 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Platform Fee (5%)</p>
              <p className="text-xl font-bold text-red-400">−TT${(stats.platformFees || 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Your Earnings</p>
              <p className="text-xl font-bold text-green-400">TT${(stats.netRevenue || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search orders, customers..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  filter === s ? 'bg-red-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label || s}
                {s !== 'all' && <span className="ml-1 opacity-70">({orders.filter(o => o.order_status === s).length})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-3">
          {filteredOrders.length === 0 && (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No orders {filter !== 'all' ? `with status "${STATUS_CONFIG[filter]?.label}"` : 'yet'}</p>
              <p className="text-gray-400 text-sm mt-1">Share your store link to start receiving orders</p>
            </div>
          )}

          {filteredOrders.map(order => {
            const sc = STATUS_CONFIG[order.order_status] || STATUS_CONFIG.pending;
            const Icon = sc.icon;
            const isUpdating = updating === order.id;
            const nextStatus = NEXT_STATUS[order.order_status];
            const items = Array.isArray(order.items) ? order.items : [];

            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-all cursor-pointer"
                onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-gray-900">{order.customer_name}</span>
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1"
                          style={{ backgroundColor: sc.bg, color: sc.color }}
                        >
                          <Icon className="w-3 h-3" />
                          {sc.label}
                        </span>
                        {order.order_ref && (
                          <button
                            onClick={e => { e.stopPropagation(); copyOrderRef(order.order_ref); }}
                            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                          >
                            {copied === order.order_ref ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                            {order.order_ref}
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{order.customer_phone}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{order.customer_address?.slice(0, 40)}{(order.customer_address?.length || 0) > 40 ? '...' : ''}</span>
                        <span className="flex items-center gap-1"><Package className="w-3 h-3" />{items.length} item{items.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">TT${(order.total_amount || 0).toFixed(2)}</p>
                      <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('en-TT')}</p>
                    </div>
                  </div>
                </div>

                {/* Expanded order details */}
                <AnimatePresence>
                  {selectedOrder?.id === order.id && (
                    <motion.div
                      initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-gray-100 p-4 space-y-4">
                        {/* Items */}
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-2">Order Items</p>
                          <div className="space-y-1">
                            {items.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-gray-600">{item.name} × {item.quantity}</span>
                                <span className="font-medium">TT${(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                            <div className="flex justify-between text-sm text-gray-500">
                              <span>Subtotal</span><span>TT${(order.subtotal || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                              <span>Delivery</span><span>TT${(order.delivery_fee || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                              <span>VAT (12.5%)</span><span>TT${(order.vat_amount || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-gray-900">
                              <span>Total</span><span>TT${(order.total_amount || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-red-500">
                              <span>Platform Fee (5%)</span><span>−TT${(order.cod_commission_amount || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-semibold text-green-600">
                              <span>Your Payout</span><span>TT${(order.merchant_payout || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => openWhatsApp(order)}
                            className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp Customer
                          </button>

                          {nextStatus && (
                            <button
                              disabled={isUpdating}
                              onClick={() => advanceStatus(order)}
                              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                              {isUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                              Mark as {STATUS_CONFIG[nextStatus]?.label}
                            </button>
                          )}

                          {order.order_status === 'delivered' && (
                            <button
                              onClick={() => codSystemService.updateOrderStatus(order.id, 'delivered', { payment_status: 'verified' }).then(loadData)}
                              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Confirm Cash Received
                            </button>
                          )}

                          {!['delivered', 'cancelled', 'returned'].includes(order.order_status) && (
                            <button
                              onClick={() => cancelOrder(order, 'Customer requested cancellation')}
                              className="flex items-center gap-2 bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* New Order Quick-Entry Panel */}
      <AnimatePresence>
        {showNewOrder && (
          <QuickOrderPanel
            storeId={storeId!}
            onClose={() => setShowNewOrder(false)}
            onCreated={loadData}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Quick order entry panel
function QuickOrderPanel({ storeId, onClose, onCreated }: { storeId: string; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<Partial<CreateCODOrderInput>>({ store_id: storeId, items: [], payment_method: 'cod', delivery_fee: 25 });
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const addItem = () => {
    if (!itemName || !itemPrice) return;
    const items = [...(form.items || []), { product_id: Date.now().toString(), name: itemName, price: parseFloat(itemPrice), quantity: parseInt(itemQty) }];
    setForm(f => ({ ...f, items }));
    setItemName(''); setItemPrice(''); setItemQty('1');
  };

  const submit = async () => {
    if (!form.customer_name || !form.customer_phone || !form.customer_address || !form.items?.length) {
      setError('Please fill all required fields and add at least one item.'); return;
    }
    setSubmitting(true);
    try {
      await codSystemService.createOrder(form as CreateCODOrderInput);
      onCreated(); onClose();
    } catch (e: any) { setError(e.message); } finally { setSubmitting(false); }
  };

  const subtotal = (form.items || []).reduce((s, i) => s + i.price * i.quantity, 0);
  const total = subtotal + (form.delivery_fee || 25) + Math.round(subtotal * 0.125 * 100) / 100;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
        className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">New COD Order</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

          <div className="space-y-3">
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Customer Name *"
              value={form.customer_name || ''} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} />
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Customer Phone *"
              value={form.customer_phone || ''} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} />
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Delivery Address *"
              value={form.customer_address || ''} onChange={e => setForm(f => ({ ...f, customer_address: e.target.value }))} />
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Add Items</p>
            <div className="flex gap-2">
              <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Item name"
                value={itemName} onChange={e => setItemName(e.target.value)} />
              <input className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Price"
                type="number" value={itemPrice} onChange={e => setItemPrice(e.target.value)} />
              <input className="w-16 border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Qty"
                type="number" min="1" value={itemQty} onChange={e => setItemQty(e.target.value)} />
              <button onClick={addItem} className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium">+</button>
            </div>
            {(form.items || []).map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{item.name} × {item.quantity}</span>
                <span className="font-medium">TT${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {(form.items || []).length > 0 && (
            <div className="bg-green-50 rounded-lg p-4 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>TT${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Delivery</span><span>TT${form.delivery_fee?.toFixed(2)}</span></div>
              <div className="flex justify-between text-gray-600"><span>VAT (12.5%)</span><span>TT${(subtotal * 0.125).toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-gray-900 mt-2 pt-2 border-t border-green-200">
                <span>Total</span><span>TT${total.toFixed(2)}</span>
              </div>
            </div>
          )}

          <button
            disabled={submitting}
            onClick={submit}
            className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Creating Order...' : 'Create COD Order'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
