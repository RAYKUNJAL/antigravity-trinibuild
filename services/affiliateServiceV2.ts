import { supabase } from './supabaseClient';
import { viralLoopsService } from './viralLoopsService';

export interface AffiliateEligibility {
    user_id: string;
    age_verified: boolean;
    phone_verified: boolean;
    profile_completion_percent: number;
    has_listing_or_ride: boolean;
    eligible: boolean;
    eligibility_date?: string;
}

export interface PayoutRequest {
    id: string;
    user_id: string;
    amount: number;
    method: 'wipay' | 'linx' | 'bank_transfer';
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    bank_details?: Record<string, any>;
    wipay_phone?: string;
    linx_card?: string;
    fee_amount: number;
    net_amount: number;
    processed_at?: string;
    created_at: string;
}

export interface LeaderboardEntry {
    user_id: string;
    email: string;
    full_name: string;
    total_referrals: number;
    successful_referrals: number;
    total_earnings: number;
    k_factor: number;
    rank: number;
}

export const REWARD_TIERS = {
    LEVEL_1_SIGNUP: {
        name: 'Direct Referral',
        reward: '10 free marketplace listings (lifetime)',
        listings: 10
    },
    LEVEL_2_FIRST_TRANSACTION: {
        name: 'First Transaction',
        commission: 0.25, // 25% of platform fee
        referee_discount: 0.10 // 10% discount for referee
    },
    LEVEL_3_RECURRING: {
        name: 'Recurring Revenue Share',
        commission: 0.10, // 10% lifetime recurring
        cap: 5000 // TTD cap per user
    },
    MEGA_BONUS: {
        name: 'Power Referrer',
        threshold: 50, // 50+ active users in 90 days
        cash_reward: 500, // TTD
        badge: 'Verified Influencer'
    }
};

export const PAYOUT_CONFIG = {
    currency: 'TTD',
    minimum: 200,
    frequency: 'Net-15', // 1st & 15th of month
    methods: {
        wipay: { name: 'WiPay Instant Transfer', fee: 0 },
        linx: { name: 'LinX Debit Card', fee: 0 },
        bank_transfer: { name: 'Direct Bank Transfer', fee: 15 } // TTD
    }
};

export const affiliateServiceV2 = {
    // Eligibility Management
    async checkEligibility(userId: string): Promise<AffiliateEligibility | null> {
        const { data, error } = await supabase
            .from('affiliate_eligibility')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data as AffiliateEligibility | null;
    },

    async updateEligibility(
        userId: string,
        updates: Partial<AffiliateEligibility>
    ): Promise<void> {
        const { error } = await supabase
            .from('affiliate_eligibility')
            .update(updates)
            .eq('user_id', userId);

        if (error) throw error;

        // Run eligibility check
        await supabase.rpc('check_affiliate_eligibility', { p_user_id: userId });
    },

    async verifyAge(userId: string, birthDate: string): Promise<void> {
        const age = this.calculateAge(birthDate);
        if (age < 18) {
            throw new Error('Must be 18 or older to participate in affiliate program');
        }

        await this.updateEligibility(userId, { age_verified: true });
    },

    calculateAge(birthDate: string): number {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        return age;
    },

    // Tiered Rewards
    async awardLevel1Signup(referrerId: string, refereeId: string): Promise<void> {
        // Award 10 free listings to referrer
        const { data: refLink } = await supabase
            .from('referral_links')
            .select('id')
            .eq('user_id', referrerId)
            .single();

        if (!refLink) return;

        await supabase.from('referral_conversions').insert({
            referral_link_id: refLink.id,
            referrer_id: referrerId,
            referee_id: refereeId,
            conversion_type: 'signup',
            reward_amount: REWARD_TIERS.LEVEL_1_SIGNUP.listings,
            reward_type: 'listings',
            tier: 'level_1_signup'
        });

        // Update user's listing quota
        await supabase.rpc('add_user_listings', {
            p_user_id: referrerId,
            p_count: REWARD_TIERS.LEVEL_1_SIGNUP.listings
        });
    },

    async awardLevel2FirstTransaction(
        referrerId: string,
        refereeId: string,
        platformFee: number,
        transactionId: string
    ): Promise<number> {
        const commission = await supabase.rpc('calculate_tiered_commission', {
            p_referrer_id: referrerId,
            p_referee_id: refereeId,
            p_tier: 'level_2_first_transaction',
            p_platform_fee: platformFee,
            p_transaction_id: transactionId
        });

        return commission.data || 0;
    },

    async awardLevel3Recurring(
        referrerId: string,
        refereeId: string,
        platformFee: number,
        transactionId: string
    ): Promise<number> {
        const commission = await supabase.rpc('calculate_tiered_commission', {
            p_referrer_id: referrerId,
            p_referee_id: refereeId,
            p_tier: 'level_3_recurring',
            p_platform_fee: platformFee,
            p_transaction_id: transactionId
        });

        return commission.data || 0;
    },

    async checkMegaBonus(userId: string): Promise<boolean> {
        // Check if user has 50+ active referrals in last 90 days
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const { data, error } = await supabase
            .from('referral_conversions')
            .select('referee_id')
            .eq('referrer_id', userId)
            .gte('created_at', ninetyDaysAgo.toISOString());

        if (error) throw error;

        const activeReferrals = new Set(data.map(c => c.referee_id)).size;

        if (activeReferrals >= REWARD_TIERS.MEGA_BONUS.threshold) {
            // Award mega bonus
            await this.awardMegaBonus(userId);
            return true;
        }

        return false;
    },

    async awardMegaBonus(userId: string): Promise<void> {
        // Check if already awarded
        const { data: existing } = await supabase
            .from('affiliate_earnings')
            .select('id')
            .eq('user_id', userId)
            .eq('source_type', 'mega_bonus')
            .limit(1);

        if (existing && existing.length > 0) return;

        // Award cash bonus
        await supabase.from('affiliate_earnings').insert({
            user_id: userId,
            amount: REWARD_TIERS.MEGA_BONUS.cash_reward,
            commission_rate: 0,
            source_type: 'mega_bonus',
            tier: 'mega_bonus',
            status: 'approved'
        });

        // Award badge
        await supabase.from('user_badges').insert({
            user_id: userId,
            badge_type: 'verified_influencer',
            badge_name: REWARD_TIERS.MEGA_BONUS.badge,
            badge_description: 'Achieved 50+ active referrals in 90 days',
            metadata: { mega_bonus: true }
        });
    },

    // Payout Management
    async requestPayout(
        userId: string,
        amount: number,
        method: PayoutRequest['method'],
        details: {
            wipay_phone?: string;
            linx_card?: string;
            bank_details?: Record<string, any>;
        }
    ): Promise<PayoutRequest> {
        // Check minimum
        if (amount < PAYOUT_CONFIG.minimum) {
            throw new Error(`Minimum payout is TTD ${PAYOUT_CONFIG.minimum}`);
        }

        // Check available balance
        const pendingEarnings = await viralLoopsService.getPendingEarnings(userId);
        if (amount > pendingEarnings) {
            throw new Error('Insufficient balance');
        }

        // Calculate fees
        const feeAmount = method === 'bank_transfer' ? PAYOUT_CONFIG.methods.bank_transfer.fee : 0;
        const netAmount = amount - feeAmount;

        // Create payout request
        const { data, error } = await supabase
            .from('payout_requests')
            .insert({
                user_id: userId,
                amount,
                method,
                wipay_phone: details.wipay_phone,
                linx_card: details.linx_card,
                bank_details: details.bank_details,
                fee_amount: feeAmount,
                net_amount: netAmount,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;
        return data as PayoutRequest;
    },

    async getPayoutHistory(userId: string): Promise<PayoutRequest[]> {
        const { data, error } = await supabase
            .from('payout_requests')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as PayoutRequest[];
    },

    // Fraud Detection
    async logReferralActivity(
        ipAddress: string,
        deviceFingerprint: string,
        referralCode: string,
        userAgent: string,
        countryCode: string
    ): Promise<void> {
        await supabase.from('referral_activity_log').insert({
            ip_address: ipAddress,
            device_fingerprint: deviceFingerprint,
            referral_code: referralCode,
            user_agent: userAgent,
            country_code: countryCode
        });
    },

    async checkVelocity(ipAddress: string): Promise<boolean> {
        const { data, error } = await supabase.rpc('check_referral_velocity', {
            p_ip_address: ipAddress
        });

        if (error) throw error;
        return data as boolean;
    },

    async flagFraud(
        userId: string,
        checkType: string,
        details: Record<string, any>
    ): Promise<void> {
        await supabase.from('fraud_checks').insert({
            user_id: userId,
            check_type: checkType,
            flagged: true,
            details
        });
    },

    async checkSelfReferral(referrerId: string, refereeId: string): Promise<boolean> {
        // Check if same user
        if (referrerId === refereeId) {
            await this.flagFraud(referrerId, 'self_referral', {
                referee_id: refereeId,
                reason: 'Same user ID'
            });
            return true;
        }

        // Check if same email domain, IP, device, etc.
        // (Implement additional checks as needed)

        return false;
    },

    // Leaderboard
    async getLeaderboard(): Promise<LeaderboardEntry[]> {
        const { data, error } = await supabase
            .from('affiliate_leaderboard')
            .select('*');

        if (error) throw error;
        return data as LeaderboardEntry[];
    },

    async refreshLeaderboard(): Promise<void> {
        await supabase.rpc('refresh_affiliate_leaderboard');
    },

    // Deep Links
    generateDeepLink(referralCode: string): string {
        return `trinibuild://ref/${referralCode}`;
    },

    generateUniversalLink(referralCode: string): string {
        return `https://trinibuild.com/ref/${referralCode}`;
    }
};
