import React, { useEffect, useState } from 'react';
import { Copy, Share2, DollarSign, Users, TrendingUp, Gift, Check, ExternalLink } from 'lucide-react';
import { viralLoopsService, ReferralLink, UserReferralStats, AffiliateEarning } from '../services/viralLoopsService';
import { authService } from '../services/auth';

export const ReferralDashboard: React.FC = () => {
    const [referralLink, setReferralLink] = useState<ReferralLink | null>(null);
    const [stats, setStats] = useState<UserReferralStats | null>(null);
    const [earnings, setEarnings] = useState<AffiliateEarning[]>([]);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReferralData();
    }, []);

    const loadReferralData = async () => {
        try {
            const user = authService.getCurrentUser();
            if (!user) return;

            const [linkData, statsData, earningsData] = await Promise.all([
                viralLoopsService.getUserReferralLink(user.id),
                viralLoopsService.getUserReferralStats(user.id),
                viralLoopsService.getUserEarnings(user.id)
            ]);

            setReferralLink(linkData);
            setStats(statsData);
            setEarnings(earningsData);
        } catch (error) {
            console.error('Failed to load referral data:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyReferralLink = () => {
        if (!referralLink) return;
        navigator.clipboard.writeText(referralLink.referral_url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareOnPlatform = (platform: 'whatsapp' | 'facebook' | 'twitter') => {
        if (!referralLink) return;

        const text = `Join TriniBuild and get your FREE website! Use my link: ${referralLink.referral_url}`;
        let url = '';

        switch (platform) {
            case 'whatsapp':
                url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                break;
            case 'facebook':
                url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink.referral_url)}`;
                break;
            case 'twitter':
                url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
                break;
        }

        window.open(url, '_blank');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trini-red"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-trini-red to-red-600 text-white rounded-xl p-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTMwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMzAgMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] animate-pulse"></div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                            <Gift className="h-8 w-8" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold">Earn with Referrals</h2>
                            <p className="text-white/90">Share TriniBuild and earn 10% commission on all sales!</p>
                        </div>
                    </div>

                    {/* Referral Link */}
                    {referralLink && (
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-6">
                            <p className="text-sm text-white/80 mb-2">Your Unique Referral Link:</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={referralLink.referral_url}
                                    readOnly
                                    className="flex-1 bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white font-mono text-sm"
                                />
                                <button
                                    onClick={copyReferralLink}
                                    className="bg-white text-trini-red px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors flex items-center gap-2"
                                >
                                    {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>

                            {/* Share Buttons */}
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => shareOnPlatform('whatsapp')}
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    <Share2 className="h-4 w-4" />
                                    WhatsApp
                                </button>
                                <button
                                    onClick={() => shareOnPlatform('facebook')}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    <Share2 className="h-4 w-4" />
                                    Facebook
                                </button>
                                <button
                                    onClick={() => shareOnPlatform('twitter')}
                                    className="flex-1 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    <Share2 className="h-4 w-4" />
                                    Twitter
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Total Referrals</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.total_referrals || 0}</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Successful Conversions</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.successful_referrals || 0}</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <DollarSign className="h-6 w-6 text-yellow-600" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Total Earnings</p>
                    <p className="text-3xl font-bold text-gray-900">TT${stats?.total_earnings.toFixed(2) || '0.00'}</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Gift className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Bonus Listings</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.bonus_listings_earned || 0}</p>
                </div>
            </div>

            {/* How It Works */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">How Referrals Work</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl font-bold text-blue-600">1</span>
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2">Share Your Link</h4>
                        <p className="text-sm text-gray-600">Send your unique referral link to friends, family, or on social media</p>
                    </div>

                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl font-bold text-green-600">2</span>
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2">They Sign Up</h4>
                        <p className="text-sm text-gray-600">When someone signs up using your link, you both get rewards!</p>
                    </div>

                    <div className="text-center">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl font-bold text-yellow-600">3</span>
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2">Earn Commission</h4>
                        <p className="text-sm text-gray-600">Get 10% commission on all their sales, forever!</p>
                    </div>
                </div>
            </div>

            {/* Earnings History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900">Earnings History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {earnings.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        No earnings yet. Start sharing your referral link!
                                    </td>
                                </tr>
                            ) : (
                                earnings.map((earning) => (
                                    <tr key={earning.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {new Date(earning.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{earning.source_type}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-green-600">
                                            TT${earning.amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${earning.status === 'paid' ? 'bg-green-100 text-green-800' :
                                                    earning.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                                        earning.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                }`}>
                                                {earning.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
