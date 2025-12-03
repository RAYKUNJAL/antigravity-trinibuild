import React, { useState, useEffect } from 'react';
import {
    DollarSign, TrendingUp, TrendingDown, Users, Target, Zap,
    AlertCircle, RefreshCw, Download, Calendar, ArrowUp, ArrowDown,
    Activity, Flame, BarChart3
} from 'lucide-react';
import { revenueMetricsService, SaaSMetrics } from '../services/revenueMetricsService';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const RevenueTracker: React.FC = () => {
    const [metrics, setMetrics] = useState<SaaSMetrics | null>(null);
    const [historicalData, setHistoricalData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    useEffect(() => {
        loadMetrics();
        // Auto-refresh every 5 minutes
        const interval = setInterval(loadMetrics, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const loadMetrics = async () => {
        setLoading(true);
        try {
            const [metricsData, historical] = await Promise.all([
                revenueMetricsService.getAllMetrics(),
                revenueMetricsService.getHistoricalMetrics(12)
            ]);

            setMetrics(metricsData);
            setHistoricalData(historical);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error loading revenue metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatPercent = (value: number) => {
        return `${value.toFixed(1)}%`;
    };

    const getHealthStatus = (metric: string, value: number) => {
        switch (metric) {
            case 'nrr':
                return value >= 100 ? 'excellent' : value >= 90 ? 'good' : 'warning';
            case 'ltvCacRatio':
                return value >= 3 ? 'excellent' : value >= 2 ? 'good' : 'warning';
            case 'churnRate':
                return value <= 5 ? 'excellent' : value <= 10 ? 'good' : 'warning';
            case 'stickiness':
                return value >= 20 ? 'excellent' : value >= 10 ? 'good' : 'warning';
            case 'burnMultiple':
                return value <= 1.5 ? 'excellent' : value <= 3 ? 'good' : 'warning';
            default:
                return 'good';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'excellent':
                return 'text-green-600 bg-green-100 border-green-200';
            case 'good':
                return 'text-blue-600 bg-blue-100 border-blue-200';
            case 'warning':
                return 'text-red-600 bg-red-100 border-red-200';
            default:
                return 'text-gray-600 bg-gray-100 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'excellent':
                return <TrendingUp className="h-4 w-4" />;
            case 'good':
                return <Activity className="h-4 w-4" />;
            case 'warning':
                return <AlertCircle className="h-4 w-4" />;
            default:
                return <Activity className="h-4 w-4" />;
        }
    };

    if (loading || !metrics) {
        return (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <RefreshCw className="h-12 w-12 animate-spin text-trini-red" />
                <p className="text-gray-500 font-medium">Loading real-time metrics...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Revenue Metrics Dashboard</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Real-time SaaS metrics • Last updated: {lastUpdated.toLocaleTimeString()}
                    </p>
                </div>
                <button
                    onClick={loadMetrics}
                    className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors"
                    disabled={loading}
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Data
                </button>
            </div>

            {/* Primary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* MRR/ARR */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl shadow-lg border-2 border-green-200">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm font-bold text-green-700 uppercase tracking-wide">Monthly Recurring Revenue</p>
                            <h3 className="text-4xl font-bold text-gray-900 mt-2">{formatCurrency(metrics.mrr)}</h3>
                            <p className="text-sm text-gray-600 mt-2">ARR: {formatCurrency(metrics.arr)}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-green-200">
                            <DollarSign className="h-8 w-8 text-green-700" />
                        </div>
                    </div>
                    <div className="pt-3 border-t border-green-200">
                        <p className="text-xs text-green-700 font-medium">
                            From {metrics.activeUsers} active customers
                        </p>
                    </div>
                </div>

                {/* NRR */}
                <div className={`p-6 rounded-xl shadow-lg border-2 ${getStatusColor(getHealthStatus('nrr', metrics.nrr))}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-wide">Net Revenue Retention</p>
                            <h3 className="text-4xl font-bold text-gray-900 mt-2">{formatPercent(metrics.nrr)}</h3>
                            <p className="text-xs text-gray-600 mt-2">Target: ≥100% (world-class)</p>
                        </div>
                        <div className={`p-3 rounded-lg ${getStatusColor(getHealthStatus('nrr', metrics.nrr))}`}>
                            {getStatusIcon(getHealthStatus('nrr', metrics.nrr))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pt-3 border-t">
                        <div className={`flex items-center gap-1 text-sm font-bold`}>
                            {metrics.nrr >= 100 ? (
                                <>
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                    <span className="text-green-600">Excellent</span>
                                </>
                            ) : metrics.nrr >= 90 ? (
                                <>
                                    <Activity className="h-4 w-4 text-blue-600" />
                                    <span className="text-blue-600">Good</span>
                                </>
                            ) : (
                                <>
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                    <span className="text-red-600">Needs Improvement</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* LTV:CAC Ratio */}
                <div className={`p-6 rounded-xl shadow-lg border-2 ${getStatusColor(getHealthStatus('ltvCacRatio', metrics.ltvCacRatio))}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-wide">LTV:CAC Ratio</p>
                            <h3 className="text-4xl font-bold text-gray-900 mt-2">{metrics.ltvCacRatio.toFixed(1)}:1</h3>
                            <p className="text-xs text-gray-600 mt-2">Target: ≥3:1 (sustainable)</p>
                        </div>
                        <div className={`p-3 rounded-lg`}>
                            <Target className="h-8 w-8" />
                        </div>
                    </div>
                    <div className="pt-3 border-t">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <p className="text-gray-500">LTV</p>
                                <p className="font-bold text-gray-900">{formatCurrency(metrics.ltv)}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">CAC</p>
                                <p className="font-bold text-gray-900">{formatCurrency(metrics.cac)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Stickiness */}
                <div className={`p-4 rounded-xl border-2 ${getStatusColor(getHealthStatus('stickiness', metrics.stickiness))}`}>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold uppercase">Stickiness</p>
                        <Zap className="h-5 w-5" />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900">{formatPercent(metrics.stickiness)}</h4>
                    <p className="text-xs text-gray-600 mt-1">DAU/MAU Ratio</p>
                </div>

                {/* Churn Rate */}
                <div className={`p-4 rounded-xl border-2 ${getStatusColor(getHealthStatus('churnRate', metrics.churnRate))}`}>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold uppercase">Churn Rate</p>
                        <TrendingDown className="h-5 w-5" />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900">{formatPercent(metrics.churnRate)}</h4>
                    <p className="text-xs text-gray-600 mt-1">Monthly · Target: &lt;5%</p>
                </div>

                {/* Burn Multiple */}
                <div className={`p-4 rounded-xl border-2 ${getStatusColor(getHealthStatus('burnMultiple', metrics.burnMultiple))}`}>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold uppercase">Burn Multiple</p>
                        <Flame className="h-5 w-5" />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900">{metrics.burnMultiple.toFixed(2)}x</h4>
                    <p className="text-xs text-gray-600 mt-1">Capital Efficiency</p>
                </div>

                {/* New Users */}
                <div className="p-4 rounded-xl border-2 border-purple-200 bg-purple-50">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold uppercase text-purple-700">New Users</p>
                        <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900">{metrics.newUsers}</h4>
                    <p className="text-xs text-gray-600 mt-1">Last 30 days</p>
                </div>
            </div>

            {/* MRR Trend Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-bold text-xl">MRR Growth Trend</h3>
                        <p className="text-sm text-gray-500">12-Month Historical View</p>
                    </div>
                    <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                        <Download className="h-4 w-4" />
                        Export
                    </button>
                </div>

                <div className="h-80">
                    {historicalData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={historicalData}>
                                <defs>
                                    <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="month"
                                    stroke="#9CA3AF"
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis
                                    stroke="#9CA3AF"
                                    style={{ fontSize: '12px' }}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                    formatter={(value: number) => [formatCurrency(value), 'MRR']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="mrr"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    fill="url(#colorMrr)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            <p>No historical data available yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Key Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-trini-red" />
                        Metric Analysis
                    </h3>
                    <div className="space-y-3">
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-bold text-gray-900">Unit Economics Health</p>
                            <p className="text-xs text-gray-600 mt-1">
                                {metrics.ltvCacRatio >= 3
                                    ? '✅ Strong unit economics. LTV:CAC ratio indicates sustainable growth.'
                                    : metrics.ltvCacRatio >= 2
                                        ? '⚠️ Acceptable unit economics, but room for improvement in customer lifetime value.'
                                        : '❌ Unit economics need attention. Focus on reducing CAC or increasing LTV.'
                                }
                            </p>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-bold text-gray-900">Growth Efficiency</p>
                            <p className="text-xs text-gray-600 mt-1">
                                {metrics.burnMultiple <= 1.5
                                    ? '✅ Excellent capital efficiency. Growing sustainably.'
                                    : metrics.burnMultiple <= 3
                                        ? '⚠️ Moderate burn rate. Monitor cash runway carefully.'
                                        : '❌ High burn rate. Consider optimizing acquisition costs.'
                                }
                            </p>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-bold text-gray-900">Retention Quality</p>
                            <p className="text-xs text-gray-600 mt-1">
                                {metrics.churnRate <= 5
                                    ? '✅ Low churn rate indicates strong product-market fit.'
                                    : metrics.churnRate <= 10
                                        ? '⚠️ Moderate churn. Focus on customer success initiatives.'
                                        : '❌ High churn. Immediate action needed on retention.'
                                }
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-trini-red" />
                        Key Performance Indicators
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-700">New Customer Acquisition</span>
                                <span className="text-sm font-bold text-gray-900">{metrics.newUsers} users</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, (metrics.newUsers / 50) * 100)}%` }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-700">Total Revenue Collected</span>
                                <span className="text-sm font-bold text-gray-900">{formatCurrency(metrics.totalRevenue)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-green-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, (metrics.totalRevenue / 10000) * 100)}%` }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-700">Engagement (Stickiness)</span>
                                <span className="text-sm font-bold text-gray-900">{formatPercent(metrics.stickiness)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, metrics.stickiness * 5)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Source Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-blue-900 text-sm">Real-Time Data Source</p>
                        <p className="text-blue-700 text-xs mt-1">
                            All metrics calculated from live database queries. No placeholder data.
                            Revenue from active subscriptions, user activity tracked from orders and logins,
                            churn calculated from subscription cancellations. Updated every 5 minutes automatically.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
