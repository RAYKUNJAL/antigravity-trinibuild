/**
 * AffiliateDashboard.tsx — Full Affiliate Earnings System
 * Live Supabase data, tier progression, payout requests
 * Bronze→Platinum commission tiers
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, Users, TrendingUp, Share2, Copy, CheckCircle,
  AlertCircle, ChevronRight, Award, Clock, Building2, Phone,
  RefreshCw, Download, MessageCircle, Star, Gift, Zap
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { affiliateSystemService, AffiliateProfile, AffiliateReferral, TIER_CONFIG, COMMISSION_EVENTS } from '../services/affiliateSystemService';
import { useNavigate } from 'react-router-dom';

const TIER_COLORS = {
  bronze: { bg: 'from-amber-700 to-amber-600', badge: 'bg-amber-100 text-amber-800', icon: '🥉' },
  silver: { bg: 'from-gray-500 to-gray-400', badge: 'bg-gray-100 text-gray-700', icon: '🥈' },
  gold: { bg: 'from-yellow-600 to-yellow-400', badge: 'bg-yellow-100 text-yellow-800', icon: '🥇' },
  platinum: { bg: 'from-blue-800 to-purple-700', badge: 'bg-purple-100 text-purple-800', icon: '💎' },
};

export default function AffiliateDashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<AffiliateProfile | null>(null);
  const [referrals, setReferrals] = useState<AffiliateReferral[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [tab, setTab] = useState<'overview' | 'referrals' | 'payout' | 'leaderboard'>('overview');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'bank' | 'wipay' | 'credit'>('bank');
  const [bankForm, setBankForm] = useState({ bank_name: '', account_name: '', account_number: '', branch: '' });
  const [wipayPhone, setWipayPhone] = useState('');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [payoutDone, setPayoutDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { navigate('/login'); return; }
      setUser(user);
      const ap = await affiliateSystemService.getOrCreateProfile(user.id, user.email);
      setProfile(ap);
      const [refs, payoutData, lb] = await Promise.all([
        affiliateSystemService.getReferrals(ap.id),
        affiliateSystemService.getPayoutRequests(ap.id),
        affiliateSystemService.getLeaderboard(),
      ]);
      setReferrals(refs);
      setPayouts(payoutData);
      setLeaderboard(lb);
      setLoading(false);
    });
  }, [navigate]);

  const copyLink = () => {
    if (!profile) return;
    navigator.clipboard.writeText(affiliateSystemService.getReferralLink(profile.referral_code));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareWhatsApp = () => {
    if (!profile) return;
    const link = affiliateSystemService.getReferralLink(profile.referral_code);
    const msg = encodeURIComponent(`🇹🇹 Start your free online store on TriniBuild!\n\nSell anything with Cash on Delivery — no credit card needed.\n\nJoin here: ${link}\n\nMy code: ${profile.referral_code}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const submitPayout = async () => {
    if (!profile) return;
    setPayoutSubmitting(true);
    try {
      await affiliateSystemService.requestPayout(
        profile.id,
        parseFloat(payoutAmount),
        payoutMethod,
        payoutMethod === 'bank' ? bankForm : undefined
      );
      if (payoutMethod === 'wipay') {
        await affiliateSystemService.updatePayoutDetails(user.id, { wipay_phone: wipayPhone });
      }
      setPayoutDone(true);
      const updated = await affiliateSystemService.getOrCreateProfile(user.id, user.email);
      setProfile(updated);
    } catch (e: any) { alert(e.message); } finally { setPayoutSubmitting(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <RefreshCw className="w-8 h-8 text-red-600 animate-spin" />
    </div>
  );

  if (!profile) return null;

  const tierConf = TIER_CONFIG[profile.tier];
  const tierStyle = TIER_COLORS[profile.tier];
  const progress = affiliateSystemService.getTierProgress(profile);
  const referralLink = affiliateSystemService.getReferralLink(profile.referral_code);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero banner */}
      <div className={`bg-gradient-to-r ${tierStyle.bg} text-white`}>
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{tierStyle.icon}</span>
                <span className="text-lg font-bold opacity-90">{tierConf.label} Affiliate</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black mb-1">TT${profile.total_earned_ttd.toFixed(2)}</h1>
              <p className="opacity-75">Total Earned · {Math.round(tierConf.commission * 100)}% commission per referral</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-75 mb-1">Available to Withdraw</p>
              <p className="text-2xl font-bold">TT${profile.pending_payout_ttd.toFixed(2)}</p>
              {profile.pending_payout_ttd >= 50 && (
                <button
                  onClick={() => setTab('payout')}
                  className="mt-2 bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
                >
                  Request Payout →
                </button>
              )}
            </div>
          </div>

          {/* Tier progress */}
          {progress.next_tier && (
            <div className="mt-6">
              <div className="flex justify-between text-sm opacity-75 mb-2">
                <span>{profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)}</span>
                <span>{progress.referrals_needed} more for {progress.next_tier}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${progress.percentage}%` }}
                  className="h-2 bg-white rounded-full"
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Referral link card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-red-600" />
            Your Referral Link
          </h2>
          <div className="flex gap-3">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono text-sm text-gray-600 truncate">
              {referralLink}
            </div>
            <button
              onClick={copyLink}
              className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                copied ? 'bg-green-100 text-green-700' : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              {copied ? <><CheckCircle className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Copy</>}
            </button>
            <button
              onClick={shareWhatsApp}
              className="px-4 py-3 rounded-xl text-sm font-semibold bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden md:inline">WhatsApp</span>
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Code: <span className="font-mono font-bold text-gray-600">{profile.referral_code}</span> · 
            You earn TT${COMMISSION_EVENTS.subscription_pro.amount_ttd} per Pro referral, TT${COMMISSION_EVENTS.subscription_premium.amount_ttd} per Premium
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          {(['overview', 'referrals', 'payout', 'leaderboard'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Referrals', value: profile.total_referrals, icon: Users, color: 'text-blue-600 bg-blue-50' },
                { label: 'Qualified', value: profile.paid_referrals, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
                { label: 'Total Earned', value: `TT$${profile.total_earned_ttd.toFixed(0)}`, icon: DollarSign, color: 'text-yellow-600 bg-yellow-50' },
                { label: 'Paid Out', value: `TT$${profile.paid_out_ttd.toFixed(0)}`, icon: Award, color: 'text-purple-600 bg-purple-50' },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className={`inline-flex p-2 rounded-lg ${stat.color} mb-3`}><stat.icon className="w-4 h-4" /></div>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Commission events reference */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-4">How You Earn</h3>
              <div className="space-y-3">
                {Object.entries(COMMISSION_EVENTS).map(([key, event]) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <Gift className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-gray-700">{event.label}</span>
                    </div>
                    <span className="text-sm font-bold text-green-600">+TT${event.amount_ttd}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-yellow-800 font-medium">
                  🏆 Your tier upgrades automatically based on paid referrals:
                  Bronze (10%) → Silver 5+ (13%) → Gold 20+ (17%) → Platinum 50+ (20%)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Referrals Tab */}
        {tab === 'referrals' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Referral History ({referrals.length})</h3>
            </div>
            {referrals.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No referrals yet</p>
                <p className="text-gray-400 text-sm mt-1">Share your link and start earning!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {referrals.map(ref => (
                  <div key={ref.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{ref.referred_email || 'Anonymous'}</p>
                      <p className="text-xs text-gray-400">{new Date(ref.created_at).toLocaleDateString('en-TT')} · {ref.status}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${ref.commission_ttd > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                        {ref.commission_ttd > 0 ? `+TT$${ref.commission_ttd.toFixed(2)}` : 'Pending'}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        ref.status === 'qualified' ? 'bg-green-100 text-green-700' :
                        ref.status === 'subscription' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{ref.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payout Tab */}
        {tab === 'payout' && (
          <div className="space-y-4">
            {payoutDone ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Payout Requested!</h3>
                <p className="text-gray-500">We'll process your payout within 3-5 business days.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-600 font-medium">Available Balance</span>
                  <span className="text-2xl font-bold text-gray-900">TT${profile.pending_payout_ttd.toFixed(2)}</span>
                </div>

                {profile.pending_payout_ttd < 50 ? (
                  <div className="p-4 bg-yellow-50 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-700">Minimum payout is TT$50. You need TT${(50 - profile.pending_payout_ttd).toFixed(2)} more.</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Amount to Withdraw (TTD)</label>
                      <input
                        type="number" value={payoutAmount} onChange={e => setPayoutAmount(e.target.value)}
                        max={profile.pending_payout_ttd} min={50} placeholder="Minimum TT$50"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg font-bold focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Payout Method</label>
                      <div className="grid grid-cols-3 gap-3">
                        {(['bank', 'wipay', 'credit'] as const).map(m => (
                          <button key={m} onClick={() => setPayoutMethod(m)}
                            className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                              payoutMethod === m ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {m === 'bank' ? '🏦 Bank' : m === 'wipay' ? '📱 WiPay' : '💳 Credit'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {payoutMethod === 'bank' && (
                      <div className="space-y-3">
                        <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" placeholder="Bank Name"
                          value={bankForm.bank_name} onChange={e => setBankForm(f => ({ ...f, bank_name: e.target.value }))} />
                        <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" placeholder="Account Name (exactly as on bank card)"
                          value={bankForm.account_name} onChange={e => setBankForm(f => ({ ...f, account_name: e.target.value }))} />
                        <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" placeholder="Account Number"
                          value={bankForm.account_number} onChange={e => setBankForm(f => ({ ...f, account_number: e.target.value }))} />
                        <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" placeholder="Branch (optional)"
                          value={bankForm.branch} onChange={e => setBankForm(f => ({ ...f, branch: e.target.value }))} />
                      </div>
                    )}

                    {payoutMethod === 'wipay' && (
                      <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" placeholder="WiPay Phone Number (+1868XXXXXXX)"
                        value={wipayPhone} onChange={e => setWipayPhone(e.target.value)} />
                    )}

                    {payoutMethod === 'credit' && (
                      <div className="p-4 bg-blue-50 rounded-xl text-sm text-blue-700">
                        💳 Platform credit will be added to your account and applied to your next subscription payment automatically.
                      </div>
                    )}

                    <button
                      disabled={payoutSubmitting || !payoutAmount}
                      onClick={submitPayout}
                      className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {payoutSubmitting ? 'Submitting...' : `Request TT$${payoutAmount || '0'} Payout`}
                    </button>
                  </>
                )}

                {/* Payout history */}
                {payouts.length > 0 && (
                  <div>
                    <p className="font-semibold text-gray-700 mb-3">Payout History</p>
                    {payouts.map(p => (
                      <div key={p.id} className="flex items-center justify-between py-3 border-b border-gray-100">
                        <div>
                          <p className="text-sm font-medium">TT${p.amount_ttd.toFixed(2)} via {p.method}</p>
                          <p className="text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString('en-TT')}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          p.status === 'completed' ? 'bg-green-100 text-green-700' :
                          p.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>{p.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {tab === 'leaderboard' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Top Affiliates 🏆</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {leaderboard.map((entry, i) => (
                <div key={entry.referral_code} className={`flex items-center gap-4 p-4 ${i < 3 ? 'bg-yellow-50/30' : ''}`}>
                  <span className="text-xl font-black text-gray-300 w-8 text-center">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 font-mono">{entry.referral_code}</p>
                    <p className="text-xs text-gray-400">{entry.tier} · {entry.paid_referrals} qualified</p>
                  </div>
                  <span className="text-sm font-bold text-green-600">TT${(entry.total_earned_ttd || 0).toFixed(0)}</span>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <div className="p-12 text-center text-gray-400 text-sm">No affiliates yet — be the first!</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
