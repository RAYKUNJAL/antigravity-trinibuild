import React, { useState } from 'react';
import {
    Megaphone,
    Plus,
    Play,
    Pause,
    Trash2,
    Edit,
    Eye,
    MousePointer,
    DollarSign,
    Target,
    TrendingUp,
    BarChart3,
    Filter,
    Search
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

// ============================================
// TYPES
// ============================================

interface AdCampaign {
    id: string;
    name: string;
    client: string;
    status: 'active' | 'paused' | 'draft' | 'ended';
    type: 'CPC' | 'CPM' | 'CPA';
    budget: number;
    spent: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    placements: string[];
    startDate: string;
    endDate: string;
}

// ============================================
// COMPONENT
// ============================================

export const AdsEngine: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'campaigns' | 'create' | 'analytics'>('campaigns');
    const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'ended'>('all');

    const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        fetchCampaigns();
    }, [filter]);

    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('ad_campaigns')
                .select('*')
                .order('created_at', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching campaigns:', error);
                // Fallback to empty if table doesn't exist yet/error
                setCampaigns([]);
            } else {
                // Map DB snake_case to camelCase types if needed, or adjust interface
                // For now assuming DB columns match or we map manually
                const mappedData = data?.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    client: c.client || 'Unknown',
                    status: c.status,
                    type: c.type,
                    budget: c.budget || 0,
                    spent: c.spent || 0,
                    impressions: c.impressions || 0,
                    clicks: c.clicks || 0,
                    conversions: c.conversions || 0,
                    // Calculate CTR safely
                    ctr: c.impressions > 0 ? Number(((c.clicks / c.impressions) * 100).toFixed(2)) : 0,
                    placements: c.placements || [],
                    startDate: c.start_date,
                    endDate: c.end_date
                })) || [];
                setCampaigns(mappedData);
            }
        } catch (err) {
            console.error('Failed to load campaigns', err);
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        totalBudget: campaigns.reduce((sum, c) => sum + Number(c.budget), 0),
        totalSpent: campaigns.reduce((sum, c) => sum + Number(c.spent), 0),
        totalImpressions: campaigns.reduce((sum, c) => sum + Number(c.impressions), 0),
        totalClicks: campaigns.reduce((sum, c) => sum + Number(c.clicks), 0),
        avgCTR: campaigns.length > 0
            ? (campaigns.reduce((sum, c) => sum + Number(c.ctr), 0) / campaigns.length).toFixed(2)
            : "0.00",
        activeCampaigns: campaigns.filter(c => c.status === 'active').length
    };

    const filteredCampaigns = filter === 'all'
        ? campaigns
        : campaigns.filter(c => c.status === filter);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ads Engine</h1>
                    <p className="text-gray-500">Internal advertising platform for listings and promotions</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-trini-red text-white rounded-lg hover:bg-red-600">
                    <Plus className="h-5 w-5" />
                    New Campaign
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard label="Active Campaigns" value={stats.activeCampaigns} icon={<Play className="h-5 w-5" />} color="green" />
                <StatCard label="Total Budget" value={`$${stats.totalBudget.toLocaleString()}`} icon={<DollarSign className="h-5 w-5" />} color="blue" />
                <StatCard label="Total Spent" value={`$${stats.totalSpent.toLocaleString()}`} icon={<TrendingUp className="h-5 w-5" />} color="purple" />
                <StatCard label="Impressions" value={stats.totalImpressions.toLocaleString()} icon={<Eye className="h-5 w-5" />} color="cyan" />
                <StatCard label="Total Clicks" value={stats.totalClicks.toLocaleString()} icon={<MousePointer className="h-5 w-5" />} color="orange" />
                <StatCard label="Avg CTR" value={`${stats.avgCTR}%`} icon={<Target className="h-5 w-5" />} color="green" />
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
                {(['campaigns', 'create', 'analytics'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 px-1 border-b-2 transition-colors ${activeTab === tab
                            ? 'border-trini-red text-trini-red'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Campaigns Tab */}
            {activeTab === 'campaigns' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search campaigns..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                            />
                        </div>
                        <div className="flex gap-2">
                            {(['all', 'active', 'paused', 'ended'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1.5 rounded-lg text-sm ${filter === f
                                        ? 'bg-trini-red text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                        }`}
                                >
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Campaigns Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Budget</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Spent</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Impressions</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">CTR</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredCampaigns.map(campaign => (
                                    <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-4 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{campaign.name}</p>
                                                <p className="text-xs text-gray-500">{campaign.client}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <StatusBadge status={campaign.status} />
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{campaign.type}</td>
                                        <td className="px-4 py-4 text-sm text-right text-gray-900 dark:text-white">${campaign.budget.toLocaleString()}</td>
                                        <td className="px-4 py-4 text-sm text-right text-gray-600 dark:text-gray-300">${campaign.spent.toLocaleString()}</td>
                                        <td className="px-4 py-4 text-sm text-right text-gray-600 dark:text-gray-300">{campaign.impressions.toLocaleString()}</td>
                                        <td className="px-4 py-4 text-sm text-right text-gray-600 dark:text-gray-300">{campaign.ctr}%</td>
                                        <td className="px-4 py-4">
                                            <div className="flex justify-end gap-2">
                                                {campaign.status === 'active' ? (
                                                    <button className="p-1.5 text-yellow-500 hover:bg-yellow-500/10 rounded" title="Pause">
                                                        <Pause className="h-4 w-4" />
                                                    </button>
                                                ) : (
                                                    <button className="p-1.5 text-green-500 hover:bg-green-500/10 rounded" title="Resume">
                                                        <Play className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded" title="Edit">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button className="p-1.5 text-red-500 hover:bg-red-500/10 rounded" title="Delete">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Tab Placeholder */}
            {activeTab === 'create' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
                    <Megaphone className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Campaign Builder</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                        Create targeted ad campaigns with AI-powered optimization. Set budgets, placements, and targeting criteria.
                    </p>
                </div>
            )}

            {/* Analytics Tab Placeholder */}
            {activeTab === 'analytics' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
                    <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ad Analytics</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                        Deep dive into campaign performance with advanced metrics, audience insights, and ROI analysis.
                    </p>
                </div>
            )}
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
}> = ({ label, value, icon, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className={`text-${color}-500 mb-2`}>{icon}</div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
    </div>
);

const StatusBadge: React.FC<{ status: 'active' | 'paused' | 'draft' | 'ended' }> = ({ status }) => {
    const config = {
        active: 'bg-green-500/10 text-green-600 border-green-500/30',
        paused: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
        draft: 'bg-gray-500/10 text-gray-600 border-gray-500/30',
        ended: 'bg-red-500/10 text-red-600 border-red-500/30'
    };

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config[status]}`}>
            {status === 'active' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5" />}
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};

export default AdsEngine;
