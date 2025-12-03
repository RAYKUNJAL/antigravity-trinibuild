import React, { useEffect, useState } from 'react';
import {
    Video, TrendingUp, DollarSign, Eye, MousePointerClick,
    Plus, Calendar, Target, AlertCircle, Sparkles, BarChart3
} from 'lucide-react';
import { campaignService, advertiserService, type AdCampaign, type Advertiser } from '../services/adsManagerService';
import { authService } from '../services/authService';
import { CampaignWizard } from '../components/ads/CampaignWizard';

export function AdsPortal() {
    const [user, setUser] = useState<any>(null);
    const [advertiser, setAdvertiser] = useState<Advertiser | null>(null);
    const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [showWizard, setShowWizard] = useState(false);

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
        }
    }, [user]);

    const loadAdvertiserData = async () => {
        if (!user) return;

        try {
            setLoading(true);

            // Get or create advertiser profile
            let advertiserProfile = await advertiserService.getProfile(user.id);

            if (!advertiserProfile) {
                // First-time user - create profile
                advertiserProfile = await advertiserService.createProfile({
                    user_id: user.id,
                    business_name: user.user_metadata?.business_name || 'My Business',
                    verified_status: 'pending',
                    billing_status: 'active'
                });
            }

            setAdvertiser(advertiserProfile);

            // Load campaigns
            const campaignList = await campaignService.getAll(advertiserProfile.id);
            setCampaigns(campaignList);
        } catch (error) {
            console.error('Failed to load advertiser data:', error);
        } finally {
            setLoading(false);
        }
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

    const handleSaveCampaign = async (campaignData: Partial<AdCampaign>) => {
        try {
            const newCampaign = await campaignService.create(campaignData as AdCampaign);
            setCampaigns([...campaigns, newCampaign]);
            setShowWizard(false);
        } catch (error) {
            console.error('Failed to save campaign:', error);
            alert('Failed to create campaign. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0B0D14] flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00B894] mx-auto mb-4"></div>
                    <p className="text-[#A9B0C3]">Loading your ads dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B0D14]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Header */}
            <header className="bg-[#101320] border-b border-[#1E2235] sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-br from-[#00B894] to-[#009071] p-3 rounded-xl">
                                <Video className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">TriniBuild Ads Manager</h1>
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
                            onClick={() => setShowWizard(true)}
                            className="bg-[#00B894] hover:bg-[#009071] text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
                        >
                            <Plus className="h-5 w-5" />
                            Create Campaign
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* KPI Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-[#101320] rounded-2xl p-6 border border-[#1E2235]">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-[#00B894]/10 p-3 rounded-xl">
                                <Eye className="h-5 w-5 text-[#00B894]" />
                            </div>
                            <span className="text-xs text-[#A9B0C3]">Total</span>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white mb-1">247.5K</p>
                            <p className="text-sm text-[#A9B0C3]">Impressions</p>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-green-500">+12.5% from last week</span>
                        </div>
                    </div>

                    <div className="bg-[#101320] rounded-2xl p-6 border border-[#1E2235]">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-blue-500/10 p-3 rounded-xl">
                                <Video className="h-5 w-5 text-blue-500" />
                            </div>
                            <span className="text-xs text-[#A9B0C3]">Total</span>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white mb-1">86.2K</p>
                            <p className="text-sm text-[#A9B0C3]">Video Views</p>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-green-500">+8.3%</span>
                        </div>
                    </div>

                    <div className="bg-[#101320] rounded-2xl p-6 border border-[#1E2235]">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-purple-500/10 p-3 rounded-xl">
                                <MousePointerClick className="h-5 w-5 text-purple-500" />
                            </div>
                            <span className="text-xs text-[#A9B0C3]">Avg</span>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white mb-1">3.8%</p>
                            <p className="text-sm text-[#A9B0C3]">Click Rate (CTR)</p>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <span className="text-xs text-[#A9B0C3]">Industry avg: 2.5%</span>
                        </div>
                    </div>

                    <div className="bg-[#101320] rounded-2xl p-6 border border-[#1E2235]">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-[#FFCB05]/10 p-3 rounded-xl">
                                <DollarSign className="h-5 w-5 text-[#FFCB05]" />
                            </div>
                            <span className="text-xs text-[#A9B0C3]">Total</span>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white mb-1">TTD 1,245</p>
                            <p className="text-sm text-[#A9B0C3]">Total Spend</p>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <span className="text-xs text-[#A9B0C3]">Avg cost per view: TTD 0.014</span>
                        </div>
                    </div>
                </div>

                {/* AI Recommendations Banner */}
                <div className="bg-gradient-to-r from-[#00B894]/10 to-purple-500/10 rounded-2xl p-6 mb-8 border border-[#00B894]/20">
                    <div className="flex items-start gap-4">
                        <div className="bg-[#00B894] p-3 rounded-xl">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-2">AI Insights Ready</h3>
                            <p className="text-[#A9B0C3] mb-4">
                                Our AI analyzed your campaigns and found 3 ways to boost performance by up to 25%
                            </p>
                            <button className="bg-[#00B894] hover:bg-[#009071] text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all">
                                View Recommendations
                            </button>
                        </div>
                    </div>
                </div>

                {/* Campaigns Section */}
                <div className="bg-[#101320] rounded-2xl border border-[#1E2235] overflow-hidden">
                    <div className="p-6 border-b border-[#1E2235]">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-1">Your Campaigns</h2>
                                <p className="text-sm text-[#A9B0C3]">{campaigns.length} active campaigns</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <select className="bg-[#0B0D14] text-white px-4 py-2 rounded-lg border border-[#1E2235] text-sm">
                                    <option>All Campaigns</option>
                                    <option>Active</option>
                                    <option>Paused</option>
                                    <option>Completed</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {campaigns.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="bg-[#1E2235] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Video className="h-10 w-10 text-[#A9B0C3]" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">No campaigns yet</h3>
                            <p className="text-[#A9B0C3] mb-6 max-w-md mx-auto">
                                Create your first video ad campaign and start reaching thousands of potential customers across Trinidad & Tobago
                            </p>
                            <button
                                onClick={() => setShowWizard(true)}
                                className="bg-[#00B894] hover:bg-[#009071] text-white px-6 py-3 rounded-full font-bold inline-flex items-center gap-2 transition-all"
                            >
                                <Plus className="h-5 w-5" />
                                Create Your First Campaign
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-[#1E2235]">
                            {campaigns.map((campaign) => (
                                <div key={campaign.id} className="p-6 hover:bg-[#0B0D14]/50 transition-colors cursor-pointer">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-[#1E2235] rounded-lg w-24 h-16 flex items-center justify-center flex-shrink-0">
                                            <Video className="h-8 w-8 text-[#A9B0C3]" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h3 className="text-lg font-bold text-white mb-1">{campaign.name}</h3>
                                                    <div className="flex items-center gap-3 text-sm text-[#A9B0C3]">
                                                        <span className="flex items-center gap-1">
                                                            <Target className="h-4 w-4" />
                                                            {campaign.objective}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-4 w-4" />
                                                            {campaign.start_date} - {campaign.end_date || 'Ongoing'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(campaign.status)}`}>
                                                    {campaign.status}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-4 gap-4 mt-4">
                                                <div>
                                                    <p className="text-xs text-[#A9B0C3] mb-1">Impressions</p>
                                                    <p className="text-lg font-bold text-white">12.5K</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-[#A9B0C3] mb-1">Views</p>
                                                    <p className="text-lg font-bold text-white">4.2K</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-[#A9B0C3] mb-1">CTR</p>
                                                    <p className="text-lg font-bold text-white">3.2%</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-[#A9B0C3] mb-1">Spend</p>
                                                    <p className="text-lg font-bold text-white">
                                                        TTD {campaign.daily_budget_ttd || 0}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Campaign Wizard */}
            <CampaignWizard
                isOpen={showWizard}
                onClose={() => setShowWizard(false)}
                onSave={handleSaveCampaign}
                advertiserId={advertiser?.id || ''}
            />
        </div>
    );
}
