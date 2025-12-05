import React, { useState, useEffect } from 'react';
import {
    Search,
    TrendingUp,
    TrendingDown,
    BarChart3,
    MapPin,
    AlertTriangle,
    Lightbulb,
    Target,
    Zap,
    RefreshCw,
    ChevronRight,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    Filter,
    Download,
    Sparkles,
    Globe,
    ArrowUp,
    ArrowDown,
    Minus
} from 'lucide-react';
import {
    getKeywordDashboardData,
    getKeywordGaps,
    getKeywordSuggestions,
    generateKeywordSuggestions,
    KeywordDashboardData,
    TopKeyword,
    KeywordGap,
    KeywordSuggestion,
    KeywordAlert,
    LocationHeatmap
} from '../services/keywordEngineService';

// ============================================
// TYPES
// ============================================

type TabType = 'overview' | 'keywords' | 'gaps' | 'locations' | 'suggestions' | 'alerts';

// ============================================
// MAIN COMPONENT
// ============================================

export const KeywordDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [data, setData] = useState<KeywordDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('7d');

    // Load data
    useEffect(() => {
        loadData();
    }, [dateRange]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const dashboardData = await getKeywordDashboardData();
            setData(dashboardData);
        } catch (err) {
            console.error('Error loading dashboard:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateSuggestions = async () => {
        setIsGenerating(true);
        try {
            await generateKeywordSuggestions();
            await loadData();
        } finally {
            setIsGenerating(false);
        }
    };

    const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
        { key: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
        { key: 'keywords', label: 'Top Keywords', icon: <Search className="h-4 w-4" /> },
        { key: 'gaps', label: 'Content Gaps', icon: <Target className="h-4 w-4" /> },
        { key: 'locations', label: 'Location Heatmap', icon: <MapPin className="h-4 w-4" /> },
        { key: 'suggestions', label: 'AI Suggestions', icon: <Lightbulb className="h-4 w-4" /> },
        { key: 'alerts', label: 'Alerts', icon: <AlertTriangle className="h-4 w-4" /> }
    ];

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 py-6 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <Search className="h-8 w-8" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Keyword Intelligence</h1>
                                <p className="text-white/80 text-sm">Island Keyword Traffic Engine</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Date Range */}
                            <div className="flex bg-white/10 rounded-lg p-1">
                                {(['7d', '30d', '90d'] as const).map(range => (
                                    <button
                                        key={range}
                                        onClick={() => setDateRange(range)}
                                        className={`px-3 py-1 rounded text-sm ${dateRange === range ? 'bg-white/20 font-medium' : 'hover:bg-white/10'
                                            }`}
                                    >
                                        {range}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={loadData}
                                className="p-2 bg-white/10 rounded-lg hover:bg-white/20"
                                aria-label="Refresh data"
                            >
                                <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            {data && (
                <div className="max-w-7xl mx-auto px-6 -mt-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <StatCard
                            label="Total Searches"
                            value={data.summary.totalSearches.toLocaleString()}
                            icon={<Search className="h-5 w-5" />}
                            color="blue"
                        />
                        <StatCard
                            label="Unique Keywords"
                            value={data.summary.uniqueKeywords.toLocaleString()}
                            icon={<Globe className="h-5 w-5" />}
                            color="purple"
                        />
                        <StatCard
                            label="Avg CTR"
                            value={`${data.summary.avgCTR.toFixed(1)}%`}
                            icon={<Target className="h-5 w-5" />}
                            color="green"
                        />
                        <StatCard
                            label="Conversion Rate"
                            value={`${data.summary.avgConversionRate.toFixed(1)}%`}
                            icon={<Zap className="h-5 w-5" />}
                            color="yellow"
                        />
                        <StatCard
                            label="Content Gaps"
                            value={data.keywordGaps.length.toString()}
                            icon={<AlertTriangle className="h-5 w-5" />}
                            color="red"
                        />
                        <StatCard
                            label="Top Location"
                            value={data.summary.topLocation}
                            icon={<MapPin className="h-5 w-5" />}
                            color="cyan"
                        />
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="max-w-7xl mx-auto px-6 mt-8">
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${activeTab === tab.key
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                            {tab.key === 'alerts' && data && data.alerts.length > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 bg-red-500 rounded-full text-xs">
                                    {data.alerts.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="bg-gray-800/50 rounded-2xl p-6 mt-4 min-h-[500px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
                        </div>
                    ) : (
                        <>
                            {/* OVERVIEW TAB */}
                            {activeTab === 'overview' && data && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Top Keywords */}
                                    <div className="bg-gray-900/50 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold flex items-center gap-2">
                                                <TrendingUp className="h-5 w-5 text-green-500" />
                                                Top Keywords
                                            </h3>
                                            <button
                                                onClick={() => setActiveTab('keywords')}
                                                className="text-sm text-indigo-400 hover:underline"
                                            >
                                                View all →
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {data.topKeywords.slice(0, 5).map((kw, i) => (
                                                <KeywordRow key={i} keyword={kw} rank={i + 1} />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Rising Keywords */}
                                    <div className="bg-gray-900/50 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold flex items-center gap-2">
                                                <Zap className="h-5 w-5 text-yellow-500" />
                                                Rising Keywords
                                            </h3>
                                        </div>
                                        <div className="space-y-2">
                                            {data.risingKeywords.slice(0, 5).map((kw, i) => (
                                                <KeywordRow key={i} keyword={kw} showTrend />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Content Gaps */}
                                    <div className="bg-gray-900/50 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold flex items-center gap-2">
                                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                                Critical Gaps
                                            </h3>
                                            <button
                                                onClick={() => setActiveTab('gaps')}
                                                className="text-sm text-indigo-400 hover:underline"
                                            >
                                                View all →
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {data.keywordGaps.slice(0, 5).map((gap, i) => (
                                                <GapRow key={i} gap={gap} />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Alerts */}
                                    <div className="bg-gray-900/50 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold flex items-center gap-2">
                                                <AlertTriangle className="h-5 w-5 text-orange-500" />
                                                Recent Alerts
                                            </h3>
                                        </div>
                                        <div className="space-y-2">
                                            {data.alerts.length === 0 ? (
                                                <p className="text-gray-500 text-center py-4">No new alerts</p>
                                            ) : (
                                                data.alerts.slice(0, 4).map((alert, i) => (
                                                    <AlertRow key={i} alert={alert} />
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* KEYWORDS TAB */}
                            {activeTab === 'keywords' && data && (
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-bold">All Keywords</h2>
                                        <div className="flex gap-2">
                                            <button className="px-4 py-2 bg-gray-700 rounded-lg text-sm flex items-center gap-2">
                                                <Filter className="h-4 w-4" /> Filter
                                            </button>
                                            <button className="px-4 py-2 bg-gray-700 rounded-lg text-sm flex items-center gap-2">
                                                <Download className="h-4 w-4" /> Export
                                            </button>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                                                    <th className="pb-3 pr-4">#</th>
                                                    <th className="pb-3 pr-4">Keyword</th>
                                                    <th className="pb-3 pr-4">Volume</th>
                                                    <th className="pb-3 pr-4">CTR</th>
                                                    <th className="pb-3 pr-4">Conversion</th>
                                                    <th className="pb-3 pr-4">Opportunity</th>
                                                    <th className="pb-3">Trend</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.topKeywords.map((kw, i) => (
                                                    <tr key={i} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                                                        <td className="py-3 pr-4 text-gray-500">{i + 1}</td>
                                                        <td className="py-3 pr-4 font-medium">{kw.keyword}</td>
                                                        <td className="py-3 pr-4">{kw.total_volume.toLocaleString()}</td>
                                                        <td className="py-3 pr-4">{(kw.avg_ctr * 100).toFixed(1)}%</td>
                                                        <td className="py-3 pr-4">{(kw.avg_conversion_rate * 100).toFixed(1)}%</td>
                                                        <td className="py-3 pr-4">
                                                            <OpportunityBadge score={kw.opportunity_score} />
                                                        </td>
                                                        <td className="py-3">
                                                            <TrendBadge trend={kw.trend} />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* GAPS TAB */}
                            {activeTab === 'gaps' && data && (
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-bold">Content Gaps</h2>
                                        <p className="text-gray-400 text-sm">
                                            Keywords with high search volume but low/no content
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        {data.keywordGaps.map((gap, i) => (
                                            <div
                                                key={i}
                                                className="bg-gray-900/50 rounded-xl p-4 flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <SeverityBadge severity={gap.gap_severity} />
                                                    <div>
                                                        <h4 className="font-medium">{gap.keyword_normalized}</h4>
                                                        <p className="text-sm text-gray-500">{gap.recommended_action}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold">{gap.search_volume_30d}</div>
                                                        <div className="text-xs text-gray-500">searches/30d</div>
                                                    </div>
                                                    <button className="px-4 py-2 bg-indigo-600 rounded-lg text-sm hover:bg-indigo-500">
                                                        Create Content
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* LOCATIONS TAB */}
                            {activeTab === 'locations' && data && (
                                <div>
                                    <h2 className="text-xl font-bold mb-4">Location Keyword Heatmap</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {data.locationHeatmaps.length === 0 ? (
                                            <p className="col-span-3 text-center text-gray-500 py-12">
                                                No location data available yet. Start tracking searches!
                                            </p>
                                        ) : (
                                            data.locationHeatmaps.map((loc, i) => (
                                                <LocationCard key={i} location={loc} />
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* SUGGESTIONS TAB */}
                            {activeTab === 'suggestions' && (
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-bold">AI Keyword Suggestions</h2>
                                        <button
                                            onClick={handleGenerateSuggestions}
                                            disabled={isGenerating}
                                            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-sm flex items-center gap-2 hover:shadow-lg disabled:opacity-50"
                                        >
                                            {isGenerating ? (
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Sparkles className="h-4 w-4" />
                                            )}
                                            Generate New Suggestions
                                        </button>
                                    </div>

                                    <p className="text-gray-400 text-sm mb-6">
                                        AI-generated keyword opportunities based on trends and gaps
                                    </p>

                                    <div className="space-y-3">
                                        {/* Placeholder suggestions */}
                                        {[
                                            { keyword: 'electrician in San Fernando', type: 'service_category', volume: 850, score: 85 },
                                            { keyword: 'cheap apartment Chaguanas', type: 'landing_page', volume: 720, score: 78 },
                                            { keyword: 'carnival 2025 tickets', type: 'blog_topic', volume: 1200, score: 92 },
                                            { keyword: 'taxi Port of Spain to airport', type: 'landing_page', volume: 560, score: 71 }
                                        ].map((sug, i) => (
                                            <div
                                                key={i}
                                                className="bg-gray-900/50 rounded-xl p-4 flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                                                        <Lightbulb className="h-5 w-5 text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium">{sug.keyword}</h4>
                                                        <p className="text-sm text-gray-500">
                                                            Type: {sug.type.replace(/_/g, ' ')} • Est. volume: {sug.volume}/mo
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <OpportunityBadge score={sug.score} />
                                                    <div className="flex gap-2">
                                                        <button className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30">
                                                            <CheckCircle className="h-5 w-5" />
                                                        </button>
                                                        <button className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">
                                                            <XCircle className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ALERTS TAB */}
                            {activeTab === 'alerts' && data && (
                                <div>
                                    <h2 className="text-xl font-bold mb-4">Keyword Alerts</h2>
                                    <div className="space-y-3">
                                        {data.alerts.length === 0 ? (
                                            <p className="text-center text-gray-500 py-12">No alerts at this time</p>
                                        ) : (
                                            data.alerts.map((alert, i) => (
                                                <AlertRow key={i} alert={alert} expanded />
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
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
    value: string;
    icon: React.ReactNode;
    color: string;
}> = ({ label, value, icon, color }) => (
    <div className="bg-gray-800/80 backdrop-blur rounded-xl p-4 border border-gray-700/50">
        <div className={`text-${color}-400 mb-2`}>{icon}</div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
    </div>
);

const KeywordRow: React.FC<{
    keyword: TopKeyword;
    rank?: number;
    showTrend?: boolean;
}> = ({ keyword, rank, showTrend }) => (
    <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
        <div className="flex items-center gap-3">
            {rank && (
                <span className="w-6 h-6 flex items-center justify-center bg-gray-700 rounded text-xs font-bold">
                    {rank}
                </span>
            )}
            <span className="font-medium">{keyword.keyword}</span>
        </div>
        <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{keyword.total_volume.toLocaleString()}</span>
            {showTrend && <TrendBadge trend={keyword.trend} />}
        </div>
    </div>
);

const GapRow: React.FC<{ gap: KeywordGap }> = ({ gap }) => (
    <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
        <div className="flex items-center gap-3">
            <SeverityBadge severity={gap.gap_severity} small />
            <span className="font-medium">{gap.keyword_normalized}</span>
        </div>
        <span className="text-sm text-gray-400">{gap.search_volume_30d} searches</span>
    </div>
);

const AlertRow: React.FC<{ alert: KeywordAlert; expanded?: boolean }> = ({ alert, expanded }) => (
    <div className={`p-3 rounded-lg ${alert.severity === 'critical' ? 'bg-red-500/10 border border-red-500/30' :
            alert.severity === 'warning' ? 'bg-yellow-500/10 border border-yellow-500/30' :
                'bg-gray-800/50'
        }`}>
        <div className="flex items-start gap-3">
            <AlertTriangle className={`h-5 w-5 mt-0.5 ${alert.severity === 'critical' ? 'text-red-400' :
                    alert.severity === 'warning' ? 'text-yellow-400' :
                        'text-gray-400'
                }`} />
            <div className="flex-1">
                <div className="font-medium">{alert.keyword}</div>
                <div className="text-sm text-gray-400">{alert.message}</div>
                {expanded && (
                    <div className="mt-2 flex gap-2">
                        <button className="px-3 py-1 bg-indigo-600 rounded text-sm">Take Action</button>
                        <button className="px-3 py-1 bg-gray-700 rounded text-sm">Dismiss</button>
                    </div>
                )}
            </div>
            <span className="text-xs text-gray-500">{new Date(alert.created_at).toLocaleDateString()}</span>
        </div>
    </div>
);

const LocationCard: React.FC<{ location: LocationHeatmap }> = ({ location }) => (
    <div className="bg-gray-900/50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-5 w-5 text-indigo-400" />
            <h3 className="font-bold">{location.location_name}</h3>
        </div>
        <div className="text-3xl font-bold mb-2">{location.total_searches.toLocaleString()}</div>
        <div className="text-sm text-gray-500 mb-3">total searches</div>

        <div className="space-y-1">
            <div className="text-xs text-gray-400 uppercase">Top Keywords</div>
            {location.top_keywords.slice(0, 3).map((kw, i) => (
                <div key={i} className="flex justify-between text-sm">
                    <span>{kw.keyword}</span>
                    <span className="text-gray-500">{kw.volume}</span>
                </div>
            ))}
        </div>
    </div>
);

const OpportunityBadge: React.FC<{ score: number }> = ({ score }) => {
    const color = score >= 80 ? 'green' : score >= 50 ? 'yellow' : 'gray';
    return (
        <span className={`px-2 py-1 rounded text-xs font-bold bg-${color}-500/20 text-${color}-400`}>
            {score}
        </span>
    );
};

const TrendBadge: React.FC<{ trend: 'rising' | 'falling' | 'stable' }> = ({ trend }) => {
    if (trend === 'rising') {
        return <ArrowUp className="h-4 w-4 text-green-500" />;
    }
    if (trend === 'falling') {
        return <ArrowDown className="h-4 w-4 text-red-500" />;
    }
    return <Minus className="h-4 w-4 text-gray-500" />;
};

const SeverityBadge: React.FC<{ severity: string; small?: boolean }> = ({ severity, small }) => {
    const colors: Record<string, string> = {
        critical: 'bg-red-500 text-white',
        high: 'bg-orange-500 text-white',
        medium: 'bg-yellow-500 text-black',
        low: 'bg-gray-500 text-white'
    };

    return (
        <span className={`${small ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs'} rounded font-bold ${colors[severity] || colors.medium}`}>
            {severity.toUpperCase()}
        </span>
    );
};

export default KeywordDashboard;
