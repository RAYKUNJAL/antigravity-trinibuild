import { supabase } from '../lib/supabase';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface Advertiser {
    id: string;
    user_id: string;
    business_name: string;
    category?: string;
    logo_url?: string;
    website_url?: string;
    trinibuild_store_id?: string;
    verified_status: 'pending' | 'verified' | 'rejected';
    billing_status: 'active' | 'delinquent' | 'suspended';
    created_at: string;
    updated_at: string;
}

export interface AdCampaign {
    id?: string;
    advertiser_id: string;
    name: string;
    objective: 'views' | 'calls' | 'messages' | 'profile_visits' | 'website_clicks';
    status: 'draft' | 'active' | 'paused' | 'completed' | 'rejected';
    daily_budget_ttd?: number;
    lifetime_budget_ttd?: number;
    start_date?: string;
    end_date?: string;
    target_locations?: string[];
    target_categories?: string[];
    ai_recommendations_snapshot?: any;
    created_at?: string;
    updated_at?: string;
}

export interface AdCreative {
    id?: string;
    campaign_id: string;
    type: 'video' | 'image';
    video_master_url?: string;
    video_hls_url?: string;
    thumbnail_url?: string;
    headline?: string;
    caption?: string;
    cta_label?: string;
    destination_type?: 'store_profile' | 'external_url' | 'phone_call' | 'message_thread';
    destination_value?: string;
    watermark_config?: WatermarkConfig;
    review_status: 'pending' | 'approved' | 'rejected';
    rejection_reason?: string;
    created_at?: string;
    updated_at?: string;
}

export interface WatermarkConfig {
    trinibuild_enabled: boolean;
    trinibuild_opacity: number;
    trinibuild_position: 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';
    vendor_enabled: boolean;
    vendor_logo_url?: string;
    vendor_opacity: number;
    vendor_position: string;
}

export interface AdEvent {
    event_type: string;
    timestamp: string;
    creative_id: string;
    campaign_id: string;
    placement_key: string;
    session_id: string;
    user_id?: string;
    playhead_position_ms?: number;
    muted?: boolean;
    network_type?: string;
    viewport_percentage?: number;
    device_type?: 'mobile' | 'desktop' | 'tablet';
}

export interface BillingTransaction {
    id?: string;
    advertiser_id: string;
    campaign_id?: string;
    currency: string;
    amount: number;
    billing_model: 'cpm' | 'cpc' | 'flat_package';
    units?: number;
    unit_label?: string;
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    provider?: 'stripe' | 'local_gateway' | 'cash_on_delivery';
    provider_reference?: string;
    created_at?: string;
}

export interface CampaignAnalytics {
    campaign_id: string;
    impressions: number;
    views: number;
    completions: number;
    ctr: number;
    avg_watch_time_seconds: number;
    total_spend_ttd: number;
    cost_per_view: number;
}

// =====================================================
// ADVERTISER SERVICE
// =====================================================

export const advertiserService = {
    async createProfile(data: Omit<Advertiser, 'id' | 'created_at' | 'updated_at'>): Promise<Advertiser> {
        const { data: advertiser, error } = await supabase
            .from('advertisers')
            .insert([data])
            .select()
            .single();

        if (error) throw error;
        return advertiser;
    },

    async getProfile(userId: string): Promise<Advertiser | null> {
        const { data, error } = await supabase
            .from('advertisers')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    async updateProfile(id: string, updates: Partial<Advertiser>): Promise<Advertiser> {
        const { data, error } = await supabase
            .from('advertisers')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

// =====================================================
// CAMPAIGN SERVICE
// =====================================================

export const campaignService = {
    async create(campaign: AdCampaign): Promise<AdCampaign> {
        const { data, error } = await supabase
            .from('ad_campaigns')
            .insert([campaign])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getAll(advertiserId: string): Promise<AdCampaign[]> {
        const { data, error } = await supabase
            .from('ad_campaigns')
            .select('*')
            .eq('advertiser_id', advertiserId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getById(id: string): Promise<AdCampaign> {
        const { data, error } = await supabase
            .from('ad_campaigns')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<AdCampaign>): Promise<AdCampaign> {
        const { data, error } = await supabase
            .from('ad_campaigns')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateStatus(id: string, status: AdCampaign['status']): Promise<AdCampaign> {
        return this.update(id, { status });
    }
};

// =====================================================
// CREATIVE SERVICE
// =====================================================

export const creativeService = {
    async create(creative: AdCreative): Promise<AdCreative> {
        const { data, error } = await supabase
            .from('ad_creatives')
            .insert([creative])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getByCampaign(campaignId: string): Promise<AdCreative[]> {
        const { data, error } = await supabase
            .from('ad_creatives')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async updateReviewStatus(
        id: string,
        review_status: AdCreative['review_status'],
        rejection_reason?: string
    ): Promise<AdCreative> {
        const { data, error } = await supabase
            .from('ad_creatives')
            .update({
                review_status,
                rejection_reason: rejection_reason || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

// =====================================================
// EVENT TRACKING SERVICE
// =====================================================

export const eventTrackingService = {
    async track(event: AdEvent): Promise<void> {
        const enrichedEvent = {
            ...event,
            timestamp: new Date().toISOString(),
            device_type: this.getDeviceType(),
            user_agent: navigator.userAgent
        };

        const { error } = await supabase
            .from('ad_events')
            .insert([enrichedEvent]);

        if (error) {
            console.error('Failed to track event:', error);
            // Don't throw - tracking should be non-blocking
        }
    },

    getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
        const ua = navigator.userAgent;
        if (/tablet|ipad/i.test(ua)) return 'tablet';
        if (/mobile|android/i.test(ua)) return 'mobile';
        return 'desktop';
    },

    // Batch tracking for performance
    async trackBatch(events: AdEvent[]): Promise<void> {
        const enrichedEvents = events.map(event => ({
            ...event,
            timestamp: new Date().toISOString(),
            device_type: this.getDeviceType(),
            user_agent: navigator.userAgent
        }));

        const { error } = await supabase
            .from('ad_events')
            .insert(enrichedEvents);

        if (error) {
            console.error('Failed to track batch events:', error);
        }
    }
};

// =====================================================
// ANALYTICS SERVICE
// =====================================================

export const analyticsService = {
    async getCampaignSummary(campaignId: string, from?: string, to?: string): Promise<CampaignAnalytics> {
        // This would typically call a database function or aggregate query
        // For now, we'll use a simplified approach
        const { data: events, error } = await supabase
            .from('ad_events')
            .select('*')
            .eq('campaign_id', campaignId);

        if (error) throw error;

        const impressions = events?.filter(e => e.event_type === 'impression').length || 0;
        const plays = events?.filter(e => e.event_type === 'play').length || 0;
        const completions = events?.filter(e => e.event_type === 'completed').length || 0;
        const ctaClicks = events?.filter(e => e.event_type === 'cta_click').length || 0;

        return {
            campaign_id: campaignId,
            impressions,
            views: plays,
            completions,
            ctr: impressions > 0 ? (ctaClicks / impressions) * 100 : 0,
            avg_watch_time_seconds: 0, // Would calculate from playhead_position_ms
            total_spend_ttd: 0, // Would fetch from billing_transactions
            cost_per_view: 0
        };
    },

    async getCreativePerformance(creativeId: string) {
        const { data: events, error } = await supabase
            .from('ad_events')
            .select('*')
            .eq('creative_id', creativeId);

        if (error) throw error;

        return {
            creative_id: creativeId,
            impressions: events?.filter(e => e.event_type === 'impression').length || 0,
            views: events?.filter(e => e.event_type === 'play').length || 0,
            avg_completion_rate: this.calculateCompletionRate(events || [])
        };
    },

    calculateCompletionRate(events: any[]): number {
        const plays = events.filter(e => e.event_type === 'play').length;
        const completions = events.filter(e => e.event_type === 'completed').length;
        return plays > 0 ? (completions / plays) * 100 : 0;
    }
};

// =====================================================
// BILLING SERVICE
// =====================================================

export const billingService = {
    async createTransaction(transaction: BillingTransaction): Promise<BillingTransaction> {
        const { data, error } = await supabase
            .from('billing_transactions')
            .insert([transaction])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getTransactions(advertiserId: string): Promise<BillingTransaction[]> {
        const { data, error } = await supabase
            .from('billing_transactions')
            .select('*')
            .eq('advertiser_id', advertiserId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async updateTransactionStatus(
        id: string,
        status: BillingTransaction['status'],
        provider_reference?: string
    ): Promise<BillingTransaction> {
        const { data, error } = await supabase
            .from('billing_transactions')
            .update({ status, provider_reference })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
