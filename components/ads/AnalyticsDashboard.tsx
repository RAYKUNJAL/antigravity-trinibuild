import React, { useEffect, useState } from 'react';
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
    TrendingUp, TrendingDown, Eye, Video, MousePointerClick, DollarSign,
    Calendar, Download, Filter, Sparkles
} from 'lucide-react';
import { analyticsService, type CampaignAnalytics } from '../../services/adsManagerService';

interface AnalyticsDashboardProps {
    campaignId?: string;
    advertiserId: string;
}

const COLORS = ['#00B894', '#6C5CE7', '#FDCB6E', '#FF7675', '#74B9FF'];

export function AnalyticsDashboard({ campaignId, advertiserId }: AnalyticsDashboardProps) {
    const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
    const [metrics, setMetrics] = useState<CampaignAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    // Sample time series data (would come from API)
    const impressionsData = [
        { date: 'Dec 1', impressions: 12500, views: 4300, clicks: 215 },
        { date: 'Dec 2', impressions: 15200, views: 5100, clicks: 280 },
        { date: 'Dec 3', impressions: 18900, views: 6500, clicks: 340 },
        { date: 'Dec 4', impressions: 14200, views: 4800, clicks: 225 },
        { date: 'Dec 5', impressions: 21500, views: 7200, clicks: 405 },
        { date: 'Dec 6', impressions: 19800, views: 6700, clicks: 360 },
        { date: 'Dec 7', impressions: 23400, views: 8100, clicks: 485 },
    ];

    const deviceData = [
        { name: 'Mobile', value: 68, color: '#00B894' },
        { name: 'Desktop', value: 24, color: '#6C5CE7' },
        { name: 'Tablet', value: 8, color: '#FDCB6E' },
    ];

    const locationData = [
        { location: 'Port of Spain', impressions: 45000, ctr: 3.2 },
        { location: 'San Fernando', impressions: 32000, ctr: 2.8 },
        { location: 'Chaguanas', impressions: 28000, ctr: 3.5 },
        { location: 'Arima', impressions: 18000, ctr: 2.9 },
        { location: 'Tobago', impressions: 12000, ctr: 4.1 },
    ];

    const funnelData = [
        { stage: 'Impressions', value: 247500, percentage: 100 },
        { stage: 'Views', value: 86200, percentage: 34.8 },
        { stage: 'Completions', value: 51700, percentage: 20.9 },
        { stage: 'Clicks', value: 9405, percentage: 3.8 },
        { stage: 'Conversions', value: 1245, percentage: 0.5 },
    ];

    useEffect(() => {
        loadMetrics();
    }, [campaignId, dateRange]);

    const loadMetrics = async () => {
        setLoading(true);
        try {
            if (campaignId) {
                const summary = await analyticsService.getCampaignSummary(campaignId);
                setMetrics(summary);
            }
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#101320] border border-[#1E2235] rounded-lg p-4 shadow-xl">
                    <p className="text-white font-semibold mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {formatNumber(entry.value)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Campaign Analytics</h2>
                    <p className="text-[#A9B0C3]">Performance insights and metrics</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Date Range Selector */}
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value as any)}
                        className="bg-[#0B0D14] text-white px-4 py-2 rounded-lg border border-[#1E2235] text-sm"
                    >
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                    </select>

                    <button className="bg-[#1E2235] hover:bg-[#2A2F47] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-[#101320] rounded-xl p-6 border border-[#1E2235]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-[#00B894]/10 p-3 rounded-lg">
                            <Eye className="h-6 w-6 text-[#00B894]" />
                        </div>
                        <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded-full font-semibold">
                            +12.5%
                        </span>
                    </div>
                    <p className="text-sm text-[#A9B0C3] mb-1">Total Impressions</p>
                    <h3 className="text-3xl font-bold text-white">247.5K</h3>
                </div>

                <div className="bg-[#101320] rounded-xl p-6 border border-[#1E2235]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-blue-500/10 p-3 rounded-lg">
                            <Video className="h-6 w-6 text-blue-500" />
                        </div>
                        <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded-full font-semibold">
                            +8.3%
                        </span>
                    </div>
                    <p className="text-sm text-[#A9B0C3] mb-1">Video Views</p>
                    <h3 className="text-3xl font-bold text-white">86.2K</h3>
                </div>

                <div className="bg-[#101320] rounded-xl p-6 border border-[#1E2235]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-purple-500/10 p-3 rounded-lg">
                            <MousePointerClick className="h-6 w-6 text-purple-500" />
                        </div>
                        <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded-full font-semibold">
                            +15.2%
                        </span>
                    </div>
                    <p className="text-sm text-[#A9B0C3] mb-1">Click-Through Rate</p>
                    <h3 className="text-3xl font-bold text-white">3.8%</h3>
                </div>

                <div className="bg-[#101320] rounded-xl p-6 border border-[#1E2235]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-[#FDCB6E]/10 p-3 rounded-lg">
                            <DollarSign className="h-6 w-6 text-[#FDCB6E]" />
                        </div>
                        <span className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded-full font-semibold">
                            -2.1%
                        </span>
                    </div>
                    <p className="text-sm text-[#A9B0C3] mb-1">Cost Per View</p>
                    <h3 className="text-3xl font-bold text-white">TTD 0.014</h3>
                </div>
            </div>

            {/* Impressions & Views Over Time */}
            <div className="bg-[#101320] rounded-xl p-6 border border-[#1E2235]">
                <h3 className="text-lg font-bold text-white mb-6">Performance Over Time</h3>
                <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={impressionsData}>
                        <defs>
                            <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00B894" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#00B894" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6C5CE7" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6C5CE7" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E2235" />
                        <XAxis dataKey="date" stroke="#A9B0C3" />
                        <YAxis stroke="#A9B0C3" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey="impressions"
                            stroke="#00B894"
                            fillOpacity={1}
                            fill="url(#colorImpressions)"
                            strokeWidth={2}
                        />
                        <Area
                            type="monotone"
                            dataKey="views"
                            stroke="#6C5CE7"
                            fillOpacity={1}
                            fill="url(#colorViews)"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Device Breakdown */}
                <div className="bg-[#101320] rounded-xl p-6 border border-[#1E2235]">
                    <h3 className="text-lg font-bold text-white mb-6">Device Breakdown</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={deviceData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => `${name} ${value}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {deviceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                        {deviceData.map((device, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: device.color }}
                                    />
                                    <span className="text-[#A9B0C3]">{device.name}</span>
                                </div>
                                <span className="text-white font-semibold">{device.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Conversion Funnel */}
                <div className="bg-[#101320] rounded-xl p-6 border border-[#1E2235]">
                    <h3 className="text-lg font-bold text-white mb-6">Conversion Funnel</h3>
                    <div className="space-y-3">
                        {funnelData.map((stage, index) => (
                            <div key={index}>
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-white font-semibold">{stage.stage}</span>
                                    <span className="text-[#A9B0C3]">
                                        {formatNumber(stage.value)} ({stage.percentage}%)
                                    </span>
                                </div>
                                <div className="bg-[#0B0D14] rounded-full h-3 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-[#00B894] to-[#6C5CE7]"
                                        style={{ width: `${stage.percentage * 10}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Location Performance */}
            <div className="bg-[#101320] rounded-xl p-6 border border-[#1E2235]">
                <h3 className="text-lg font-bold text-white mb-6">Top Locations</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={locationData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E2235" />
                        <XAxis dataKey="location" stroke="#A9B0C3" />
                        <YAxis stroke="#A9B0C3" />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="impressions" fill="#00B894" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* AI Insights */}
            <div className="bg-gradient-to-r from-[#00B894]/10 to-purple-500/10 rounded-xl p-6 border border-[#00B894]/20">
                <div className="flex items-start gap-4">
                    <div className="bg-[#00B894] p-3 rounded-xl">
                        <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2">AI Performance Insights</h3>
                        <ul className="space-y-2 text-sm text-[#A9B0C3]">
                            <li className="flex items-start gap-2">
                                <TrendingUp className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <span>
                                    <strong className="text-white">Best performing time:</strong> Weekdays 6-9 PM show 42% higher engagement
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <TrendingUp className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <span>
                                    <strong className="text-white">Top location:</strong> Chaguanas has highest CTR (3.5%) - consider increasing budget there
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <TrendingDown className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                                <span>
                                    <strong className="text-white">Opportunity:</strong> Mobile completion rate is 15% lower - optimize video for vertical viewing
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
