import React from 'react';
import { Car, Users, MapPin, TrendingUp, AlertCircle, Clock, DollarSign } from 'lucide-react';

export const RideshareFleet: React.FC = () => {
    const stats = {
        activeDrivers: 87,
        onlineNow: 34,
        tripsToday: 234,
        completed: 198,
        cancelled: 12,
        avgRating: 4.7
    };

    const surgeZones = [
        { zone: 'Port of Spain', multiplier: 1.5, demand: 'High' },
        { zone: 'Piarco Airport', multiplier: 1.3, demand: 'Medium' },
        { zone: 'San Fernando', multiplier: 1.0, demand: 'Normal' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Car className="h-7 w-7 text-cyan-500" />
                    Rideshare Fleet
                </h1>
                <p className="text-gray-500">Manage drivers and monitor ride activity</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard label="Active Drivers" value={stats.activeDrivers} icon={<Users />} color="cyan" />
                <StatCard label="Online Now" value={stats.onlineNow} icon={<Car />} color="green" live />
                <StatCard label="Trips Today" value={stats.tripsToday} icon={<TrendingUp />} color="blue" />
                <StatCard label="Completed" value={stats.completed} icon={<Clock />} color="emerald" />
                <StatCard label="Cancelled" value={stats.cancelled} icon={<AlertCircle />} color="red" />
                <StatCard label="Avg Rating" value={stats.avgRating} icon={<DollarSign />} color="yellow" />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="font-bold flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-red-500" />
                        Surge Zones
                    </h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {surgeZones.map((zone, i) => (
                        <div key={i} className="p-4 flex justify-between items-center">
                            <span className="font-medium">{zone.zone}</span>
                            <div className="flex items-center gap-4">
                                <span className={`px-2 py-0.5 rounded text-xs ${zone.demand === 'High' ? 'bg-red-500/10 text-red-500' : zone.demand === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'}`}>
                                    {zone.demand}
                                </span>
                                <span className="font-bold text-cyan-500">{zone.multiplier}x</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color: string; live?: boolean }> = ({ label, value, icon, color, live }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-start">
            <div className={`text-${color}-500 mb-2 [&>svg]:h-5 [&>svg]:w-5`}>{icon}</div>
            {live && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
    </div>
);

export default RideshareFleet;
