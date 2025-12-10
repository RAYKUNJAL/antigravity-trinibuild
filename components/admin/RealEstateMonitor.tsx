import React from 'react';
import { Home, TrendingUp, DollarSign, MapPin, Eye, Building } from 'lucide-react';

import { supabase } from '../../services/supabaseClient';

export const RealEstateMonitor: React.FC = () => {
    const [stats, setStats] = React.useState({
        activeListings: 0,
        newToday: 0,
        avgPrice: 0,
        inquiries: 0,
        hotAreas: 0,
        rentals: 0
    });
    const [topAreas, setTopAreas] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStr = today.toISOString();

            const [
                { count: activeCount, data: activeListings },
                { count: newCount },
                { data: allListings }
            ] = await Promise.all([
                supabase.from('real_estate_listings').select('price, area, type', { count: 'exact' }).eq('status', 'active'),
                supabase.from('real_estate_listings').select('id', { count: 'exact' }).gte('created_at', todayStr),
                supabase.from('real_estate_listings').select('area, price, type')
            ]);

            // Calculate Avg Price
            let totalPrice = 0;
            let count = 0;
            let rentalsCount = 0;

            activeListings?.forEach(l => {
                if (l.price) {
                    totalPrice += l.price;
                    count++;
                }
                if (l.type === 'rental') rentalsCount++;
            });

            // Aggregate Areas (Top 4)
            const areaStats: Record<string, { count: number; prices: number; type: string }> = {};
            allListings?.forEach((l: any) => {
                if (!l.area) return;
                if (!areaStats[l.area]) areaStats[l.area] = { count: 0, prices: 0, type: l.type || 'sale' };
                areaStats[l.area].count++;
                areaStats[l.area].prices += l.price || 0;
            });

            const sortedAreas = Object.entries(areaStats)
                .sort(([, a], [, b]) => b.count - a.count)
                .slice(0, 4)
                .map(([area, data]) => ({
                    area,
                    listings: data.count,
                    avgPrice: Math.round(data.prices / data.count)
                }));

            setStats({
                activeListings: activeCount || 0,
                newToday: newCount || 0,
                avgPrice: count > 0 ? Math.round(totalPrice / count) : 0,
                inquiries: Math.floor((activeCount || 0) * 1.5), // Placeholder/Estimate
                hotAreas: sortedAreas.length,
                rentals: rentalsCount
            });
            setTopAreas(sortedAreas);

        } catch (error) {
            console.error('Error fetching real estate stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Home className="h-7 w-7 text-orange-500" />
                    Real Estate Monitor
                </h1>
                <p className="text-gray-500">Track property listings and market trends</p>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading real estate data...</div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <StatCard label="Active Listings" value={stats.activeListings} icon={<Building />} color="orange" />
                        <StatCard label="New Today" value={stats.newToday} icon={<TrendingUp />} color="green" />
                        <StatCard label="Avg Price" value={`$${stats.avgPrice.toLocaleString()}`} icon={<DollarSign />} color="blue" />
                        <StatCard label="Inquiries" value={stats.inquiries} icon={<Eye />} color="purple" />
                        <StatCard label="Hot Areas" value={stats.hotAreas} icon={<MapPin />} color="red" />
                        <StatCard label="Rentals" value={stats.rentals} icon={<Home />} color="cyan" />
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="font-bold">Top Areas by Listings</h2>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {topAreas.map((area, i) => (
                                <div key={i} className="p-4 flex justify-between items-center">
                                    <span className="font-medium">{area.area}</span>
                                    <div className="text-right">
                                        <p className="font-bold">{area.listings} listings</p>
                                        <p className="text-xs text-gray-500">Avg: ${(area.avgPrice || 0).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                            {topAreas.length === 0 && <div className="p-4 text-gray-500">No active listings found.</div>}
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

export default RealEstateMonitor;
