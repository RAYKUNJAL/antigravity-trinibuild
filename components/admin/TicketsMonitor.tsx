import React from 'react';
import { Ticket, TrendingUp, DollarSign, Calendar, Users, Star } from 'lucide-react';

import { supabase } from '../../services/supabaseClient';

export const TicketsMonitor: React.FC = () => {
    const [stats, setStats] = React.useState({
        liveEvents: 0,
        ticketsSold: 0,
        revenue: 0,
        upcoming: 0,
        avgPrice: 0,
        topRated: 0
    });
    const [popularEvents, setPopularEvents] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const now = new Date();
            const nowStr = now.toISOString();

            // Fetch Live/Upcoming Events
            const { count: liveCount } = await supabase.from('events').select('id', { count: 'exact' }).lte('event_date', nowStr); // Just an example, realistically need filtering by duration
            const { count: upcomingCount } = await supabase.from('events').select('id', { count: 'exact' }).gt('event_date', nowStr);

            // Fetch Tickets Stats
            const { data: allTickets } = await supabase.from('tickets').select('price, event_id');
            const { data: allEvents } = await supabase.from('events').select('id, title'); // Need event names for aggregation

            let totalTickets = 0;
            let totalRevenue = 0;
            const eventStats: Record<string, { revenue: number; tickets: number }> = {};

            allTickets?.forEach(t => {
                totalTickets++;
                totalRevenue += t.price;
                const eId = t.event_id;
                if (!eventStats[eId]) eventStats[eId] = { revenue: 0, tickets: 0 };
                eventStats[eId].revenue += t.price;
                eventStats[eId].tickets++;
            });

            // Map stats to names
            const eventMap = new Map((allEvents || []).map(e => [e.id, e.title]));
            const sortedEvents = Object.entries(eventStats)
                .sort(([, a], [, b]) => b.revenue - a.revenue)
                .slice(0, 4)
                .map(([id, data]) => ({
                    name: eventMap.get(id) || 'Unknown Event',
                    revenue: data.revenue,
                    tickets: data.tickets
                }));

            setStats({
                liveEvents: liveCount || 0,
                ticketsSold: totalTickets,
                revenue: totalRevenue,
                upcoming: upcomingCount || 0,
                avgPrice: totalTickets > 0 ? Math.round(totalRevenue / totalTickets) : 0,
                topRated: 0 // Placeholder until ratings
            });
            setPopularEvents(sortedEvents);

        } catch (error) {
            console.error('Error fetching ticket stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Ticket className="h-7 w-7 text-purple-500" />
                    Tickets & Events Monitor
                </h1>
                <p className="text-gray-500">Track event performance and ticket sales</p>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading tickets data...</div>
            ) : (
                <>
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
                            {popularEvents.length === 0 && <div className="p-4 text-gray-500">No ticket sales found.</div>}
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

export default TicketsMonitor;
