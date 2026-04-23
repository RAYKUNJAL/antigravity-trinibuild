import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, ShoppingCart, Users, TrendingUp, Mail, Gift, 
  Settings, HelpCircle, LogOut, Eye, Download, Plus
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';

interface MerchantStats {
  totalOrders: number;
  totalRevenue: number;
  activeListings: number;
  customerCount: number;
}

export const MerchantDashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<MerchantStats>({
    totalOrders: 0,
    totalRevenue: 0,
    activeListings: 0,
    customerCount: 0
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'customers' | 'marketing' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUser(user);
      await loadStats(user.id);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (userId: string) => {
    try {
      // Fetch orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('merchant_id', userId);

      // Fetch products
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('merchant_id', userId);

      // Calculate stats
      const totalRevenue = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
      const customerIds = new Set(orders?.map(o => o.customer_id) || []);

      setStats({
        totalOrders: orders?.length || 0,
        totalRevenue: totalRevenue,
        activeListings: products?.length || 0,
        customerCount: customerIds.size
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#E61E2B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const stats_grid = [
    { icon: ShoppingCart, label: 'Total Orders', value: stats.totalOrders, color: 'bg-blue-50 text-blue-600' },
    { icon: TrendingUp, label: 'Total Revenue', value: `TT$${stats.totalRevenue.toLocaleString()}`, color: 'bg-green-50 text-green-600' },
    { icon: Gift, label: 'Active Listings', value: stats.activeListings, color: 'bg-purple-50 text-purple-600' },
    { icon: Users, label: 'Customers', value: stats.customerCount, color: 'bg-orange-50 text-orange-600' }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'products', label: 'Products', icon: Gift },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'marketing', label: 'Marketing', icon: Mail },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const quick_actions = [
    { label: 'Add Product', icon: Plus, action: () => navigate('/products/ai-add'), color: 'bg-[#E61E2B]' },
    { label: 'View Store', icon: Eye, action: () => navigate('/'), color: 'bg-blue-600' },
    { label: 'Email Campaigns', icon: Mail, action: () => navigate('/email-campaigns'), color: 'bg-purple-600' },
    { label: 'Analytics', icon: BarChart3, action: () => navigate('/admin/keywords'), color: 'bg-green-600' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div 
        className="bg-white border-b border-gray-200 sticky top-16 z-40"
        variants={item}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
                Merchant Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Welcome back, {user.email?.split('@')[0]}</p>
            </div>
            <button
              onClick={() => {
                supabase.auth.signOut();
                navigate('/');
              }}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          {stats_grid.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div 
                key={idx}
                variants={item}
                className="bg-white rounded-lg p-6 border border-gray-200"
              >
                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-gray-900">{stat.value}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          {quick_actions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={idx}
                variants={item}
                onClick={action.action}
                className={`${action.color} text-white rounded-lg p-4 text-center font-bold hover:shadow-lg transition`}
              >
                <Icon className="w-6 h-6 mx-auto mb-2" />
                <span className="text-sm">{action.label}</span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Tabs */}
        <motion.div 
          className="bg-white rounded-lg border border-gray-200"
          variants={item}
          initial="hidden"
          animate="visible"
        >
          <div className="border-b border-gray-200 flex overflow-x-auto">
            {tabs.map((tab) => {
              const Tab = tab.icon as any;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-4 font-bold whitespace-nowrap transition ${
                    activeTab === tab.id
                      ? 'text-[#E61E2B] border-b-2 border-[#E61E2B]'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Tab className="w-5 h-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <motion.div variants={item} className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Dashboard Overview</h3>
                <p className="text-gray-600 mb-6">Track your sales, products, and customer engagement in real-time</p>
                <button className="bg-[#E61E2B] text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition">
                  View Analytics
                </button>
              </motion.div>
            )}

            {activeTab === 'products' && (
              <motion.div variants={item} className="text-center py-12">
                <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Your Products</h3>
                <p className="text-gray-600 mb-6">Manage and edit your product listings</p>
                <button onClick={() => navigate('/products/ai-add')} className="bg-[#E61E2B] text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition">
                  Add New Product
                </button>
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div variants={item} className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Your Orders</h3>
                <p className="text-gray-600 mb-6">View and manage customer orders</p>
                <button className="bg-[#E61E2B] text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition">
                  View Orders
                </button>
              </motion.div>
            )}

            {activeTab === 'customers' && (
              <motion.div variants={item} className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Your Customers</h3>
                <p className="text-gray-600 mb-6">Manage and connect with your customers</p>
                <button className="bg-[#E61E2B] text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition">
                  View Customers
                </button>
              </motion.div>
            )}

            {activeTab === 'marketing' && (
              <motion.div variants={item} className="text-center py-12">
                <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Marketing Tools</h3>
                <p className="text-gray-600 mb-6">Email campaigns, promotions, and customer engagement</p>
                <button onClick={() => navigate('/email-campaigns')} className="bg-[#E61E2B] text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition">
                  Create Campaign
                </button>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div variants={item} className="text-center py-12">
                <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Store Settings</h3>
                <p className="text-gray-600 mb-6">Manage your store information, policies, and preferences</p>
                <button onClick={() => navigate('/settings')} className="bg-[#E61E2B] text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition">
                  Go to Settings
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Help Section */}
        <motion.div 
          className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6 flex items-start gap-4"
          variants={item}
          initial="hidden"
          animate="visible"
        >
          <HelpCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-blue-900 mb-2">Need Help?</h3>
            <p className="text-blue-800 text-sm mb-3">
              Check out our documentation, video tutorials, or contact our support team.
            </p>
            <div className="flex gap-2">
              <button className="text-blue-600 font-bold hover:underline text-sm">View Docs</button>
              <span className="text-blue-400">•</span>
              <button className="text-blue-600 font-bold hover:underline text-sm">Contact Support</button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
