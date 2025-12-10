import React from 'react';
import { Car, Users, MapPin, TrendingUp, AlertCircle, Clock, DollarSign } from 'lucide-react';

import { supabase } from '../../services/supabaseClient';

export const RideshareFleet: React.FC = () => {
    const [stats, setStats] = React.useState({
        activeDrivers: 0,
        onlineNow: 0,
        tripsToday: 0,
        completed: 0,
        cancelled: 0,
        avgRating: 0
    });
    const [surgeZones, setSurgeZones] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        fetchFleetStats();
    }, []);

    const fetchFleetStats = async () => {
        setLoading(true);
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStr = today.toISOString();

            // Parallel fetch
            const [
                { count: driverCount },
                { count: onlineCount },
                { data: rides }
            ] = await Promise.all([
                supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'driver'),
                supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'driver').eq('status', 'active'), // Assuming status tracks online
                supabase.from('rides').select('status, rating, pickup_location, cost').gte('created_at', todayStr)
            ]);

            let completed = 0;
            let cancelled = 0;
            let totalRating = 0;
            let ratedRides = 0;
            const zoneStats: Record<string, number> = {};

            rides?.forEach((r: any) => {
                if (r.status === 'completed') completed++;
                if (r.status === 'cancelled') cancelled++;
                if (r.rating) {
                    totalRating += r.rating;
                    ratedRides++;
                }
                // Rough zone estimation from pickup string
                const zone = r.pickup_location ? r.pickup_location.split(',')[0].trim() : 'Unknown';
                zoneStats[zone] = (zoneStats[zone] || 0) + 1;
            });

            // Calculate Surge Zones (Simulated based on demand)
            const sortedZones = Object.entries(zoneStats)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([zone, count]) => {
                    let demand = 'Normal';
                    let multiplier = 1.0;
                    if (count > 50) { demand = 'High'; multiplier = 1.5; }
                    else if (count > 20) { demand = 'Medium'; multiplier = 1.2; }

                    return { zone, demand, multiplier };
                });

            setStats({
                activeDrivers: driverCount || 0,
                onlineNow: onlineCount || 0,
                tripsToday: rides?.length || 0,
                completed,
                cancelled,
                avgRating: ratedRides > 0 ? Number((totalRating / ratedRides).toFixed(1)) : 5.0
            });
            setSurgeZones(sortedZones);

        } catch (error) {
            console.error('Error fetching fleet stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Car className="h-7 w-7 text-cyan-500" />
                    RideshareFleet
                </h1>
                <p className="text-gray-500">Manage drivers and monitor ride activity</p>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading fleet metrics...</div>
            ) : (
                <>
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
                                Top Activity Zones
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
                            {surgeZones.length === 0 && <div className="p-4 text-gray-500">No ride activity detected in zones today.</div>}
                        </div>
                    </div>
                </>
            )}
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
