import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  DollarSign, 
  Truck, 
  CheckCircle,
  Clock,
  TrendingUp,
  Filter,
  Search
} from 'lucide-react';
import { codService, CODOrder } from '../../services/codService';
import { CODOrderManager } from './CODOrderManager';

interface CODStats {
  total_orders: number;
  pending_orders: number;
  out_for_delivery: number;
  total_revenue: number;
  pending_collection: number;
}

export const CODDashboard: React.FC = () => {
  const [stats, setStats] = useState<CODStats | null>(null);
  const [orders, setOrders] = useState<CODOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<CODOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<CODOrder | null>(null);

  useEffect(() => {
    loadDashboardData();
    // Auto-refresh every minute
    const interval = setInterval(loadDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterOrders();
  }, [selectedStatus, searchQuery, orders]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // In real implementation, fetch from your store's orders
      // For now, using mock data structure
      await loadOrders();
      await loadStats();
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    // Mock implementation - replace with actual Supabase query
    // const { data } = await supabase.from('orders').select('*').eq('payment_method', 'cod')
    setOrders([]);
  };

  const loadStats = async () => {
    // Calculate stats from orders
    setStats({
      total_orders: orders.length,
      pending_orders: orders.filter(o => o.status === 'placed' || o.status === 'confirmed').length,
      out_for_delivery: orders.filter(o => o.status === 'out_for_delivery').length,
      total_revenue: orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total_amount, 0),
      pending_collection: orders.filter(o => o.payment_status === 'pending').reduce((sum, o) => sum + o.total_amount, 0),
    });
  };

  const filterOrders = () => {
    let filtered = orders;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(o => o.status === selectedStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(o =>
        o.order_number.toLowerCase().includes(query) ||
        o.customer_name.toLowerCase().includes(query) ||
        o.customer_phone.includes(query)
      );
    }

    setFilteredOrders(filtered);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      placed: 'bg-gray-100 text-gray-600',
      confirmed: 'bg-blue-100 text-blue-600',
      assigned: 'bg-purple-100 text-purple-600',
      out_for_delivery: 'bg-yellow-100 text-yellow-600',
      delivered: 'bg-green-100 text-green-600',
      cancelled: 'bg-red-100 text-red-600',
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (selectedOrder) {
    return (
      <div className="p-6">
        <button
          onClick={() => setSelectedOrder(null)}
          className="mb-4 text-sm font-bold text-trini-red hover:text-red-700"
        >
          ← Back to Dashboard
        </button>
        <CODOrderManager order={selectedOrder} onUpdate={loadDashboardData} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900">
          COD Dashboard
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage cash on delivery orders and settlements
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-trini-red" />
              <span className="text-xs font-bold text-gray-500">TOTAL</span>
            </div>
            <div className="text-3xl font-black text-gray-900">
              {stats.total_orders}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              COD Orders
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-yellow-600" />
              <span className="text-xs font-bold text-gray-500">PENDING</span>
            </div>
            <div className="text-3xl font-black text-gray-900">
              {stats.pending_orders}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Awaiting Confirmation
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <Truck className="w-8 h-8 text-purple-600" />
              <span className="text-xs font-bold text-gray-500">IN TRANSIT</span>
            </div>
            <div className="text-3xl font-black text-gray-900">
              {stats.out_for_delivery}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Out for Delivery
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-trini-red to-red-700 rounded-xl p-6 shadow-sm text-white"
          >
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-white" />
              <span className="text-xs font-bold text-white/80">PENDING</span>
            </div>
            <div className="text-3xl font-black">
              ${stats.pending_collection.toFixed(2)}
            </div>
            <div className="text-sm text-white/80 mt-1">
              Cash to Collect
            </div>
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order #, name, or phone..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
            >
              <option value="all">All Orders</option>
              <option value="placed">Placed</option>
              <option value="confirmed">Confirmed</option>
              <option value="assigned">Assigned</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No COD orders found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setSelectedOrder(order)}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-black text-gray-900">
                        {order.order_number}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                        {order.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {order.customer_name} • {order.customer_phone}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-trini-red">
                      ${order.total_amount.toFixed(2)}
                    </div>
                    {order.driver_name && (
                      <p className="text-xs text-gray-600 mt-1">
                        Driver: {order.driver_name}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
