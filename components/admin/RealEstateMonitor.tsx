import React from 'react';
import { Home, TrendingUp, DollarSign, MapPin, Eye, Building } from 'lucide-react';

export const RealEstateMonitor: React.FC = () => {
    const stats = {
        activeListings: 189,
        newToday: 12,
        avgPrice: 4500,
        inquiries: 234,
        hotAreas: 5,
        rentals: 156
    };

    const topAreas = [
        { area: 'Port of Spain', listings: 45, avgPrice: 5200 },
        { area: 'San Fernando', listings: 32, avgPrice: 3800 },
        { area: 'Chaguanas', listings: 28, avgPrice: 3500 },
        { area: 'Arima', listings: 21, avgPrice: 3200 },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Home className="h-7 w-7 text-orange-500" />
                    Real Estate Monitor
                </h1>
                <p className="text-gray-500">Track property listings and market trends</p>
            </div>

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
                                <p className="text-xs text-gray-500">Avg: ${area.avgPrice}/mo</p>
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

export default RealEstateMonitor;
