import React from 'react';
import { ShoppingBag, TrendingUp, AlertCircle, Eye, DollarSign, Package } from 'lucide-react';

export const MarketplaceMonitor: React.FC = () => {
    const stats = {
        activeVendors: 342,
        dailySales: 156,
        revenue: 12450,
        conversionRate: 3.2,
        lowStock: 23,
        needsAttention: 8
    };

    const topCategories = [
        { name: 'Electronics', sales: 45, revenue: 3200 },
        { name: 'Fashion', sales: 38, revenue: 2100 },
        { name: 'Food & Drinks', sales: 32, revenue: 1800 },
        { name: 'Home & Garden', sales: 21, revenue: 1500 },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <ShoppingBag className="h-7 w-7 text-emerald-500" />
                    Marketplace Monitor
                </h1>
                <p className="text-gray-500">Track vendor performance and sales metrics</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard label="Active Vendors" value={stats.activeVendors} icon={<ShoppingBag />} color="emerald" />
                <StatCard label="Daily Sales" value={stats.dailySales} icon={<Package />} color="blue" />
                <StatCard label="Revenue" value={`$${stats.revenue.toLocaleString()}`} icon={<DollarSign />} color="green" />
                <StatCard label="Conversion" value={`${stats.conversionRate}%`} icon={<TrendingUp />} color="purple" />
                <StatCard label="Low Stock" value={stats.lowStock} icon={<AlertCircle />} color="orange" />
                <StatCard label="Needs Attention" value={stats.needsAttention} icon={<Eye />} color="red" />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="font-bold">Top Categories</h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {topCategories.map((cat, i) => (
                        <div key={i} className="p-4 flex justify-between items-center">
                            <span className="font-medium">{cat.name}</span>
                            <div className="text-right">
                                <p className="font-bold">${cat.revenue}</p>
                                <p className="text-xs text-gray-500">{cat.sales} sales</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className={`text-${color}-500 mb-2 [&>svg]:h-5 [&>svg]:w-5`}>{icon}</div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
    </div>
);

export default MarketplaceMonitor;
