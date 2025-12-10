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
import { analyticsService } from '../../services/analyticsService';
import { supabase } from '../../services/supabaseClient';
import { settingsService } from '../../services/settingsService';
import LeafletMap from './LeafletMap';

// ============================================
// TYPES
// ============================================

interface TrafficSource {
    source: string;
    visits: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
}

interface HeatmapPoint {
    lat: number;
    lng: number;
    intensity: number;
    type: 'listing' | 'ride' | 'event' | 'search';
    title: string;
}

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

// ============================================
// COMPONENT
// ============================================

export const TrafficHub: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedLayer, setSelectedLayer] = useState<'search' | 'listings' | 'rideshare' | 'events'>('search');

    const [trafficSources, setTrafficSources] = useState<TrafficSource[]>([]);
    const [topPages, setTopPages] = useState<any[]>([]);
    const [liveStats, setLiveStats] = useState<any>({
        activeUsers: 0,
        sessionsToday: 0,
        avgSessionDuration: '0m 0s',
        bounceRate: 0,
        pageViews: 0,
        conversions: 0
    });

    const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
    const [activeCampaignsCount, setActiveCampaignsCount] = useState(0);

    // AI Settings State
    const [aiSettings, setAiSettings] = useState({
        boostNewVendors: true,
        locationContent: true,
        smartLoadBalancing: true
    });

    useEffect(() => {
        loadAnalytics();
        loadMapData();
        loadSettings();

        // Refresh every minute
        const interval = setInterval(() => {
            loadAnalytics();
            loadMapData();
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const loadSettings = async () => {
        try {
            const [boost, location, balancing] = await Promise.all([
                settingsService.getSetting('ai_boost_vendors'),
                settingsService.getSetting('ai_location_content'),
                settingsService.getSetting('ai_load_balancing')
            ]);

            setAiSettings({
                boostNewVendors: boost !== null ? boost : true,
                locationContent: location !== null ? location : true,
                smartLoadBalancing: balancing !== null ? balancing : true
            });
        } catch (e) {
            console.error("Failed to load AI settings", e);
        }
    };

    const toggleSetting = async (key: string, currentVal: boolean, stateKey: keyof typeof aiSettings) => {
        try {
            const newVal = !currentVal;
            // Optimistic update
            setAiSettings(prev => ({ ...prev, [stateKey]: newVal }));
            await settingsService.setSetting(key, newVal, 'boolean');
        } catch (e) {
            console.error("Failed to toggle setting", e);
            // Revert on error
            setAiSettings(prev => ({ ...prev, [stateKey]: currentVal }));
        }
    };

    const loadAnalytics = async () => {
        setIsLoading(true);
        try {
            const [views, sources, pages, campaigns] = await Promise.all([
                analyticsService.getPageViews('today'),
                analyticsService.getTrafficSources(),
                analyticsService.getTopPages(),
                supabase.from('ad_campaigns').select('id', { count: 'exact' }).eq('status', 'active')
            ]);

            setLiveStats({
                activeUsers: Math.ceil(views * 0.15) || 1, // Weighted estimate
                sessionsToday: Math.ceil(views * 0.6), // Estimate approx 1.6 pv/session
                avgSessionDuration: '2m 15s', // Placeholder until enough session data
                bounceRate: 42.5, // Placeholder
                pageViews: views,
                conversions: Math.floor(views * 0.03) // 3% conversion estimate
            });

            setTrafficSources(sources as TrafficSource[]);
            setTopPages(pages);
            setActiveCampaignsCount(campaigns.count || 0);

        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMapData = async () => {
        try {
            const points: HeatmapPoint[] = [];

            // 1. Listings
            const { data: listings } = await supabase
                .from('real_estate_listings')
                .select('title, latitude, longitude')
                .eq('status', 'active')
                .not('latitude', 'is', null);

            listings?.forEach((l: any) => {
                if (l.latitude && l.longitude) {
                    points.push({
                        lat: l.latitude,
                        lng: l.longitude,
                        intensity: 0.8,
                        type: 'listing',
                        title: l.title
                    });
                }
            });

            // 2. Rides (Active or Recent)
            const { data: rides } = await supabase
                .from('rides')
                .select('pickup_location, pickup_lat, pickup_lng')
                .order('created_at', { ascending: false })
                .limit(20);

            rides?.forEach((r: any) => {
                if (r.pickup_lat && r.pickup_lng) {
                    points.push({
                        lat: r.pickup_lat,
                        lng: r.pickup_lng,
                        intensity: 0.5,
                        type: 'ride',
                        title: `Ride from ${r.pickup_location}`
                    });
                }
            });

            setHeatmapPoints(points);
        } catch (e) {
            console.error('Error loading map data:', e);
        }
    };

    const displayedPoints = heatmapPoints.filter(p => selectedLayer === 'search' || p.type === (selectedLayer === 'listings' ? 'listing' : selectedLayer === 'rideshare' ? 'ride' : 'event'));

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
                    <button onClick={() => { loadAnalytics(); loadMapData(); loadSettings(); }} className="p-2 text-gray-500 hover:text-trini-red" title="Refresh Data">
                        <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
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
                {/* Real Live Heatmap */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[500px]">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
                        <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-trini-red" />
                            Live Activity Map
                        </h2>
                        <div className="flex gap-2">
                            {(['search', 'listings', 'rideshare'] as const).map(layer => (
                                <button
                                    key={layer}
                                    onClick={() => setSelectedLayer(layer)}
                                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${selectedLayer === layer
                                        ? 'bg-trini-red text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                        }`}
                                >
                                    {layer === 'search' ? 'All' : layer.charAt(0).toUpperCase() + layer.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 relative z-0">
                        <LeafletMap points={displayedPoints} />
                    </div>
                </div>

                {/* Traffic Sources & Routing */}
                <div className="space-y-6">
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
                                    <span className="text-xs text-gray-400">{source.percentage}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Traffic Routing - Dynamic and Interactive */}
                    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-purple-500/20 rounded-xl">
                                <Sparkles className="h-6 w-6 text-purple-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 dark:text-white">AI Traffic Routing</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                    Actively distributing traffic across {activeCampaignsCount} active campaigns.
                                    Optimizing for maximum conversion efficiency.
                                </p>
                                <div className="flex flex-col gap-2 mt-4">
                                    <button
                                        onClick={() => toggleSetting('ai_boost_vendors', aiSettings.boostNewVendors, 'boostNewVendors')}
                                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${aiSettings.boostNewVendors ? 'bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-gray-100 text-gray-400'
                                            }`}
                                    >
                                        <span>Boost New Vendors</span>
                                        <span>{aiSettings.boostNewVendors ? 'ON' : 'OFF'}</span>
                                    </button>

                                    <button
                                        onClick={() => toggleSetting('ai_location_content', aiSettings.locationContent, 'locationContent')}
                                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${aiSettings.locationContent ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400' : 'bg-gray-100 text-gray-400'
                                            }`}
                                    >
                                        <span>Location Content</span>
                                        <span>{aiSettings.locationContent ? 'ON' : 'OFF'}</span>
                                    </button>

                                    <button
                                        onClick={() => toggleSetting('ai_load_balancing', aiSettings.smartLoadBalancing, 'smartLoadBalancing')}
                                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${aiSettings.smartLoadBalancing ? 'bg-purple-500/20 text-purple-700 dark:text-purple-400' : 'bg-gray-100 text-gray-400'
                                            }`}
                                    >
                                        <span>Smart Load Balancing</span>
                                        <span>{aiSettings.smartLoadBalancing ? 'ON' : 'OFF'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
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
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Est. Time</th>
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
        </div>
    );
};

export default TrafficHub;
