import { supabase } from './supabaseClient';

export interface ReferralLink {
    id: string;
    user_id: string;
    referral_code: string;
    referral_url: string;
    total_clicks: number;
    total_signups: number;
    total_conversions: number;
    created_at: string;
    last_used_at?: string;
}

export interface ReferralConversion {
    id: string;
    referral_link_id: string;
    referrer_id: string;
    referee_id: string;
    conversion_type: 'signup' | 'first_listing' | 'first_sale' | 'upgrade';
    reward_amount: number;
    reward_type: 'listings' | 'credits' | 'commission' | 'upgrade';
    reward_claimed: boolean;
    conversion_value?: number;
    created_at: string;
}

export interface AffiliateEarning {
    id: string;
    user_id: string;
    amount: number;
    commission_rate: number;
    source_type: string;
    status: 'pending' | 'approved' | 'paid' | 'cancelled';
    payout_date?: string;
    created_at: string;
}

export interface ShareTracking {
    id: string;
    user_id?: string;
    content_type: 'listing' | 'website' | 'event' | 'job';
    content_id: string;
    platform: 'whatsapp' | 'facebook' | 'instagram' | 'twitter' | 'email';
    share_url: string;
    clicks: number;
    conversions: number;
}

export interface UserReferralStats {
    user_id: string;
    total_referrals: number;
    successful_referrals: number;
    total_earnings: number;
    pending_earnings: number;
    paid_earnings: number;
    bonus_listings_earned: number;
    k_factor: number;
}

export const viralLoopsService = {
    // Referral Links
    async getUserReferralLink(userId: string) {
        const { data, error } = await supabase
            .from('referral_links')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data as ReferralLink | null;
    },

    async trackReferralClick(referralCode: string) {
        const { data, error } = await supabase
            .from('referral_links')
            .update({
                total_clicks: supabase.sql`total_clicks + 1`,
                last_used_at: new Date().toISOString()
            })
            .eq('referral_code', referralCode)
            .select()
            .single();

        if (error) throw error;

        // Store in localStorage for attribution
        if (typeof window !== 'undefined') {
            localStorage.setItem('trinibuild_ref', referralCode);
            localStorage.setItem('trinibuild_ref_time', Date.now().toString());
        }

        return data as ReferralLink;
    },

    async trackReferralSignup(referralCode: string, newUserId: string) {
        // Get referral link
        const { data: refLink, error: refError } = await supabase
            .from('referral_links')
            .select('*')
            .eq('referral_code', referralCode)
            .single();

        if (refError) throw refError;

        // Update signup count
        await supabase
            .from('referral_links')
            .update({ total_signups: supabase.sql`total_signups + 1` })
            .eq('id', refLink.id);

        // Create conversion record
        const { data: conversion, error: convError } = await supabase
            .from('referral_conversions')
            .insert({
                referral_link_id: refLink.id,
                referrer_id: refLink.user_id,
                referee_id: newUserId,
                conversion_type: 'signup',
                reward_amount: 5, // 5 extra listings
                reward_type: 'listings'
            })
            .select()
            .single();

        if (convError) throw convError;

        // Clear localStorage
        if (typeof window !== 'undefined') {
            localStorage.removeItem('trinibuild_ref');
            localStorage.removeItem('trinibuild_ref_time');
        }

        return conversion as ReferralConversion;
    },

    async trackConversion(userId: string, conversionType: ReferralConversion['conversion_type'], value?: number) {
        // Check if user was referred
        const { data: conversions } = await supabase
            .from('referral_conversions')
            .select('*')
            .eq('referee_id', userId)
            .eq('conversion_type', 'signup')
            .limit(1);

        if (!conversions || conversions.length === 0) return null;

        const signupConversion = conversions[0];

        // Create new conversion
        const { data, error } = await supabase
            .from('referral_conversions')
            .insert({
                referral_link_id: signupConversion.referral_link_id,
                referrer_id: signupConversion.referrer_id,
                referee_id: userId,
                conversion_type: conversionType,
                reward_amount: value ? value * 0.1 : 0, // 10% commission
                reward_type: 'commission',
                conversion_value: value
            })
            .select()
            .single();

        if (error) throw error;

        // Create affiliate earning if there's value
        if (value && value > 0) {
            await this.createAffiliateEarning(
                signupConversion.referrer_id,
                value * 0.1,
                10,
                'referral_sale',
                data.id
            );
        }

        return data as ReferralConversion;
    },

    // Affiliate Earnings
    async createAffiliateEarning(
        userId: string,
        amount: number,
        commissionRate: number,
        sourceType: string,
        conversionId?: string
    ) {
        const { data, error } = await supabase
            .from('affiliate_earnings')
            .insert({
                user_id: userId,
                referral_conversion_id: conversionId,
                amount,
                commission_rate: commissionRate,
                source_type: sourceType,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        // Update user stats
        await supabase
            .from('user_referral_stats')
            .update({
                pending_earnings: supabase.sql`pending_earnings + ${amount}`,
                total_earnings: supabase.sql`total_earnings + ${amount}`,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

        return data as AffiliateEarning;
    },

    async getUserEarnings(userId: string) {
        const { data, error } = await supabase
            .from('affiliate_earnings')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as AffiliateEarning[];
    },

    async getPendingEarnings(userId: string) {
        const { data, error } = await supabase
            .from('affiliate_earnings')
            .select('amount')
            .eq('user_id', userId)
            .eq('status', 'pending');

        if (error) throw error;

        const total = data.reduce((sum, earning) => sum + parseFloat(earning.amount.toString()), 0);
        return total;
    },

    // Share Tracking
    async trackShare(
        userId: string | undefined,
        contentType: ShareTracking['content_type'],
        contentId: string,
        platform: ShareTracking['platform']
    ) {
        const shareUrl = this.generateShareUrl(contentType, contentId, platform, userId);

        const { data, error } = await supabase
            .from('share_tracking')
            .insert({
                user_id: userId,
                content_type: contentType,
                content_id: contentId,
                platform,
                share_url: shareUrl
            })
            .select()
            .single();

        if (error) throw error;
        return data as ShareTracking;
    },

    generateShareUrl(
        contentType: string,
        contentId: string,
        platform: string,
        userId?: string
    ): string {
        const baseUrl = 'https://trinibuild.com';
        const contentUrl = `${baseUrl}/${contentType}/${contentId}`;
        const trackingParam = userId ? `?shared_by=${userId}&platform=${platform}` : `?platform=${platform}`;

        const fullUrl = contentUrl + trackingParam;

        // Platform-specific share URLs
        switch (platform) {
            case 'whatsapp':
                return `https://wa.me/?text=${encodeURIComponent(fullUrl)}`;
            case 'facebook':
                return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`;
            case 'twitter':
                return `https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}`;
            case 'instagram':
                // Instagram doesn't support direct sharing, return the URL
                return fullUrl;
            default:
                return fullUrl;
        }
    },

    async trackShareClick(shareId: string) {
        const { error } = await supabase
            .from('share_tracking')
            .update({ clicks: supabase.sql`clicks + 1` })
            .eq('id', shareId);

        if (error) throw error;
    },

    // User Stats
    async getUserReferralStats(userId: string) {
        const { data, error } = await supabase
            .from('user_referral_stats')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data as UserReferralStats | null;
    },

    async getReferralConversions(userId: string) {
        const { data, error } = await supabase
            .from('referral_conversions')
            .select('*')
            .eq('referrer_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as ReferralConversion[];
    },

    // Viral Widgets
    async createViralWidget(userId: string, widgetType: string) {
        const widgetCode = this.generateWidgetCode(userId, widgetType);

        const { data, error } = await supabase
            .from('viral_widgets')
            .insert({
                user_id: userId,
                widget_type: widgetType,
                widget_code: widgetCode
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    generateWidgetCode(userId: string, widgetType: string): string {
        return `<div id="trinibuild-widget-${widgetType}" data-user="${userId}"></div>
<script src="https://trinibuild.com/widgets/${widgetType}.js"></script>`;
    },

    // K-Factor Calculation
    async calculateKFactor(userId: string): Promise<number> {
        const stats = await this.getUserReferralStats(userId);
        if (!stats || stats.total_referrals === 0) return 0;

        // K-Factor = (Number of invites sent per user) × (Conversion rate of invites)
        // Simplified: successful_referrals / total_referrals
        const kFactor = stats.successful_referrals / Math.max(stats.total_referrals, 1);

        // Update in database
        await supabase
            .from('user_referral_stats')
            .update({ k_factor: kFactor })
            .eq('user_id', userId);

        return kFactor;
    }
};
