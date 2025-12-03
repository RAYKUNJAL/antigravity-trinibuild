-- TriniBuild Ads Manager - Foundation Schema
-- Phase 1: Core tables for advertising platform

-- =====================================================
-- ADVERTISERS
-- =====================================================
CREATE TABLE IF NOT EXISTS advertisers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    category TEXT,
    logo_url TEXT,
    website_url TEXT,
    trinibuild_store_id UUID,
    verified_status TEXT DEFAULT 'pending' CHECK (verified_status IN ('pending', 'verified', 'rejected')),
    billing_status TEXT DEFAULT 'active' CHECK (billing_status IN ('active', 'delinquent', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AD CAMPAIGNS
-- =====================================================
CREATE TABLE IF NOT EXISTS ad_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    advertiser_id UUID REFERENCES advertisers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    objective TEXT CHECK (objective IN ('views', 'calls', 'messages', 'profile_visits', 'website_clicks')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'rejected')),
    daily_budget_ttd NUMERIC(10,2),
    lifetime_budget_ttd NUMERIC(10,2),
    start_date DATE,
    end_date DATE,
    target_locations JSONB DEFAULT '[]',
    target_categories JSONB DEFAULT '[]',
    ai_recommendations_snapshot JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AD CREATIVES
-- =====================================================
CREATE TABLE IF NOT EXISTS ad_creatives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'video' CHECK (type IN ('video', 'image')),
    video_master_url TEXT,
    video_hls_url TEXT,
    thumbnail_url TEXT,
    headline TEXT,
    caption TEXT,
    cta_label TEXT,
    destination_type TEXT CHECK (destination_type IN ('store_profile', 'external_url', 'phone_call', 'message_thread')),
    destination_value TEXT,
    watermark_config JSONB DEFAULT '{}',
    review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AD PLACEMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS ad_placements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    placement_key TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    supported_formats JSONB DEFAULT '["video"]',
    max_duration_seconds INTEGER DEFAULT 30,
    frequency_cap_per_user_per_day INTEGER DEFAULT 3,
    watermark_policy JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AD EVENTS (Partitioned by day for performance)
-- =====================================================
CREATE TABLE IF NOT EXISTS ad_events (
    id BIGSERIAL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID,
    session_id TEXT,
    advertiser_id UUID REFERENCES advertisers(id),
    campaign_id UUID REFERENCES ad_campaigns(id),
    creative_id UUID REFERENCES ad_creatives(id),
    placement_key TEXT,
    event_type TEXT NOT NULL,
    event_metadata JSONB DEFAULT '{}',
    ip TEXT,
    user_agent TEXT,
    country TEXT,
    device_type TEXT CHECK (device_type IN ('mobile', 'desktop', 'tablet')),
    fraud_score NUMERIC(3,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (timestamp);

-- Create initial partitions (current month + next month)
CREATE TABLE IF NOT EXISTS ad_events_2024_12 PARTITION OF ad_events
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

CREATE TABLE IF NOT EXISTS ad_events_2025_01 PARTITION OF ad_events
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- =====================================================
-- BILLING TRANSACTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS billing_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    advertiser_id UUID REFERENCES advertisers(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES ad_campaigns(id),
    currency TEXT DEFAULT 'TTD',
    amount NUMERIC(10,2) NOT NULL,
    billing_model TEXT CHECK (billing_model IN ('cpm', 'cpc', 'flat_package')),
    units INTEGER,
    unit_label TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    provider TEXT CHECK (provider IN ('stripe', 'local_gateway', 'cash_on_delivery')),
    provider_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AI RECOMMENDATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    advertiser_id UUID REFERENCES advertisers(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES ad_campaigns(id),
    type TEXT CHECK (type IN ('script', 'caption', 'budget', 'audience', 'schedule')),
    input_payload JSONB,
    output_payload JSONB,
    model_used TEXT,
    accepted_by_user BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_advertisers_user_id ON advertisers(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_advertiser_id ON ad_campaigns(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ad_creatives_campaign_id ON ad_creatives(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_creatives_review_status ON ad_creatives(review_status);
CREATE INDEX IF NOT EXISTS idx_ad_events_timestamp ON ad_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_ad_events_campaign_id ON ad_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_events_creative_id ON ad_events(creative_id);
CREATE INDEX IF NOT EXISTS idx_ad_events_event_type ON ad_events(event_type);
CREATE INDEX IF NOT EXISTS idx_billing_transactions_advertiser_id ON billing_transactions(advertiser_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Advertisers
ALTER TABLE advertisers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Advertisers can view own profile" ON advertisers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Advertisers can update own profile" ON advertisers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create advertiser profile" ON advertisers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ad Campaigns
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Advertisers can view own campaigns" ON ad_campaigns
    FOR SELECT USING (
        advertiser_id IN (SELECT id FROM advertisers WHERE user_id = auth.uid())
    );

CREATE POLICY "Advertisers can create campaigns" ON ad_campaigns
    FOR INSERT WITH CHECK (
        advertiser_id IN (SELECT id FROM advertisers WHERE user_id = auth.uid())
    );

CREATE POLICY "Advertisers can update own campaigns" ON ad_campaigns
    FOR UPDATE USING (
        advertiser_id IN (SELECT id FROM advertisers WHERE user_id = auth.uid())
    );

-- Ad Creatives
ALTER TABLE ad_creatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Advertisers can view own creatives" ON ad_creatives
    FOR SELECT USING (
        campaign_id IN (
            SELECT id FROM ad_campaigns WHERE advertiser_id IN (
                SELECT id FROM advertisers WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Advertisers can create creatives" ON ad_creatives
    FOR INSERT WITH CHECK (
        campaign_id IN (
            SELECT id FROM ad_campaigns WHERE advertiser_id IN (
                SELECT id FROM advertisers WHERE user_id = auth.uid()
            )
        )
    );

-- Ad Placements (public read, admin write)
ALTER TABLE ad_placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active placements" ON ad_placements
    FOR SELECT USING (is_active = true);

-- Billing Transactions
ALTER TABLE billing_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Advertisers can view own transactions" ON billing_transactions
    FOR SELECT USING (
        advertiser_id IN (SELECT id FROM advertisers WHERE user_id = auth.uid())
    );

-- AI Recommendations
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Advertisers can view own recommendations" ON ai_recommendations
    FOR SELECT USING (
        advertiser_id IN (SELECT id FROM advertisers WHERE user_id = auth.uid())
    );

-- =====================================================
-- INITIAL SEED DATA: Ad Placements
-- =====================================================
INSERT INTO ad_placements (placement_key, label, description, max_duration_seconds, frequency_cap_per_user_per_day)
VALUES
    ('home_feed_video', 'Home Feed - Video Ads', 'Vertical video ads in main home feed', 30, 3),
    ('store_directory_banner', 'Store Directory - Top Banner', 'Video banner at top of store listings', 15, 2),
    ('search_results_inline', 'Search Results - Inline Video', 'Video ads within search results', 20, 2),
    ('profile_page_sidebar', 'Profile Sidebar - Promoted Video', 'Promoted video on vendor profiles', 60, 1)
ON CONFLICT (placement_key) DO NOTHING;
