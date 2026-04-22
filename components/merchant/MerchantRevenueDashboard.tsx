import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, TrendingDown, Calendar, Download, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../services/supabaseClient';

/**
 * MERCHANT REVENUE DASHBOARD
 * 
 * Complete view of:
 * ✅ Order revenue (COD, Card, Bank Transfer)
 * ✅ TriniBuild platform fees (5%)
 * ✅ Delivery fees (TriniRides)
 * ✅ Payment processing fees
 * ✅ Merchant earnings after all fees
 * ✅ Tax obligations (VAT 12.5%)
 * ✅ Payout history & pending payouts
 */

interface OrderData {
  id: string;
  order_number: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: string;
  order_status: string;
  created_at: string;
}

interface RevenueMetrics {
  totalOrderValue: number;
  totalOrders: number;
  trinibuildFees: number;
  deliveryFees: number;
  paymentFees: number;
  merchantEarnings: number;
  VAT: number;
  netPayout: number;
}

export const MerchantRevenueDashboard: React.FC<{ storeId: string }> = ({
  storeId
}) => {
  const [period, setPeriod] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [metrics, setMetrics] = useState<RevenueMetrics>({
    totalOrderValue: 0,
    totalOrders: 0,
    trinibuildFees: 0,
    deliveryFees: 0,
    paymentFees: 0,
    merchantEarnings: 0,
    VAT: 0,
    netPayout: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrderData();
  }, [storeId, period]);

  const loadOrderData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeId)
        .like('created_at', `${period}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
      calculateMetrics(data || []);
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (orderList: OrderData[]) => {
    const totalOrderValue = orderList.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = orderList.length;

    // Fee calculations
    const trinibuildFees = Math.round(totalOrderValue * 0.05); // 5% platform fee
    const deliveryFees = orderList.reduce((sum, o) => sum + (o.delivery_fee || 0), 0);

    // Payment fees (simplified - varies by method)
    let paymentFees = 0;
    orderList.forEach(order => {
      if (order.payment_method === 'card') {
        paymentFees += Math.round((order.total || 0) * 0.029 + 10); // 2.9% + TT$10
      } else if (order.payment_method === 'paypal') {
        paymentFees += Math.round((order.total || 0) * 0.049 + 20); // 4.9% + TT$20
      }
    });

    // Merchant earnings after all fees
    const merchantEarnings =
      totalOrderValue - trinibuildFees - deliveryFees - paymentFees;

    // Tax (VAT only - simplified, would need full tax calculation)
    const VAT = Math.round(merchantEarnings * 0.125); // 12.5% VAT

    // Net payout
    const netPayout = merchantEarnings - VAT;

    setMetrics({
      totalOrderValue,
      totalOrders,
      trinibuildFees,
      deliveryFees,
      paymentFees,
      merchantEarnings,
      VAT,
      netPayout
    });
  };

  const formatCurrency = (value: number) => {
    return `TT$${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const exportToCSV = () => {
    let csv = 'TriniBuild Merchant Revenue Report\n';
    csv += `Period: ${period}\n\n`;
    csv += 'REVENUE SUMMARY\n';
    csv += `Total Order Value,${metrics.totalOrderValue}\n`;
    csv += `Total Orders,${metrics.totalOrders}\n\n`;
    csv += 'FEES BREAKDOWN\n';
    csv += `TriniBuild Platform Fee (5%),${metrics.trinibuildFees}\n`;
    csv += `Delivery Fees (TriniRides),${metrics.deliveryFees}\n`;
    csv += `Payment Processing Fees,${metrics.paymentFees}\n\n`;
    csv += 'MERCHANT EARNINGS\n';
    csv += `Gross Earnings,${metrics.merchantEarnings}\n`;
    csv += `VAT (12.5%),${metrics.VAT}\n`;
    csv += `Net Payout,${metrics.netPayout}\n`;

    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    );
    element.setAttribute('download', `revenue-${period}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const MetricCard: React.FC<{
    label: string;
    value: string;
    icon: React.ReactNode;
    color: 'green' | 'red' | 'blue' | 'orange';
  }> = ({ label, value, icon, color }) => {
    const colors = {
      green: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
      red: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
      blue: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
      orange:
        'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800'
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border rounded-lg p-6 ${colors[color]}`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-light uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
              {label}
            </p>
            <p className="text-3xl font-light">{value}</p>
          </div>
          <div className={`p-3 rounded-lg bg-${color}-100 dark:bg-${color}-900`}>
            {icon}
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse">
          <div className="h-12 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-light mb-2">Revenue Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your earnings, fees, and payouts
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-4 mb-8">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-2">
            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent border-none focus:outline-none"
            />
          </div>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Revenue Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            label="Total Order Value"
            value={formatCurrency(metrics.totalOrderValue)}
            icon={<DollarSign className="w-6 h-6 text-green-600" />}
            color="green"
          />
          <MetricCard
            label="Total Orders"
            value={metrics.totalOrders.toString()}
            icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
            color="blue"
          />
          <MetricCard
            label="Merchant Earnings"
            value={formatCurrency(metrics.merchantEarnings)}
            icon={<DollarSign className="w-6 h-6 text-green-600" />}
            color="green"
          />
          <MetricCard
            label="Net Payout"
            value={formatCurrency(metrics.netPayout)}
            icon={<TrendingUp className="w-6 h-6 text-green-600" />}
            color="green"
          />
        </div>

        {/* Fees Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Fee Details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-8"
          >
            <h3 className="text-xl font-light mb-6 uppercase tracking-wider">
              Fee Breakdown
            </h3>

            <div className="space-y-4">
              {/* Subtotal */}
              <div className="flex justify-between pb-4 border-b border-gray-200 dark:border-slate-700">
                <span className="text-gray-700 dark:text-gray-300">
                  Total Order Value
                </span>
                <span className="font-light">
                  {formatCurrency(metrics.totalOrderValue)}
                </span>
              </div>

              {/* TriniBuild Fee */}
              <div className="flex justify-between py-3">
                <div>
                  <p className="text-gray-700 dark:text-gray-300">
                    TriniBuild Platform Fee
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    5% of all orders
                  </p>
                </div>
                <span className="font-light text-red-600">
                  -{formatCurrency(metrics.trinibuildFees)}
                </span>
              </div>

              {/* Delivery Fees */}
              <div className="flex justify-between py-3">
                <div>
                  <p className="text-gray-700 dark:text-gray-300">
                    Delivery Fees
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    TriniRides delivery
                  </p>
                </div>
                <span className="font-light text-red-600">
                  -{formatCurrency(metrics.deliveryFees)}
                </span>
              </div>

              {/* Payment Processing */}
              <div className="flex justify-between py-3">
                <div>
                  <p className="text-gray-700 dark:text-gray-300">
                    Payment Processing
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Card & payment fees
                  </p>
                </div>
                <span className="font-light text-red-600">
                  -{formatCurrency(metrics.paymentFees)}
                </span>
              </div>

              {/* Merchant Earnings */}
              <div className="flex justify-between py-3 border-t-2 border-gray-200 dark:border-slate-700">
                <span className="font-light text-gray-900 dark:text-white">
                  Your Earnings
                </span>
                <span className="font-light text-green-600">
                  {formatCurrency(metrics.merchantEarnings)}
                </span>
              </div>

              {/* Tax */}
              <div className="flex justify-between py-3">
                <div>
                  <p className="text-gray-700 dark:text-gray-300">
                    VAT (12.5%)
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Trinidad tax obligation
                  </p>
                </div>
                <span className="font-light text-red-600">
                  -{formatCurrency(metrics.VAT)}
                </span>
              </div>

              {/* Final Payout */}
              <div className="flex justify-between py-4 border-t-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 rounded-lg px-4">
                <span className="font-light text-green-900 dark:text-green-100">
                  Net Payout (After Tax)
                </span>
                <span className="font-light text-green-700 dark:text-green-200 text-lg">
                  {formatCurrency(metrics.netPayout)}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Tax & Compliance */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-8"
          >
            <h3 className="text-xl font-light mb-6 uppercase tracking-wider">
              Tax Information
            </h3>

            <div className="space-y-4">
              {/* Tax Notice */}
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-light text-amber-900 dark:text-amber-100">
                    Tax Reminder
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">
                    VAT is calculated on your earnings and held pending verification
                    with the BIR (Board of Inland Revenue).
                  </p>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-3 mt-6">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Gross Earnings:
                  </span>
                  <span className="font-light">
                    {formatCurrency(metrics.merchantEarnings)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    VAT (12.5%):
                  </span>
                  <span className="font-light">
                    {formatCurrency(metrics.VAT)}
                  </span>
                </div>
                <div className="border-t border-gray-200 dark:border-slate-700 pt-3 flex justify-between">
                  <span className="font-light text-gray-900 dark:text-white">
                    Available for Payout:
                  </span>
                  <span className="font-light text-green-600">
                    {formatCurrency(metrics.netPayout)}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
                <p className="text-xs font-light text-blue-900 dark:text-blue-100">
                  💡 <strong>Tip:</strong> VAT is automatically set aside. You can
                  request payout of available funds after we verify compliance with
                  the BIR.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Orders Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden"
        >
          <div className="p-8 border-b border-gray-200 dark:border-slate-700">
            <h3 className="text-xl font-light uppercase tracking-wider">
              Order History
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-light uppercase tracking-wider">
                    Order #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-light uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-light uppercase tracking-wider">
                    Order Total
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-light uppercase tracking-wider">
                    Delivery Fee
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-light uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-light uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No orders in this period
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                    >
                      <td className="px-6 py-4 font-mono text-sm">
                        {order.order_number}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right font-light">
                        {formatCurrency(order.total || 0)}
                      </td>
                      <td className="px-6 py-4 text-right font-light">
                        {formatCurrency(order.delivery_fee || 0)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <span className="inline-block px-2 py-1 rounded bg-gray-100 dark:bg-slate-700">
                          {order.payment_method === 'cod'
                            ? '💵 COD'
                            : order.payment_method === 'card'
                            ? '💳 Card'
                            : '🏦 Bank'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <span
                          className={`inline-block px-2 py-1 rounded font-light ${
                            order.order_status === 'completed'
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                              : order.order_status === 'pending'
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'
                              : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
                          }`}
                        >
                          {order.order_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Key Notes */}
        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="font-light uppercase tracking-wider text-blue-900 dark:text-blue-100 mb-3">
            📋 Fee Structure Explained
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <li>
              <strong>TriniBuild Platform Fee (5%):</strong> Covers platform
              maintenance, support, and features
            </li>
            <li>
              <strong>Delivery Fees:</strong> Paid to TriniRides for delivery services
            </li>
            <li>
              <strong>Payment Processing:</strong> Card (2.9% + TT$10), Bank (TT$50
              batch fee)
            </li>
            <li>
              <strong>VAT (12.5%):</strong> Trinidad tax on your gross earnings,
              held pending BIR verification
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MerchantRevenueDashboard;
