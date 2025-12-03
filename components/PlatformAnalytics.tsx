import React, { useState, useEffect } from 'react';
import {
    RefreshCw, DollarSign, TrendingUp, TrendingDown, Users, ShoppingBag,
    Calendar, Home, Briefcase, Car, Building, Ticket, ArrowUp, ArrowDown,
    Download, Filter
} from 'lucide-react';
import { platformAnalyticsService, PlatformStats, RevenueByVertical, TopPerformer } from '../services/platformAnalyticsService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

export const PlatformAnalytics: React.FC = () => {
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [revenueByVertical, setRevenueByVertical] = useState<RevenueByVertical[]>([]);
    const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
    const [revenueTrend, setRevenueTrend] = useState<{ date: string; revenue: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<30 | 60 | 90>(30);

    useEffect(() => {
        loadAnalytics();
    }, [timeRange]);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const [statsData, verticalsData, performersData, trendData] = await Promise.all([
                platformAnalyticsService.getPlatformStats(),
                platformAnalyticsService.getRevenueByVertical(),
                platformAnalyticsService.getTopPerformers(10),
                platformAnalyticsService.getRevenueTrend(timeRange)
            ]);

            setStats(statsData);
            setRevenueByVertical(verticalsData);
            setTopPerformers(performersData);
            setRevenueTrend(trendData);
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-TT', {
            style: 'currency',
            currency: 'TTD'
        }).format(amount);
    };

    const formatGrowth = (growth: number) => {
        const isPositive = growth >= 0;
        return (
            <span className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                {Math.abs(growth).toFixed(1)}%
            </span>
        );
    };

    if (loading || !stats) {
        return (
            <div className="flex items-center justify-center h-96">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Platform Analytics</h2>
                    <p className="text-gray-500 text-sm">Comprehensive overview of all platform metrics</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setTimeRange(30)}
                        className={`px-3 py-1 rounded text-sm font-bold ${timeRange === 30 ? 'bg-trini-red text-white' : 'bg-white border border-gray-300'}`}
                    >
                        30 Days
                    </button>
                    <button
                        onClick={() => setTimeRange(60)}
                        className={`px-3 py-1 rounded text-sm font-bold ${timeRange === 60 ? 'bg-trini-red text-white' : 'bg-white border border-gray-300'}`}
                    >
                        60 Days
                    </button>
                    <button
                        onClick={() => setTimeRange(90)}
                        className={`px-3 py-1 rounded text-sm font-bold ${timeRange === 90 ? 'bg-trini-red text-white' : 'bg-white border border-gray-300'}`}
                    >
                        90 Days
                    </button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalRevenue)}</h3>
                            <div className="mt-2">{formatGrowth(stats.revenueGrowth)}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-green-100">
                            <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Users</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.totalUsers.toLocaleString()}</h3>
                            <div className="mt-2">{formatGrowth(stats.userGrowth)}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-100">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Active Stores</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.activeStores}</h3>
                            <p className="text-xs text-gray-400 mt-2">Verified & Active</p>
                        </div>
                        <div className="p-3 rounded-lg bg-purple-100">
                            <ShoppingBag className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Orders</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.totalOrders.toLocaleString()}</h3>
                            <p className="text-xs text-gray-400 mt-2">All-time</p>
                        </div>
                        <div className="p-3 rounded-lg bg-orange-100">
                            <TrendingUp className="h-6 w-6 text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Revenue Trend Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-lg mb-4">Revenue Trend</h3>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis tickFormatter={(value) => `$${value}`} />
                            <Tooltip
                                formatter={(value: number) => formatCurrency(value)}
                                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="#ef4444" fill="#fee2e2" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Revenue by Vertical */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-lg mb-4">Revenue by Vertical</h3>
                    <div className="space-y-4">
                        {revenueByVertical.map((vertical, index) => (
                            <div key={vertical.vertical} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${index === 0 ? 'bg-blue-100' :
                                            index === 1 ? 'bg-purple-100' :
                                                index === 2 ? 'bg-green-100' :
                                                    index === 3 ? 'bg-orange-100' :
                                                        'bg-gray-100'
                                        }`}>
                                        {vertical.vertical === 'Marketplace' && <ShoppingBag className="h-5 w-5 text-blue-600" />}
                                        {vertical.vertical === 'Events & Tickets' && <Ticket className="h-5 w-5 text-purple-600" />}
                                        {vertical.vertical === 'Real Estate' && <Building className="h-5 w-5 text-green-600" />}
                                        {vertical.vertical === 'Jobs' && <Briefcase className="h-5 w-5 text-orange-600" />}
                                        {vertical.vertical === 'Rides' && <Car className="h-5 w-5 text-gray-600" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{vertical.vertical}</p>
                                        <p className="text-xs text-gray-500">{vertical.orders} transactions</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900">{formatCurrency(vertical.revenue)}</p>
                                    {vertical.growth !== 0 && (
                                        <div className="text-xs">{formatGrowth(vertical.growth)}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Performers */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-lg mb-4">Top Performers</h3>
                    <div className="space-y-3">
                        {topPerformers.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-30" />
                                <p>No data available yet</p>
                            </div>
                        ) : (
                            topPerformers.map((performer, index) => (
                                <div key={performer.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${index === 0 ? 'bg-yellow-500' :
                                                index === 1 ? 'bg-gray-400' :
                                                    index === 2 ? 'bg-orange-600' :
                                                        'bg-gray-300'
                                            }`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{performer.name}</p>
                                            <p className="text-xs text-gray-500">{performer.orders} orders</p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-gray-900">{formatCurrency(performer.revenue)}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Export Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg">Export Data</h3>
                        <p className="text-sm text-gray-500">Download comprehensive analytics reports</p>
                    </div>
                    <button className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800">
                        <Download className="h-4 w-4" />
                        Export to CSV
                    </button>
                </div>
            </div>
        </div>
    );
};
