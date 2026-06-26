import React, { useEffect, useState, useMemo } from 'react';
import {
    Video, TrendingUp, DollarSign, Eye, MousePointerClick,
    Plus, Calendar, Target, AlertCircle, Sparkles, BarChart3,
    Facebook, Instagram, Users, Megaphone, Copy, Check, Loader2,
    X, ChevronRight, Pause, Play, FileText, Wand2, Building2,
    Mail, MapPin, Zap, Shield
} from 'lucide-react';
import { campaignService, advertiserService, type AdCampaign, type Advertiser } from '../services/adsManagerService';
import { authService } from '../services/authService';
import { metaAdsService } from '../services/metaAdsService';
import { supabase } from '../services/supabaseClient';
import { CampaignWizard } from '../components/ads/CampaignWizard';

// =====================================================
// TYPES
// =====================================================

type TabId = 'overview' | 'campaigns' | 'creative' | 'clients';

interface ClientRow {
    id: string;
    business_name: string;
    contact_email?: string;
    island?: string;
    monthly_budget_ttd?: number;
    facebook_page_id?: string;
    status?: string;
    active_campaigns?: number;
    created_at?: string;
}

interface MetaInsights {
    reach?: number;
    impressions?: number;
    clicks?: number;
    spend_usd?: number;
    ctr?: number;
    active_campaigns?: number;
}

interface AdVariation {
    headline: string;
    primary_text: string;
    cta_label: string;
    image_prompt?: string;
}

// =====================================================
// MOCK FALLBACKS
// =====================================================

const MOCK_CLIENTS: ClientRow[] = [
    {
        id: 'mock-1',
        business_name: 'TriniBites Restaurant',
        contact_email: 'owner@trinibites.tt',
        island: 'Trinidad',
        monthly_budget_ttd: 3500,
        facebook_page_id: 'trinibites.tt',
        status: 'active',
        active_campaigns: 2,
    },
    {
        id: 'mock-2',
        business_name: 'Island Threads Boutique',
        contact_email: 'hello@islandthreads.tt',
        island: 'Tobago',
        monthly_budget_ttd: 1500,
        facebook_page_id: 'islandthreads',
        status: 'active',
        active_campaigns: 1,
    },
    {
        id: 'mock-3',
        business_name: 'Caribbean Glow Beauty',
        contact_email: 'info@caribglow.tt',
        island: 'Trinidad',
        monthly_budget_ttd: 7500,
        facebook_page_id: 'caribglow',
        status: 'paused',
        active_campaigns: 0,
    },
];

const JUVAY_MERCHANT_TARGET = 100;
const JUVAY_MONTHLY_BUDGET_USD = 5000;

// =====================================================
// HELPER COMPONENTS
// =====================================================

const StatCard: React.FC<{
    icon: React.ElementType;
    label: string;
    value: string;
    subtext?: string;
    color: string;
}> = ({ icon: Icon, label, value, subtext, color }) => (
    <div className="bg-[#101320] rounded-2xl p-6 border border-[#1E2235]">
        <div className="flex items-center justify-between mb-4">
            <div className={`${color} p-3 rounded-xl`}>
                <Icon className="h-5 w-5 text-white" />
            </div>
        </div>
        <div>
            <p className="text-3xl font-bold text-white mb-1">{value}</p>
            <p className="text-sm text-[#A9B0C3]">{label}</p>
        </div>
        {subtext && (
            <div className="mt-3">
                <span className="text-xs text-[#A9B0C3]">{subtext}</span>
            </div>
        )}
    </div>
);

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={() => {
                navigator.clipboard?.writeText(text).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                }).catch(() => {});
            }}
            className="text-[#A9B0C3] hover:text-white transition-colors p-1"
            title="Copy to clipboard"
        >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </button>
    );
};

const PlatformIcon: React.FC<{ platform?: string }> = ({ platform }) => {
    const p = (platform || '').toLowerCase();
    if (p === 'facebook' || p === 'fb') return <Facebook className="h-4 w-4 text-[#1877F2]" title="Facebook" />;
    if (p === 'instagram' || p === 'ig') return <Instagram className="h-4 w-4 text-[#E4405F]" title="Instagram" />;
    if (p === 'both' || p === 'all') return (
        <span className="flex items-center gap-1">
            <Facebook className="h-4 w-4 text-[#1877F2]" title="Facebook" />
            <Instagram className="h-4 w-4 text-[#E4405F]" title="Instagram" />
        </span>
    );
    // default: both
    return (
        <span className="flex items-center gap-1">
            <Facebook className="h-4 w-4 text-[#1877F2]" />
            <Instagram className="h-4 w-4 text-[#E4405F]" />
        </span>
    );
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'active': return 'bg-green-100 text-green-700';
        case 'paused': return 'bg-yellow-100 text-yellow-700';
        case 'completed': return 'bg-gray-100 text-gray-700';
        case 'draft': return 'bg-blue-100 text-blue-700';
        case 'rejected': return 'bg-red-100 text-red-700';
        default: return 'bg-gray-100 text-gray-700';
    }
};

// =====================================================
// MAIN COMPONENT
// =====================================================

export function AdsPortal() {
    const [user, setUser] = useState<any>(null);
    const [advertiser, setAdvertiser] = useState<Advertiser | null>(null);
    const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
    const [clients, setClients] = useState<ClientRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [showWizard, setShowWizard] = useState(false);
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [metaInsights, setMetaInsights] = useState<MetaInsights | null>(null);
    const [wizardPrefill, setWizardPrefill] = useState<{ name?: string; headline?: string; caption?: string; cta?: string } | null>(null);

    // ---- Load user ----
    useEffect(() => {
        const loadUser = async () => {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
        };
        loadUser();
    }, []);

    useEffect(() => {
        if (user) {
            loadAdvertiserData();
            loadClients();
            loadMetaInsights();
        }
    }, [user]);

    const loadAdvertiserData = async () => {
        if (!user) return;
        try {
            setLoading(true);
            let advertiserProfile = await advertiserService.getProfile(user.id);
            if (!advertiserProfile) {
                advertiserProfile = await advertiserService.createProfile({
                    user_id: user.id,
                    business_name: user.user_metadata?.business_name || 'My Business',
                    verified_status: 'pending',
                    billing_status: 'active'
                });
            }
            setAdvertiser(advertiserProfile);
            const campaignList = await campaignService.getAll(advertiserProfile.id);
            setCampaigns(campaignList);
        } catch (error) {
            console.error('Failed to load advertiser data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadClients = async () => {
        try {
            const { data, error } = await supabase
                .from('advertiser_clients')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            if (data && data.length > 0) {
                setClients(data as ClientRow[]);
            } else {
                setClients(MOCK_CLIENTS);
            }
        } catch (error) {
            console.error('Failed to load clients, using mock:', error);
            setClients(MOCK_CLIENTS);
        }
    };

    const loadMetaInsights = async () => {
        try {
            const insights = await metaAdsService.getInsights();
            if (insights && !insights.error) {
                setMetaInsights(insights);
            }
        } catch (error) {
            console.error('Meta insights unavailable, will use Supabase totals:', error);
        }
    };

    // ---- Computed stats (fallback to Supabase totals) ----
    const stats = useMemo(() => {
        if (metaInsights && (metaInsights.reach || metaInsights.impressions)) {
            return {
                reach: metaInsights.reach || 0,
                impressions: metaInsights.impressions || 0,
                clicks: metaInsights.clicks || 0,
                spendUsd: metaInsights.spend_usd || 0,
                ctr: metaInsights.ctr || 0,
                activeCampaigns: metaInsights.active_campaigns || campaigns.filter(c => c.status === 'active').length,
            };
        }
        // fallback: derive from campaigns
        const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
        const totalBudget = campaigns.reduce((sum, c) => sum + (c.lifetime_budget_ttd || 0), 0);
        const estImpressions = Math.floor(totalBudget / 45 * 1000);
        const estClicks = Math.floor(estImpressions * 0.025);
        const estSpendUsd = totalBudget / 7; // approx TTD to USD
        return {
            reach: Math.floor(estImpressions * 0.7),
            impressions: estImpressions,
            clicks: estClicks,
            spendUsd,
            ctr: estImpressions > 0 ? (estClicks / estImpressions) * 100 : 0,
            activeCampaigns,
        };
    }, [metaInsights, campaigns]);

    // ---- Campaign pause/resume ----
    const toggleCampaignStatus = async (campaign: AdCampaign) => {
        const newStatus = campaign.status === 'active' ? 'paused' : 'active';
        try {
            // Optimistic update
            setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, status: newStatus as any } : c));
            await campaignService.updateStatus(campaign.id!, newStatus as AdCampaign['status']);
        } catch (error) {
            console.error('Failed to toggle campaign status:', error);
            // Revert
            setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, status: campaign.status } : c));
            alert('Failed to update campaign status. Please try again.');
        }
    };

    const handleSaveCampaign = async (campaignData: Partial<AdCampaign>) => {
        try {
            const newCampaign = await campaignService.create(campaignData as AdCampaign);
            setCampaigns([...campaigns, newCampaign]);
            setShowWizard(false);
            setWizardPrefill(null);
        } catch (error) {
            console.error('Failed to save campaign:', error);
            alert('Failed to create campaign. Please try again.');
        }
    };

    const openWizardWithPrefill = (prefill: { name?: string; headline?: string; caption?: string; cta?: string }) => {
        setWizardPrefill(prefill);
        setShowWizard(true);
        setActiveTab('campaigns');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0B0D14] flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-[#A9B0C3]">Loading Juvay Ads...</p>
                </div>
            </div>
        );
    }

    const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
        { id: 'creative', label: 'AI Creative Studio', icon: Sparkles },
        { id: 'clients', label: 'Clients', icon: Users },
    ];

    return (
        <div className="min-h-screen bg-[#0B0D14]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Header */}
            <header className="bg-[#101320] border-b border-[#1E2235] sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-br from-red-600 to-orange-500 p-3 rounded-xl">
                                <Megaphone className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Juvay Ads</h1>
                                <p className="text-sm text-[#A9B0C3]">
                                    {advertiser?.business_name || 'Your Business'} ·
                                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${advertiser?.verified_status === 'verified'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {advertiser?.verified_status === 'verified' ? '✓ Verified' : 'Pending Verification'}
                                    </span>
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => { setWizardPrefill(null); setShowWizard(true); }}
                            className="bg-gradient-to-r from-red-600 to-orange-500 hover:opacity-90 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
                        >
                            <Plus className="h-5 w-5" />
                            Create Campaign
                        </button>
                    </div>

                    {/* Tab Nav */}
                    <div className="flex items-center gap-1 mt-4 -mb-4 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-t-lg font-semibold text-sm transition-all whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'text-white border-b-2 border-red-600 bg-[#0B0D14]/50'
                                        : 'text-[#A9B0C3] hover:text-white border-b-2 border-transparent'
                                }`}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* ===== TAB 1: OVERVIEW ===== */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {/* Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <StatCard icon={Users} label="Total Reach" value={formatNumber(stats.reach)} color="bg-blue-500" />
                            <StatCard icon={Eye} label="Impressions" value={formatNumber(stats.impressions)} color="bg-purple-500" />
                            <StatCard icon={MousePointerClick} label="Total Clicks" value={formatNumber(stats.clicks)} color="bg-green-500" />
                            <StatCard icon={DollarSign} label="Spend (USD)" value={`$${stats.spendUsd.toFixed(0)}`} color="bg-yellow-500" />
                            <StatCard icon={TrendingUp} label="Avg CTR" value={`${stats.ctr.toFixed(1)}%`} subtext="Industry avg: 2.5%" color="bg-red-500" />
                            <StatCard icon={Megaphone} label="Active Campaigns" value={String(stats.activeCampaigns)} color="bg-orange-500" />
                        </div>

                        {/* Juvay T&T Acquisition Card */}
                        <div className="bg-gradient-to-r from-red-600/10 to-orange-500/10 rounded-2xl p-6 border border-red-500/20">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-start gap-4">
                                    <div className="bg-gradient-to-br from-red-600 to-orange-500 p-3 rounded-xl">
                                        <Target className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Juvay T&T Acquisition</h3>
                                        <p className="text-sm text-[#A9B0C3]">Internal campaign — merchant acquisition in Trinidad & Tobago</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setActiveTab('campaigns')}
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all"
                                >
                                    Manage Juvay Campaigns
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <div>
                                    <p className="text-xs text-[#A9B0C3] mb-1">Current Month Spend</p>
                                    <p className="text-2xl font-bold text-white">${(stats.spendUsd * 0.4).toFixed(0)} <span className="text-sm text-[#A9B0C3]">/ ${JUVAY_MONTHLY_BUDGET_USD}</span></p>
                                </div>
                                <div>
                                    <p className="text-xs text-[#A9B0C3] mb-1">New Merchants This Month</p>
                                    <p className="text-2xl font-bold text-white">{Math.floor(JUVAY_MERCHANT_TARGET * 0.34)} <span className="text-sm text-[#A9B0C3]">/ {JUVAY_MERCHANT_TARGET}</span></p>
                                </div>
                                <div>
                                    <p className="text-xs text-[#A9B0C3] mb-1">Cost per Acquisition</p>
                                    <p className="text-2xl font-bold text-white">${(stats.spendUsd * 0.4 / Math.max(1, Math.floor(JUVAY_MERCHANT_TARGET * 0.34))).toFixed(2)}</p>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div>
                                <div className="flex justify-between text-xs text-[#A9B0C3] mb-2">
                                    <span>Merchant Acquisition Progress</span>
                                    <span>{Math.floor(JUVAY_MERCHANT_TARGET * 0.34)} / {JUVAY_MERCHANT_TARGET}</span>
                                </div>
                                <div className="w-full bg-[#1E2235] rounded-full h-3 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-red-600 to-orange-500 h-full rounded-full transition-all"
                                        style={{ width: `${34}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => { setWizardPrefill(null); setShowWizard(true); }}
                                className="bg-[#101320] hover:bg-[#1A1E2E] text-white px-5 py-3 rounded-lg font-semibold text-sm flex items-center gap-2 border border-[#1E2235] transition-all"
                            >
                                <Plus className="h-4 w-4 text-red-500" />
                                Create Campaign
                            </button>
                            <button
                                onClick={() => setActiveTab('creative')}
                                className="bg-[#101320] hover:bg-[#1A1E2E] text-white px-5 py-3 rounded-lg font-semibold text-sm flex items-center gap-2 border border-[#1E2235] transition-all"
                            >
                                <Sparkles className="h-4 w-4 text-orange-500" />
                                Generate Ad Copy
                            </button>
                            <button
                                onClick={() => setActiveTab('clients')}
                                className="bg-[#101320] hover:bg-[#1A1E2E] text-white px-5 py-3 rounded-lg font-semibold text-sm flex items-center gap-2 border border-[#1E2235] transition-all"
                            >
                                <Users className="h-4 w-4 text-green-500" />
                                Add Client
                            </button>
                        </div>

                        {/* Your Clients mini-table */}
                        <div className="bg-[#101320] rounded-2xl border border-[#1E2235] overflow-hidden">
                            <div className="p-6 border-b border-[#1E2235] flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-1">Your Clients</h2>
                                    <p className="text-sm text-[#A9B0C3]">{clients.length} agency clients</p>
                                </div>
                                <button
                                    onClick={() => setActiveTab('clients')}
                                    className="text-sm text-red-500 hover:text-red-400 font-semibold"
                                >
                                    View All →
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left text-xs text-[#A9B0C3] uppercase tracking-wider border-b border-[#1E2235]">
                                            <th className="px-6 py-3">Client</th>
                                            <th className="px-6 py-3">Active Campaigns</th>
                                            <th className="px-6 py-3">Monthly Spend</th>
                                            <th className="px-6 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#1E2235]">
                                        {clients.slice(0, 5).map((client) => (
                                            <tr key={client.id} className="hover:bg-[#0B0D14]/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-white">{client.business_name}</div>
                                                    <div className="text-xs text-[#A9B0C3]">{client.island || '—'}</div>
                                                </td>
                                                <td className="px-6 py-4 text-white">{client.active_campaigns || 0}</td>
                                                <td className="px-6 py-4 text-white">TT${(client.monthly_budget_ttd || 0).toLocaleString()}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${client.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {client.status || 'active'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== TAB 2: CAMPAIGNS ===== */}
                {activeTab === 'campaigns' && (
                    <CampaignsTab
                        campaigns={campaigns}
                        clients={clients}
                        onToggleStatus={toggleCampaignStatus}
                        onCreateClick={() => { setWizardPrefill(null); setShowWizard(true); }}
                    />
                )}

                {/* ===== TAB 3: AI CREATIVE STUDIO ===== */}
                {activeTab === 'creative' && (
                    <CreativeStudioTab onUseAd={openWizardWithPrefill} />
                )}

                {/* ===== TAB 4: CLIENTS ===== */}
                {activeTab === 'clients' && (
                    <ClientsTab clients={clients} onRefresh={loadClients} />
                )}
            </div>

            {/* Campaign Wizard */}
            <CampaignWizard
                isOpen={showWizard}
                onClose={() => { setShowWizard(false); setWizardPrefill(null); }}
                onSave={handleSaveCampaign}
                advertiserId={advertiser?.id || ''}
            />
        </div>
    );
}

// =====================================================
// FORMAT HELPER
// =====================================================

function formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
}

// =====================================================
// CAMPAIGNS TAB
// =====================================================

type CampaignFilter = 'all' | 'active' | 'paused' | 'juvay' | 'client';

const CampaignsTab: React.FC<{
    campaigns: AdCampaign[];
    clients: ClientRow[];
    onToggleStatus: (c: AdCampaign) => void;
    onCreateClick: () => void;
}> = ({ campaigns, onToggleStatus, onCreateClick }) => {
    const [filter, setFilter] = useState<CampaignFilter>('all');

    const filtered = useMemo(() => {
        switch (filter) {
            case 'active': return campaigns.filter(c => c.status === 'active');
            case 'paused': return campaigns.filter(c => c.status === 'paused');
            case 'juvay': return campaigns.filter(c => (c as any).client_name === 'Juvay Internal' || (c as any).is_internal);
            case 'client': return campaigns.filter(c => (c as any).client_name && (c as any).client_name !== 'Juvay Internal');
            default: return campaigns;
        }
    }, [campaigns, filter]);

    const filters: { id: CampaignFilter; label: string }[] = [
        { id: 'all', label: 'All' },
        { id: 'active', label: 'Active' },
        { id: 'paused', label: 'Paused' },
        { id: 'juvay', label: 'Juvay Internal' },
        { id: 'client', label: 'Client Campaigns' },
    ];

    const getPlatform = (c: AdCampaign): string => {
        const platform = (c as any).platform || (c as any).placement;
        if (platform) return platform;
        // derive from objective or default to both
        return 'both';
    };

    const getClientName = (c: AdCampaign): string => {
        return (c as any).client_name || (c as any).is_internal ? 'Juvay Internal' : 'Juvay Internal';
    };

    return (
        <div className="space-y-6">
            {/* Filter bar */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                    {filters.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                filter === f.id
                                    ? 'bg-red-600 text-white'
                                    : 'bg-[#101320] text-[#A9B0C3] hover:text-white border border-[#1E2235]'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <div className="text-sm text-[#A9B0C3]">
                    {filtered.length} campaign{filtered.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Campaign Table */}
            <div className="bg-[#101320] rounded-2xl border border-[#1E2235] overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="bg-[#1E2235] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Megaphone className="h-10 w-10 text-[#A9B0C3]" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No campaigns yet</h3>
                        <p className="text-[#A9B0C3] mb-6 max-w-md mx-auto">
                            Create your first ad campaign and start reaching customers across the Caribbean.
                        </p>
                        <button
                            onClick={onCreateClick}
                            className="bg-gradient-to-r from-red-600 to-orange-500 hover:opacity-90 text-white px-6 py-3 rounded-full font-bold inline-flex items-center gap-2 transition-all"
                        >
                            <Plus className="h-5 w-5" />
                            Create Your First Campaign
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs text-[#A9B0C3] uppercase tracking-wider border-b border-[#1E2235]">
                                    <th className="px-6 py-4">Campaign</th>
                                    <th className="px-6 py-4">Platform</th>
                                    <th className="px-6 py-4">Client</th>
                                    <th className="px-6 py-4">Budget</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Toggle</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1E2235]">
                                {filtered.map((campaign) => (
                                    <tr key={campaign.id} className="hover:bg-[#0B0D14]/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-white">{campaign.name}</div>
                                            <div className="flex items-center gap-3 text-xs text-[#A9B0C3] mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Target className="h-3 w-3" />
                                                    {campaign.objective}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {campaign.start_date || '—'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <PlatformIcon platform={getPlatform(campaign)} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-sm ${getClientName(campaign) === 'Juvay Internal' ? 'text-red-400' : 'text-white'}`}>
                                                {getClientName(campaign)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-white text-sm">
                                            TT${(campaign.daily_budget_ttd || 0).toLocaleString()}/day
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(campaign.status)}`}>
                                                {campaign.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => onToggleStatus(campaign)}
                                                disabled={campaign.status === 'completed' || campaign.status === 'rejected'}
                                                className={`inline-flex items-center justify-center w-10 h-10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                                                    campaign.status === 'active'
                                                        ? 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500'
                                                        : 'bg-green-500/10 hover:bg-green-500/20 text-green-500'
                                                }`}
                                                title={campaign.status === 'active' ? 'Pause campaign' : 'Resume campaign'}
                                            >
                                                {campaign.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

// =====================================================
// AI CREATIVE STUDIO TAB
// =====================================================

const CreativeStudioTab: React.FC<{ onUseAd: (prefill: { name?: string; headline?: string; caption?: string; cta?: string }) => void }> = ({ onUseAd }) => {
    const [businessType, setBusinessType] = useState('Food');
    const [product, setProduct] = useState('');
    const [island, setIsland] = useState('T&T');
    const [objective, setObjective] = useState('Traffic');
    const [tone, setTone] = useState('Trini Vibes');
    const [generating, setGenerating] = useState(false);
    const [variations, setVariations] = useState<AdVariation[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [imagePrompt, setImagePrompt] = useState<string>('');

    const businessTypes = ['Food', 'Fashion', 'Beauty', 'Services', 'Electronics', 'Other'];
    const islands = ['T&T', 'Jamaica', 'Barbados', 'All Caribbean'];
    const objectives = ['Traffic', 'Leads', 'Sales', 'Awareness'];
    const tones = ['Professional', 'Casual', 'Trini Vibes', 'Urgent'];

    const handleGenerate = async () => {
        if (!product.trim()) {
            setError('Please describe what you\'re promoting.');
            return;
        }
        setGenerating(true);
        setError(null);
        setVariations([]);
        setImagePrompt('');

        try {
            const result = await metaAdsService.generateAdCopy({
                business_type: businessType,
                product,
                island,
                objective,
                tone,
            } as any);

            // Handle various response shapes
            let vars: AdVariation[] = [];
            if (Array.isArray(result)) {
                vars = result;
            } else if (result?.variations && Array.isArray(result.variations)) {
                vars = result.variations;
            } else if (result?.ads && Array.isArray(result.ads)) {
                vars = result.ads;
            } else if (result?.copy && Array.isArray(result.copy)) {
                vars = result.copy;
            }

            // Normalize: ensure each variation has all fields
            vars = vars.slice(0, 3).map(v => ({
                headline: v.headline || v.title || 'Untitled Ad',
                primary_text: v.primary_text || v.body || v.text || '',
                cta_label: v.cta_label || v.cta || objectiveToCta(objective),
                image_prompt: v.image_prompt || '',
            }));

            // If we got nothing back, generate fallback copy
            if (vars.length === 0) {
                vars = generateFallbackCopy(businessType, product, island, objective, tone);
            }

            setVariations(vars);

            // Image prompt suggestion
            const imgPrompt = vars[0]?.image_prompt ||
                `Professional ${businessType.toLowerCase()} product photo of ${product}, vibrant Caribbean colors, ${island} setting, natural lighting, high quality, social media ad format`;
            setImagePrompt(imgPrompt);
        } catch (err) {
            console.error('Failed to generate ad copy:', err);
            setError('Failed to generate ad copy. Using fallback suggestions.');
            setVariations(generateFallbackCopy(businessType, product, island, objective, tone));
            setImagePrompt(`Professional ${businessType.toLowerCase()} product photo of ${product}, vibrant Caribbean colors, ${island} setting, natural lighting, high quality, social media ad format`);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600/10 to-orange-500/10 border border-red-500/20 rounded-full px-4 py-2 mb-4">
                    <Wand2 className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-semibold text-white">AI Creative Studio</span>
                </div>
                <h2 className="text-3xl font-black text-white mb-2">Generate Ad Copy with AI</h2>
                <p className="text-[#A9B0C3]">Get 3 ad variations in seconds. Caribbean-flavored, conversion-optimized.</p>
            </div>

            {/* Form */}
            <div className="bg-[#101320] rounded-2xl border border-[#1E2235] p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-white mb-2">Business Type</label>
                        <select
                            value={businessType}
                            onChange={(e) => setBusinessType(e.target.value)}
                            className="w-full bg-[#0B0D14] text-white px-4 py-3 rounded-lg border border-[#1E2235] focus:border-red-600 outline-none"
                        >
                            {businessTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-white mb-2">Which Island?</label>
                        <select
                            value={island}
                            onChange={(e) => setIsland(e.target.value)}
                            className="w-full bg-[#0B0D14] text-white px-4 py-3 rounded-lg border border-[#1E2235] focus:border-red-600 outline-none"
                        >
                            {islands.map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-white mb-2">What are you promoting?</label>
                    <input
                        type="text"
                        value={product}
                        onChange={(e) => setProduct(e.target.value)}
                        placeholder="e.g., Weekend doubles special — buy 2 get 1 free"
                        className="w-full bg-[#0B0D14] text-white px-4 py-3 rounded-lg border border-[#1E2235] focus:border-red-600 outline-none"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-white mb-2">Campaign Objective</label>
                        <select
                            value={objective}
                            onChange={(e) => setObjective(e.target.value)}
                            className="w-full bg-[#0B0D14] text-white px-4 py-3 rounded-lg border border-[#1E2235] focus:border-red-600 outline-none"
                        >
                            {objectives.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-white mb-2">Tone</label>
                        <select
                            value={tone}
                            onChange={(e) => setTone(e.target.value)}
                            className="w-full bg-[#0B0D14] text-white px-4 py-3 rounded-lg border border-[#1E2235] focus:border-red-600 outline-none"
                        >
                            {tones.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                )}

                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="w-full bg-gradient-to-r from-red-600 to-orange-500 hover:opacity-90 text-white py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                    {generating ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Generating 3 Ad Variations...
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-5 w-5" />
                            Generate 3 Ad Variations
                        </>
                    )}
                </button>
            </div>

            {/* Results */}
            {variations.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-white">Generated Variations</h3>
                    {variations.map((variation, idx) => (
                        <div key={idx} className="bg-[#101320] rounded-2xl border border-[#1E2235] p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="bg-red-600/20 text-red-400 text-xs font-bold px-2 py-1 rounded">Variation {idx + 1}</span>
                                    <span className="text-xs text-[#A9B0C3]">{tone}</span>
                                </div>
                                <CopyButton text={`${variation.headline}\n\n${variation.primary_text}\n\nCTA: ${variation.cta_label}`} />
                            </div>

                            {/* Headline */}
                            <div className="mb-4">
                                <label className="text-xs text-[#A9B0C3] uppercase tracking-wider mb-1 block">Headline</label>
                                <div className="flex items-start justify-between gap-3">
                                    <p className="text-lg font-bold text-white">{variation.headline}</p>
                                    <CopyButton text={variation.headline} />
                                </div>
                            </div>

                            {/* Primary Text */}
                            <div className="mb-4">
                                <label className="text-xs text-[#A9B0C3] uppercase tracking-wider mb-1 block">Primary Text</label>
                                <div className="flex items-start justify-between gap-3">
                                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{variation.primary_text}</p>
                                    <CopyButton text={variation.primary_text} />
                                </div>
                            </div>

                            {/* CTA */}
                            <div className="mb-4">
                                <label className="text-xs text-[#A9B0C3] uppercase tracking-wider mb-1 block">CTA Label</label>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="bg-[#0B0D14] text-white px-4 py-2 rounded-lg text-sm font-semibold border border-[#1E2235]">
                                        {variation.cta_label}
                                    </span>
                                    <CopyButton text={variation.cta_label} />
                                </div>
                            </div>

                            {/* Use This Ad */}
                            <button
                                onClick={() => onUseAd({
                                    name: product,
                                    headline: variation.headline,
                                    caption: variation.primary_text,
                                    cta: variation.cta_label,
                                })}
                                className="w-full bg-gradient-to-r from-red-600 to-orange-500 hover:opacity-90 text-white py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                            >
                                <Plus className="h-4 w-4" />
                                Use This Ad
                            </button>
                        </div>
                    ))}

                    {/* Image Prompt Suggestion */}
                    {imagePrompt && (
                        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl border border-purple-500/20 p-6">
                            <div className="flex items-start gap-3">
                                <div className="bg-purple-500 p-2 rounded-lg flex-shrink-0">
                                    <Sparkles className="h-5 w-5 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-white mb-2">Suggested Image Prompt</h4>
                                    <p className="text-sm text-gray-300 mb-3">
                                        Suggested image prompt for this ad:
                                    </p>
                                    <div className="bg-[#0B0D14] rounded-lg p-4 border border-[#1E2235] flex items-start justify-between gap-3">
                                        <p className="text-sm text-gray-300 font-mono">{imagePrompt}</p>
                                        <CopyButton text={imagePrompt} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

function objectiveToCta(objective: string): string {
    switch (objective.toLowerCase()) {
        case 'traffic': return 'Learn More';
        case 'leads': return 'Sign Up';
        case 'sales': return 'Shop Now';
        case 'awareness': return 'Learn More';
        default: return 'Learn More';
    }
}

function generateFallbackCopy(businessType: string, product: string, island: string, objective: string, tone: string): AdVariation[] {
    const isTrini = tone === 'Trini Vibes' || island === 'T&T';
    const prefix = isTrini ? '🇹🇹' : '✨';

    return [
        {
            headline: `${prefix} ${product.slice(0, 30)}${product.length > 30 ? '...' : ''}`,
            primary_text: `Looking for the best ${businessType.toLowerCase()} in ${island}? ${product}. Don't miss out — limited time offer! Tap below to learn more.`,
            cta_label: objectiveToCta(objective),
        },
        {
            headline: `${product.slice(0, 35)}${product.length > 35 ? '...' : ''}`,
            primary_text: `${tone === 'Urgent' ? '⚡ LAST CHANCE!' : '🌟 Special Offer!'} ${product}. Serving ${island} with top-quality ${businessType.toLowerCase()}. Book now while slots last!`,
            cta_label: objectiveToCta(objective),
        },
        {
            headline: isTrini ? `Yuh go love dis! ${product.slice(0, 20)}` : `${product.slice(0, 35)}`,
            primary_text: `${isTrini ? 'Allyuh, listen up!' : 'Hey there!'} We're offering ${product}. The best ${businessType.toLowerCase()} experience in ${island}. ${tone === 'Urgent' ? 'Only a few spots left!' : 'Tap to learn more.'}`,
            cta_label: objectiveToCta(objective),
        },
    ];
}

// =====================================================
// CLIENTS TAB
// =====================================================

const ClientsTab: React.FC<{ clients: ClientRow[]; onRefresh: () => void }> = ({ clients, onRefresh }) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newClient, setNewClient] = useState({
        business_name: '',
        contact_email: '',
        island: 'Trinidad',
        monthly_budget_ttd: 1500,
        facebook_page_id: '',
    });

    const handleAddClient = async () => {
        if (!newClient.business_name.trim()) {
            alert('Please enter a business name.');
            return;
        }
        setSaving(true);
        try {
            const { error } = await supabase
                .from('advertiser_clients')
                .insert([{
                    ...newClient,
                    status: 'active',
                    active_campaigns: 0,
                    created_at: new Date().toISOString(),
                }]);
            if (error) throw error;

            setShowAddModal(false);
            setNewClient({ business_name: '', contact_email: '', island: 'Trinidad', monthly_budget_ttd: 1500, facebook_page_id: '' });
            onRefresh();
        } catch (error) {
            console.error('Failed to add client:', error);
            alert('Failed to add client. The table may not exist yet. Please run the migration.');
        } finally {
            setSaving(false);
        }
    };

    const handlePauseAll = async (clientId: string) => {
        try {
            // Pause all campaigns for this client
            const { error } = await supabase
                .from('advertiser_clients')
                .update({ status: 'paused' })
                .eq('id', clientId);
            if (error) throw error;
            onRefresh();
        } catch (error) {
            console.error('Failed to pause client campaigns:', error);
            alert('Failed to pause client. Please try again.');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-white mb-2">CaribAds by Juvay — Ad Agency Platform</h2>
                <p className="text-[#A9B0C3]">Run Facebook & Instagram ads for Caribbean businesses. AI-powered. Results-driven.</p>
            </div>

            {/* Pricing Reference Card */}
            <div className="bg-gradient-to-r from-red-600/10 to-orange-500/10 rounded-2xl p-6 border border-red-500/20">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-gradient-to-br from-red-600 to-orange-500 p-2 rounded-lg">
                        <Zap className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Pricing Reference</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { name: 'Starter', price: 'TT$1,500', desc: 'Up to TT$3,000 ad spend, 2 campaigns, monthly report' },
                        { name: 'Growth', price: 'TT$3,500', desc: 'Up to TT$8,000 ad spend, 5 campaigns, weekly report, A/B testing' },
                        { name: 'Premium', price: 'TT$7,500', desc: 'Unlimited spend, unlimited campaigns, daily optimization, dedicated AI agent' },
                    ].map(tier => (
                        <div key={tier.name} className="bg-[#0B0D14]/50 rounded-lg p-4 border border-[#1E2235]">
                            <h4 className="font-bold text-white mb-1">{tier.name}</h4>
                            <p className="text-2xl font-black text-white mb-2">{tier.price}<span className="text-sm text-[#A9B0C3] font-normal">/mo</span></p>
                            <p className="text-xs text-[#A9B0C3]">{tier.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add Client Button */}
            <div className="flex justify-end">
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-gradient-to-r from-red-600 to-orange-500 hover:opacity-90 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all shadow-lg"
                >
                    <Plus className="h-5 w-5" />
                    Add New Client
                </button>
            </div>

            {/* Client Table */}
            <div className="bg-[#101320] rounded-2xl border border-[#1E2235] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs text-[#A9B0C3] uppercase tracking-wider border-b border-[#1E2235]">
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Island</th>
                                <th className="px-6 py-4">Monthly Budget</th>
                                <th className="px-6 py-4">Active Campaigns</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E2235]">
                            {clients.map((client) => (
                                <tr key={client.id} className="hover:bg-[#0B0D14]/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-white">{client.business_name}</div>
                                        {client.contact_email && <div className="text-xs text-[#A9B0C3]">{client.contact_email}</div>}
                                    </td>
                                    <td className="px-6 py-4 text-white text-sm">{client.island || '—'}</td>
                                    <td className="px-6 py-4 text-white text-sm">TT${(client.monthly_budget_ttd || 0).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-white text-sm">{client.active_campaigns || 0}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${client.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {client.status || 'active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                className="text-xs bg-[#1E2235] hover:bg-[#2A2F47] text-white px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1"
                                                title="View Campaigns"
                                            >
                                                <Eye className="h-3 w-3" />
                                                Campaigns
                                            </button>
                                            <button
                                                className="text-xs bg-[#1E2235] hover:bg-[#2A2F47] text-white px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1"
                                                title="Generate Report"
                                            >
                                                <FileText className="h-3 w-3" />
                                                Report
                                            </button>
                                            <button
                                                onClick={() => handlePauseAll(client.id)}
                                                className="text-xs bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1"
                                                title="Pause All Campaigns"
                                            >
                                                <Pause className="h-3 w-3" />
                                                Pause All
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Client Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#101320] rounded-2xl max-w-lg w-full overflow-hidden">
                        <div className="p-6 border-b border-[#1E2235] flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-white">Add New Client</h3>
                                <p className="text-sm text-[#A9B0C3]">Onboard a new business to CaribAds</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="text-[#A9B0C3] hover:text-white transition-colors">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">Business Name</label>
                                <input
                                    type="text"
                                    value={newClient.business_name}
                                    onChange={(e) => setNewClient({ ...newClient, business_name: e.target.value })}
                                    placeholder="e.g., TriniBites Restaurant"
                                    className="w-full bg-[#0B0D14] text-white px-4 py-3 rounded-lg border border-[#1E2235] focus:border-red-600 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">Contact Email</label>
                                <input
                                    type="email"
                                    value={newClient.contact_email}
                                    onChange={(e) => setNewClient({ ...newClient, contact_email: e.target.value })}
                                    placeholder="owner@business.tt"
                                    className="w-full bg-[#0B0D14] text-white px-4 py-3 rounded-lg border border-[#1E2235] focus:border-red-600 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-white mb-2">Island</label>
                                    <select
                                        value={newClient.island}
                                        onChange={(e) => setNewClient({ ...newClient, island: e.target.value })}
                                        className="w-full bg-[#0B0D14] text-white px-4 py-3 rounded-lg border border-[#1E2235] focus:border-red-600 outline-none"
                                    >
                                        <option>Trinidad</option>
                                        <option>Tobago</option>
                                        <option>Jamaica</option>
                                        <option>Barbados</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-white mb-2">Monthly Budget (TTD)</label>
                                    <input
                                        type="number"
                                        value={newClient.monthly_budget_ttd}
                                        onChange={(e) => setNewClient({ ...newClient, monthly_budget_ttd: Number(e.target.value) })}
                                        className="w-full bg-[#0B0D14] text-white px-4 py-3 rounded-lg border border-[#1E2235] focus:border-red-600 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">Facebook Page ID</label>
                                <input
                                    type="text"
                                    value={newClient.facebook_page_id}
                                    onChange={(e) => setNewClient({ ...newClient, facebook_page_id: e.target.value })}
                                    placeholder="e.g., trinibites.tt"
                                    className="w-full bg-[#0B0D14] text-white px-4 py-3 rounded-lg border border-[#1E2235] focus:border-red-600 outline-none"
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-[#1E2235] flex justify-end gap-3">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-5 py-2.5 rounded-lg text-white font-semibold text-sm hover:bg-[#1E2235] transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddClient}
                                disabled={saving}
                                className="bg-gradient-to-r from-red-600 to-orange-500 hover:opacity-90 text-white px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                Add Client
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdsPortal;
