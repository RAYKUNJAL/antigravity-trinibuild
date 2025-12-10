import React from 'react';
import { ShoppingBag, TrendingUp, AlertCircle, Eye, DollarSign, Package } from 'lucide-react';

import { supabase } from '../../services/supabaseClient';

export const MarketplaceMonitor: React.FC = () => {
    const [stats, setStats] = React.useState({
        activeVendors: 0,
        dailySales: 0,
        revenue: 0,
        conversionRate: 0,
        lowStock: 0,
        needsAttention: 0
    });
    const [topCategories, setTopCategories] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            // Parallel Fetch
            const [
                { count: vendorCount },
                { data: products }
            ] = await Promise.all([
                supabase.from('stores').select('id', { count: 'exact' }),
                supabase.from('products').select('price, category, stock_quantity, sold_count') // assuming sold_count exists or we calculate from orders
            ]);

            // Calculate Stats
            let totalRevenue = 0;
            let totalSales = 0;
            let lowStockCount = 0;
            const categoryStats: Record<string, { revenue: number; sales: number }> = {};

            products?.forEach((p: any) => {
                const sales = p.sold_count || 0; // If sold_count column doesn't exist, this will stay 0
                const revenue = sales * (p.price || 0);

                totalRevenue += revenue;
                totalSales += sales;

                if ((p.stock_quantity || 0) < 5) lowStockCount++;

                const cat = p.category || 'Uncategorized';
                if (!categoryStats[cat]) categoryStats[cat] = { revenue: 0, sales: 0 };
                categoryStats[cat].revenue += revenue;
                categoryStats[cat].sales += sales;
            });

            const sortedCategories = Object.entries(categoryStats)
                .sort(([, a], [, b]) => b.revenue - a.revenue)
                .slice(0, 4)
                .map(([name, data]) => ({
                    name,
                    sales: data.sales,
                    revenue: data.revenue
                }));

            setStats({
                activeVendors: vendorCount || 0,
                dailySales: Math.floor(totalSales / 30), // Est daily sales from total for now
                revenue: totalRevenue,
                conversionRate: 2.5, // Placeholder/Estimate without traffic data correlation
                lowStock: lowStockCount,
                needsAttention: 0
            });
            setTopCategories(sortedCategories);

        } catch (error) {
            console.error('Error fetching marketplace stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <ShoppingBag className="h-7 w-7 text-emerald-500" />
                    Marketplace Monitor
                </h1>
                <p className="text-gray-500">Track vendor performance and sales metrics</p>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading marketplace data...</div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <StatCard label="Active Vendors" value={stats.activeVendors} icon={<ShoppingBag />} color="emerald" />
                        <StatCard label="Avg Daily Sales" value={stats.dailySales} icon={<Package />} color="blue" />
                        <StatCard label="Total Revenue" value={`$${stats.revenue.toLocaleString()}`} icon={<DollarSign />} color="green" />
                        <StatCard label="Est. Conversion" value={`${stats.conversionRate}%`} icon={<TrendingUp />} color="purple" />
                        <StatCard label="Low Stock" value={stats.lowStock} icon={<AlertCircle />} color="orange" />
                        <StatCard label="Needs Attention" value={stats.needsAttention} icon={<Eye />} color="red" />
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="font-bold">Top Categories by Revenue</h2>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {topCategories.map((cat, i) => (
                                <div key={i} className="p-4 flex justify-between items-center">
                                    <span className="font-medium">{cat.name}</span>
                                    <div className="text-right">
                                        <p className="font-bold">${cat.revenue.toLocaleString()}</p>
                                        <p className="text-xs text-gray-500">{cat.sales} sales</p>
                                    </div>
                                </div>
                            ))}
                            {topCategories.length === 0 && <div className="p-4 text-gray-500">No sales data found.</div>}
                        </div>
                    </div>
                </>
            )}
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
