import React, { useState, useEffect } from 'react';
import {
    Globe,
    TrendingUp,
    Users,
    MousePointer,
    Eye,
    Clock,
    RefreshCw,
    MapPin,
    ArrowUpRight,
    ArrowDownRight,
    Sparkles
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface TrafficSource {
    source: string;
    visits: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
}

interface HeatmapData {
    location: string;
    lat: number;
    lng: number;
    intensity: number;
    activity: string;
}

// ============================================
// COMPONENT
// ============================================

export const TrafficHub: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedLayer, setSelectedLayer] = useState<'search' | 'listings' | 'rideshare' | 'events'>('search');

    // Mock data
    const trafficSources: TrafficSource[] = [
        { source: 'Google Search', visits: 4521, percentage: 35.2, trend: 'up' },
        { source: 'Direct', visits: 2890, percentage: 22.5, trend: 'stable' },
        { source: 'WhatsApp', visits: 1876, percentage: 14.6, trend: 'up' },
        { source: 'Facebook', visits: 1432, percentage: 11.2, trend: 'down' },
        { source: 'Instagram', visits: 987, percentage: 7.7, trend: 'up' },
        { source: 'Affiliate Links', visits: 654, percentage: 5.1, trend: 'up' },
        { source: 'Email', visits: 478, percentage: 3.7, trend: 'stable' },
    ];

    const liveStats = {
        activeUsers: 342,
        sessionsToday: 8745,
        avgSessionDuration: '4m 32s',
        bounceRate: 32.4,
        pageViews: 28456,
        conversions: 156
    };

    const topPages = [
        { page: '/jobs', views: 3245, time: '3m 45s' },
        { page: '/real-estate', views: 2876, time: '5m 12s' },
        { page: '/tickets', views: 1987, time: '4m 08s' },
        { page: '/rides', views: 1654, time: '2m 34s' },
        { page: '/marketplace', views: 1432, time: '3m 21s' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Traffic Hub</h1>
                    <p className="text-gray-500">Real-time traffic monitoring and routing</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-600 rounded-full">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium">Live</span>
                    </div>
                    <button className="p-2 text-gray-500 hover:text-trini-red">
                        <RefreshCw className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Live Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard label="Active Users" value={liveStats.activeUsers} icon={<Users className="h-5 w-5" />} color="blue" live />
                <StatCard label="Sessions Today" value={liveStats.sessionsToday.toLocaleString()} icon={<Globe className="h-5 w-5" />} color="green" />
                <StatCard label="Avg Session" value={liveStats.avgSessionDuration} icon={<Clock className="h-5 w-5" />} color="purple" />
                <StatCard label="Bounce Rate" value={`${liveStats.bounceRate}%`} icon={<ArrowDownRight className="h-5 w-5" />} color="orange" />
                <StatCard label="Page Views" value={liveStats.pageViews.toLocaleString()} icon={<Eye className="h-5 w-5" />} color="cyan" />
                <StatCard label="Conversions" value={liveStats.conversions} icon={<TrendingUp className="h-5 w-5" />} color="green" />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Heatmap Placeholder */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-trini-red" />
                            Live Traffic Heatmap
                        </h2>
                        <div className="flex gap-2">
                            {(['search', 'listings', 'rideshare', 'events'] as const).map(layer => (
                                <button
                                    key={layer}
                                    onClick={() => setSelectedLayer(layer)}
                                    className={`px-3 py-1 rounded-lg text-sm ${selectedLayer === layer
                                            ? 'bg-trini-red text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                        }`}
                                >
                                    {layer.charAt(0).toUpperCase() + layer.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-80 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                        <div className="text-center text-gray-400">
                            <Globe className="h-16 w-16 mx-auto mb-4 opacity-30" />
                            <p>Interactive map integration</p>
                            <p className="text-sm">Trinidad & Tobago</p>
                        </div>
                    </div>
                </div>

                {/* Traffic Sources */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                            Traffic Sources
                        </h2>
                    </div>
                    <div className="p-4 space-y-3">
                        {trafficSources.map((source, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{source.source}</span>
                                        <span className="text-sm text-gray-500">{source.visits.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                        <div
                                            className="bg-trini-red h-1.5 rounded-full"
                                            style={{ width: `${source.percentage}%` }}
                                        />
                                    </div>
                                </div>
                                {source.trend === 'up' && <ArrowUpRight className="h-4 w-4 text-green-500" />}
                                {source.trend === 'down' && <ArrowDownRight className="h-4 w-4 text-red-500" />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Pages */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <MousePointer className="h-5 w-5 text-purple-500" />
                        Top Pages Today
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Page</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Views</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {topPages.map((page, i) => (
                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{page.page}</td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-300">{page.views.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-300">{page.time}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* AI Traffic Routing */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-500/20 rounded-xl">
                        <Sparkles className="h-6 w-6 text-purple-500" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-white">AI Traffic Routing</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            AI is actively optimizing traffic distribution across the platform. Currently boosting new vendors and promoting location-specific content.
                        </p>
                        <div className="flex gap-2 mt-3">
                            <span className="px-2 py-1 bg-green-500/20 text-green-600 rounded text-xs">Boost New Vendors: ON</span>
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-600 rounded text-xs">Location Content: ON</span>
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-600 rounded text-xs">Smart Load Balancing: ON</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================
// SUB-COMPONENTS
// ============================================

const StatCard: React.FC<{
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    live?: boolean;
}> = ({ label, value, icon, color, live }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
            <span className={`text-${color}-500`}>{icon}</span>
            {live && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
    </div>
);

export default TrafficHub;
