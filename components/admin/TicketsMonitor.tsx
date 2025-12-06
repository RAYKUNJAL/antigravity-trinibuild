import React from 'react';
import { Ticket, TrendingUp, DollarSign, Calendar, Users, Star } from 'lucide-react';

export const TicketsMonitor: React.FC = () => {
    const stats = {
        liveEvents: 12,
        ticketsSold: 2345,
        revenue: 45670,
        upcoming: 28,
        avgPrice: 150,
        topRated: 8
    };

    const popularEvents = [
        { name: 'Carnival 2025 Launch', tickets: 456, revenue: 12300 },
        { name: 'Soca Monarch Finals', tickets: 342, revenue: 8900 },
        { name: 'Jazz Festival', tickets: 234, revenue: 6700 },
        { name: 'Comedy Night', tickets: 189, revenue: 4500 },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Ticket className="h-7 w-7 text-purple-500" />
                    Tickets & Events Monitor
                </h1>
                <p className="text-gray-500">Track event performance and ticket sales</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard label="Live Events" value={stats.liveEvents} icon={<Calendar />} color="purple" />
                <StatCard label="Tickets Sold" value={stats.ticketsSold.toLocaleString()} icon={<Ticket />} color="blue" />
                <StatCard label="Revenue" value={`$${stats.revenue.toLocaleString()}`} icon={<DollarSign />} color="green" />
                <StatCard label="Upcoming" value={stats.upcoming} icon={<TrendingUp />} color="orange" />
                <StatCard label="Avg Price" value={`$${stats.avgPrice}`} icon={<Star />} color="yellow" />
                <StatCard label="Top Rated" value={stats.topRated} icon={<Users />} color="pink" />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="font-bold">Popular Events</h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {popularEvents.map((event, i) => (
                        <div key={i} className="p-4 flex justify-between items-center">
                            <span className="font-medium">{event.name}</span>
                            <div className="text-right">
                                <p className="font-bold">${event.revenue.toLocaleString()}</p>
                                <p className="text-xs text-gray-500">{event.tickets} tickets</p>
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

export default TicketsMonitor;
