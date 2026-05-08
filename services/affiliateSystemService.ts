/**
 * affiliateSystemService.ts — Live Affiliate/Referral System
 * Bronze→Silver→Gold→Platinum tiers
 * 10%→13%→17%→20% commission on referred subscriptions
 * Payout via Bank, WiPay, or Platform Credit
 */

import { supabase } from './supabaseClient';

export interface AffiliateProfile {
  id: string;
  user_id: string;
  referral_code: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  commission_rate: number;
  total_referrals: number;
  paid_referrals: number;
  total_earned_ttd: number;
  pending_payout_ttd: number;
  paid_out_ttd: number;
  bank_name?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_branch?: string;
  wipay_phone?: string;
  payout_method: 'bank' | 'wipay' | 'credit';
  status: string;
  joined_at: string;
}

export interface AffiliateReferral {
  id: string;
  referrer_id: string;
  referred_email: string;
  referral_code: string;
  status: 'signed_up' | 'store_created' | 'first_order' | 'subscription' | 'qualified';
  commission_ttd: number;
  commission_paid: boolean;
  subscription_plan?: string;
  event_date: string;
  created_at: string;
}

export interface PayoutRequest {
  id: string;
  affiliate_id: string;
  amount_ttd: number;
  method: 'bank' | 'wipay' | 'credit';
  bank_details?: Record<string, string>;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  reference?: string;
  created_at: string;
}

export const TIER_CONFIG = {
  bronze: { label: 'Bronze', min_referrals: 0, commission: 0.10, color: '#CD7F32', next: 'silver', next_at: 5 },
  silver: { label: 'Silver', min_referrals: 5, commission: 0.13, color: '#9CA3AF', next: 'gold', next_at: 20 },
  gold: { label: 'Gold', min_referrals: 20, commission: 0.17, color: '#FFD700', next: 'platinum', next_at: 50 },
  platinum: { label: 'Platinum', min_referrals: 50, commission: 0.20, color: '#E5E4E2', next: null, next_at: null },
};

export const COMMISSION_EVENTS = {
  subscription_pro: { label: 'Pro Subscription Referred', amount_ttd: 19.90 },   // 10% of TT$199
  subscription_premium: { label: 'Premium Subscription Referred', amount_ttd: 39.90 },
  store_created: { label: 'Store Created', amount_ttd: 5 },
  first_order: { label: 'First COD Order', amount_ttd: 10 },
};

export const affiliateSystemService = {
  async getOrCreateProfile(user_id: string, email?: string): Promise<AffiliateProfile> {
    const { data: existing } = await supabase
      .from('affiliate_profiles')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (existing) return existing;

    // Generate referral code from email/uid
    const base = (email?.split('@')[0] || user_id.replace(/-/g, '').substring(0, 6)).toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
    const suffix = Math.random().toString(36).substring(2, 5).toUpperCase();
    const referral_code = `${base}${suffix}`;

    const { data: newProfile, error } = await supabase
      .from('affiliate_profiles')
      .insert({
        user_id,
        referral_code,
        tier: 'bronze',
        commission_rate: 0.10,
        total_referrals: 0,
        paid_referrals: 0,
        total_earned_ttd: 0,
        pending_payout_ttd: 0,
        paid_out_ttd: 0,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;
    return newProfile;
  },

  async getReferrals(affiliate_id: string): Promise<AffiliateReferral[]> {
    const { data } = await supabase
      .from('affiliate_referrals')
      .select('*')
      .eq('referrer_id', affiliate_id)
      .order('created_at', { ascending: false });
    return data || [];
  },

  async getPayoutRequests(affiliate_id: string): Promise<PayoutRequest[]> {
    const { data } = await supabase
      .from('affiliate_payout_requests')
      .select('*')
      .eq('affiliate_id', affiliate_id)
      .order('created_at', { ascending: false });
    return data || [];
  },

  async requestPayout(
    affiliate_id: string,
    amount_ttd: number,
    method: 'bank' | 'wipay' | 'credit',
    bank_details?: { bank_name: string; account_name: string; account_number: string; branch?: string }
  ): Promise<PayoutRequest> {
    // Check minimum payout
    if (amount_ttd < 50) throw new Error('Minimum payout is TT$50');

    const { data: profile } = await supabase
      .from('affiliate_profiles')
      .select('pending_payout_ttd')
      .eq('id', affiliate_id)
      .single();

    if (!profile || profile.pending_payout_ttd < amount_ttd) {
      throw new Error('Insufficient balance');
    }

    const { data, error } = await supabase
      .from('affiliate_payout_requests')
      .insert({ affiliate_id, amount_ttd, method, bank_details, status: 'pending' })
      .select()
      .single();

    if (error) throw error;

    // Deduct from pending balance
    await supabase
      .from('affiliate_profiles')
      .update({ pending_payout_ttd: profile.pending_payout_ttd - amount_ttd })
      .eq('id', affiliate_id);

    return data;
  },

  async updatePayoutDetails(
    user_id: string,
    details: { bank_name?: string; bank_account_name?: string; bank_account_number?: string; bank_branch?: string; wipay_phone?: string; payout_method?: string }
  ): Promise<void> {
    const { error } = await supabase
      .from('affiliate_profiles')
      .update({ ...details, updated_at: new Date().toISOString() })
      .eq('user_id', user_id);
    if (error) throw error;
  },

  async trackReferralSignup(referral_code: string, referred_user_id: string, referred_email: string): Promise<void> {
    const { data: affiliate } = await supabase
      .from('affiliate_profiles')
      .select('id')
      .eq('referral_code', referral_code)
      .single();

    if (!affiliate) return;

    await supabase.from('affiliate_referrals').insert({
      referrer_id: affiliate.id,
      referred_user_id,
      referred_email,
      referral_code,
      status: 'signed_up',
      commission_ttd: 0,
    });

    await supabase.from('affiliate_profiles')
      .update({ total_referrals: supabase.rpc('increment', { row_id: affiliate.id, table: 'affiliate_profiles', col: 'total_referrals', amount: 1 }) })
      .eq('id', affiliate.id);
  },

  async addCommission(referrer_user_id: string, amount_ttd: number, event: string): Promise<void> {
    const { data: profile } = await supabase
      .from('affiliate_profiles')
      .select('id, total_earned_ttd, pending_payout_ttd, paid_referrals')
      .eq('user_id', referrer_user_id)
      .single();

    if (!profile) return;

    await supabase.from('affiliate_profiles').update({
      total_earned_ttd: (profile.total_earned_ttd || 0) + amount_ttd,
      pending_payout_ttd: (profile.pending_payout_ttd || 0) + amount_ttd,
      paid_referrals: (profile.paid_referrals || 0) + 1,
      updated_at: new Date().toISOString(),
    }).eq('id', profile.id);
  },

  getReferralLink(referral_code: string): string {
    return `https://trinibuild.com/signup?ref=${referral_code}`;
  },

  getTierProgress(profile: AffiliateProfile): { percentage: number; next_tier: string | null; referrals_needed: number } {
    const config = TIER_CONFIG[profile.tier];
    if (!config.next) return { percentage: 100, next_tier: null, referrals_needed: 0 };
    const start = config.min_referrals;
    const end = config.next_at!;
    const current = profile.paid_referrals;
    const percentage = Math.min(100, Math.round(((current - start) / (end - start)) * 100));
    return { percentage, next_tier: config.next, referrals_needed: Math.max(0, end - current) };
  },

  getLeaderboard: async (): Promise<AffiliateProfile[]> => {
    const { data } = await supabase
      .from('affiliate_profiles')
      .select('referral_code, tier, total_earned_ttd, paid_referrals, joined_at')
      .eq('status', 'active')
      .order('total_earned_ttd', { ascending: false })
      .limit(10);
    return (data || []) as AffiliateProfile[];
  },
};
