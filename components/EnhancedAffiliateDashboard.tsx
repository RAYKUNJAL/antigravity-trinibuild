import React, { useEffect, useState } from 'react';
import { Trophy, DollarSign, Users, TrendingUp, Award, Zap, Check, AlertCircle } from 'lucide-react';
import { affiliateServiceV2, AffiliateEligibility, PayoutRequest, LeaderboardEntry, REWARD_TIERS, PAYOUT_CONFIG } from '../services/affiliateServiceV2';
import { viralLoopsService, UserReferralStats } from '../services/viralLoopsService';
import { authService } from '../services/auth';
import { ReferralDashboard } from './ReferralDashboard';

export const EnhancedAffiliateDashboard: React.FC = () => {
    const [eligibility, setEligibility] = useState<AffiliateEligibility | null>(null);
    const [stats, setStats] = useState<UserReferralStats | null>(null);
    const [payoutHistory, setPayoutHistory] = useState<PayoutRequest[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPayoutModal, setShowPayoutModal] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const user = authService.getCurrentUser();
            if (!user) return;

            const [eligData, statsData, payoutsData, leaderData] = await Promise.all([
                affiliateServiceV2.checkEligibility(user.id),
                viralLoopsService.getUserReferralStats(user.id),
                affiliateServiceV2.getPayoutHistory(user.id),
                affiliateServiceV2.getLeaderboard()
            ]);

            setEligibility(eligData);
            setStats(statsData);
            setPayoutHistory(payoutsData);
            setLeaderboard(leaderData);
        } catch (error) {
            console.error('Failed to load affiliate data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trini-red"></div>
            </div>
        );
    }

    // Check if eligible
    if (!eligibility?.eligible) {
        return (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8">
                <div className="flex items-start gap-4">
                    <AlertCircle className="h-8 w-8 text-yellow-600 flex-shrink-0" />
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Complete Your Profile to Join Affiliate Program</h3>
                        <p className="text-gray-700 mb-4">You need to meet these requirements:</p>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                {eligibility?.age_verified ? (
                                    <Check className="h-5 w-5 text-green-600" />
                                ) : (
                                    <div className="h-5 w-5 rounded-full border-2 border-gray-300"></div>
                                )}
                                <span className={eligibility?.age_verified ? 'text-green-700 font-bold' : 'text-gray-600'}>
                                    Be 18 years or older
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {eligibility?.phone_verified ? (
                                    <Check className="h-5 w-5 text-green-600" />
                                ) : (
                                    <div className="h-5 w-5 rounded-full border-2 border-gray-300"></div>
                                )}
                                <span className={eligibility?.phone_verified ? 'text-green-700 font-bold' : 'text-gray-600'}>
                                    Verify your phone number
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {eligibility && eligibility.profile_completion_percent >= 80 ? (
                                    <Check className="h-5 w-5 text-green-600" />
                                ) : (
                                    <div className="h-5 w-5 rounded-full border-2 border-gray-300"></div>
                                )}
                                <span className={eligibility && eligibility.profile_completion_percent >= 80 ? 'text-green-700 font-bold' : 'text-gray-600'}>
                                    Complete 80% of your profile ({eligibility?.profile_completion_percent || 0}% done)
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {eligibility?.has_listing_or_ride ? (
                                    <Check className="h-5 w-5 text-green-600" />
                                ) : (
                                    <div className="h-5 w-5 rounded-full border-2 border-gray-300"></div>
                                )}
                                <span className={eligibility?.has_listing_or_ride ? 'text-green-700 font-bold' : 'text-gray-600'}>
                                    Create at least one listing or offer a ride
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Reward Tiers Explanation */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl p-8">
                <h2 className="text-3xl font-bold mb-4">🎯 4-Tier Reward System</h2>
                <p className="text-lg mb-6">Earn more as your referrals grow!</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Level 1 */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border-2 border-white/20">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center font-bold">1</div>
                            <h4 className="font-bold">Direct Referral</h4>
                        </div>
                        <p className="text-sm text-white/90 mb-2">When someone signs up:</p>
                        <p className="font-bold text-yellow-300">+10 Free Listings</p>
                    </div>

                    {/* Level 2 */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border-2 border-white/20">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center font-bold">2</div>
                            <h4 className="font-bold">First Transaction</h4>
                        </div>
                        <p className="text-sm text-white/90 mb-2">Their first paid action:</p>
                        <p className="font-bold text-yellow-300">25% Platform Fee</p>
                    </div>

                    {/* Level 3 */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border-2 border-white/20">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center font-bold">3</div>
                            <h4 className="font-bold">Recurring Share</h4>
                        </div>
                        <p className="text-sm text-white/90 mb-2">All future fees (12 months):</p>
                        <p className="font-bold text-yellow-300">10% Lifetime</p>
                        <p className="text-xs text-white/70">Cap: TT$5,000/user</p>
                    </div>

                    {/* Mega Bonus */}
                    <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg p-4 border-2 border-yellow-300">
                        <div className="flex items-center gap-2 mb-2">
                            <Trophy className="h-6 w-6 text-white" />
                            <h4 className="font-bold text-white">Mega Bonus</h4>
                        </div>
                        <p className="text-sm text-white mb-2">50+ active referrals:</p>
                        <p className="font-bold text-white">TT$500 Cash!</p>
                        <p className="text-xs text-white/90">+ Influencer Badge</p>
                    </div>
                </div>
            </div>

            {/* Standard Referral Dashboard */}
            <ReferralDashboard />

            {/* Earnings Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Available for Payout</p>
                    <p className="text-3xl font-bold text-gray-900">TT${stats?.pending_earnings.toFixed(2) || '0.00'}</p>
                    {stats && stats.pending_earnings >= PAYOUT_CONFIG.minimum && (
                        <button
                            onClick={() => setShowPayoutModal(true)}
                            className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors"
                        >
                            Request Payout
                        </button>
                    )}
                    {stats && stats.pending_earnings < PAYOUT_CONFIG.minimum && (
                        <p className="mt-4 text-xs text-gray-500">
                            Minimum: TT${PAYOUT_CONFIG.minimum} (TT${(PAYOUT_CONFIG.minimum - stats.pending_earnings).toFixed(2)} to go)
                        </p>
                    )}
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Total Paid Out</p>
                    <p className="text-3xl font-bold text-gray-900">TT${stats?.paid_earnings.toFixed(2) || '0.00'}</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Award className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Your Rank</p>
                    <p className="text-3xl font-bold text-gray-900">
                        #{leaderboard.find(l => l.user_id === authService.getCurrentUser()?.id)?.rank || '-'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Top 50 Affiliates</p>
                </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-orange-50">
                    <div className="flex items-center gap-3">
                        <Trophy className="h-8 w-8 text-yellow-600" />
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Top Affiliates Leaderboard</h3>
                            <p className="text-sm text-gray-600">See where you rank among Trinidad's top earners</p>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Rank</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Referrals</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Earnings</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">K-Factor</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {leaderboard.slice(0, 10).map((entry) => (
                                <tr
                                    key={entry.user_id}
                                    className={entry.user_id === authService.getCurrentUser()?.id ? 'bg-yellow-50' : 'hover:bg-gray-50'}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {entry.rank <= 3 && (
                                                <Trophy className={`h-5 w-5 ${entry.rank === 1 ? 'text-yellow-500' :
                                                        entry.rank === 2 ? 'text-gray-400' :
                                                            'text-orange-600'
                                                    }`} />
                                            )}
                                            <span className="font-bold text-gray-900">#{entry.rank}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{entry.full_name || 'Anonymous'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{entry.successful_referrals}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-green-600">TT${entry.total_earnings.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{entry.k_factor.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
