-- ================================================
-- VIDEO ADS & CAMPAIGN MANAGEMENT SYSTEM
-- Migration: 40_video_ads_system.sql
-- Date: 2025-12-14
-- ================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 1. AD CAMPAIGNS TABLE (Enhanced)
-- ================================================
CREATE TABLE IF NOT EXISTS ad_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    client TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'paused', 'draft', 'ended')),
    type TEXT NOT NULL DEFAULT 'CPM' CHECK (type IN ('CPC', 'CPM', 'CPA', 'CPV')),
    
    -- Budget
    budget DECIMAL(10,2) DEFAULT 0,
    spent DECIMAL(10,2) DEFAULT 0,
    daily_budget DECIMAL(10,2),
    
    -- Performance Metrics
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    video_views INTEGER DEFAULT 0,
    video_completions INTEGER DEFAULT 0,
    
    -- Scheduling
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    
    -- Targeting
    targeting_rules JSONB DEFAULT '{}'::jsonb,
    
    -- Placements
    placements TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 2. VIDEO ADS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS video_ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    
    -- Video Details
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER, -- in seconds
    file_size BIGINT, -- in bytes
    format TEXT, -- mp4, webm, etc.
    resolution TEXT, -- 720p, 1080p, etc.
    
    -- Ad Content
    title TEXT NOT NULL,
    description TEXT,
    call_to_action TEXT,
    destination_url TEXT,
    
    -- Settings
    skippable BOOLEAN DEFAULT true,
    skip_after_seconds INTEGER DEFAULT 5,
    autoplay BOOLEAN DEFAULT true,
    muted_by_default BOOLEAN DEFAULT true,
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('active', 'paused', 'draft', 'rejected')),
    approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 3. AD PLACEMENTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS ad_placements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    
    -- Placement Details
    placement_type TEXT NOT NULL CHECK (placement_type IN ('homepage', 'directory', 'store', 'article', 'search', 'category')),
    position TEXT CHECK (position IN ('hero', 'sidebar', 'inline', 'footer', 'pre-roll', 'mid-roll', 'post-roll')),
    
    -- Targeting
    targeting_rules JSONB DEFAULT '{}'::jsonb,
    -- Example: {"age": [18, 65], "location": ["Port of Spain", "San Fernando"], "interests": ["shopping", "real estate"]}
    
    -- Priority & Rotation
    priority INTEGER DEFAULT 0,
    weight INTEGER DEFAULT 1,
    
    -- Status
    active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 4. AD ANALYTICS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS ad_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    video_ad_id UUID REFERENCES video_ads(id) ON DELETE CASCADE,
    placement_id UUID REFERENCES ad_placements(id) ON DELETE SET NULL,
    
    -- Event Details
    event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click', 'view_start', 'view_25', 'view_50', 'view_75', 'view_100', 'skip', 'mute', 'unmute', 'fullscreen', 'conversion')),
    
    -- User Context
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    
    -- Technical Details
    metadata JSONB DEFAULT '{}'::jsonb,
    -- Example: {"device": "mobile", "browser": "Chrome", "os": "Android", "location": "Port of Spain", "ip": "xxx.xxx.xxx.xxx"}
    
    -- Timestamp
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 5. AD CREATIVE VARIANTS (for A/B Testing)
-- ================================================
CREATE TABLE IF NOT EXISTS ad_creative_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    video_ad_id UUID REFERENCES video_ads(id) ON DELETE CASCADE,
    
    -- Variant Details
    variant_name TEXT NOT NULL,
    variant_type TEXT CHECK (variant_type IN ('video', 'thumbnail', 'cta', 'title')),
    
    -- A/B Test Settings
    traffic_allocation DECIMAL(5,2) DEFAULT 50.00, -- percentage
    is_control BOOLEAN DEFAULT false,
    
    -- Performance
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    
    -- Status
    active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 6. AD BUDGET TRACKING
-- ================================================
CREATE TABLE IF NOT EXISTS ad_budget_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    
    -- Transaction Details
    amount DECIMAL(10,2) NOT NULL,
    transaction_type TEXT CHECK (transaction_type IN ('charge', 'refund', 'adjustment')),
    reason TEXT,
    
    -- Balance
    balance_before DECIMAL(10,2),
    balance_after DECIMAL(10,2),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================

-- Ad Analytics Indexes
CREATE INDEX IF NOT EXISTS idx_ad_analytics_campaign ON ad_analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_analytics_video_ad ON ad_analytics(video_ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_analytics_timestamp ON ad_analytics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ad_analytics_event_type ON ad_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_ad_analytics_user ON ad_analytics(user_id);

-- Ad Campaigns Indexes
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_dates ON ad_campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_created_by ON ad_campaigns(created_by);

-- Video Ads Indexes
CREATE INDEX IF NOT EXISTS idx_video_ads_campaign ON video_ads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_video_ads_status ON video_ads(status);
CREATE INDEX IF NOT EXISTS idx_video_ads_approval ON video_ads(approval_status);

-- Ad Placements Indexes
CREATE INDEX IF NOT EXISTS idx_ad_placements_campaign ON ad_placements(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_placements_type ON ad_placements(placement_type);
CREATE INDEX IF NOT EXISTS idx_ad_placements_active ON ad_placements(active);

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

-- Enable RLS
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_creative_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_budget_logs ENABLE ROW LEVEL SECURITY;

-- Ad Campaigns Policies
CREATE POLICY "Admin can manage all campaigns" ON ad_campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can view active campaigns" ON ad_campaigns
    FOR SELECT USING (status = 'active');

-- Video Ads Policies
CREATE POLICY "Admin can manage all video ads" ON video_ads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can view approved video ads" ON video_ads
    FOR SELECT USING (approval_status = 'approved' AND status = 'active');

-- Ad Placements Policies
CREATE POLICY "Admin can manage all placements" ON ad_placements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can view active placements" ON ad_placements
    FOR SELECT USING (active = true);

-- Ad Analytics Policies
CREATE POLICY "Admin can view all analytics" ON ad_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "System can insert analytics" ON ad_analytics
    FOR INSERT WITH CHECK (true);

-- Ad Creative Variants Policies
CREATE POLICY "Admin can manage variants" ON ad_creative_variants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- Ad Budget Logs Policies
CREATE POLICY "Admin can view budget logs" ON ad_budget_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- ================================================
-- FUNCTIONS & TRIGGERS
-- ================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables
CREATE TRIGGER update_ad_campaigns_updated_at BEFORE UPDATE ON ad_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_ads_updated_at BEFORE UPDATE ON video_ads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update campaign metrics from analytics
CREATE OR REPLACE FUNCTION update_campaign_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update campaign metrics based on analytics event
    IF NEW.event_type = 'impression' THEN
        UPDATE ad_campaigns SET impressions = impressions + 1 WHERE id = NEW.campaign_id;
    ELSIF NEW.event_type = 'click' THEN
        UPDATE ad_campaigns SET clicks = clicks + 1 WHERE id = NEW.campaign_id;
    ELSIF NEW.event_type = 'conversion' THEN
        UPDATE ad_campaigns SET conversions = conversions + 1 WHERE id = NEW.campaign_id;
    ELSIF NEW.event_type = 'view_start' THEN
        UPDATE ad_campaigns SET video_views = video_views + 1 WHERE id = NEW.campaign_id;
    ELSIF NEW.event_type = 'view_100' THEN
        UPDATE ad_campaigns SET video_completions = video_completions + 1 WHERE id = NEW.campaign_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_campaign_metrics_trigger AFTER INSERT ON ad_analytics
    FOR EACH ROW EXECUTE FUNCTION update_campaign_metrics();

-- ================================================
-- INITIAL DATA (Optional)
-- ================================================

-- Insert sample campaign for testing
INSERT INTO ad_campaigns (name, client, status, type, budget, start_date, end_date)
VALUES (
    'Welcome Campaign',
    'TriniBuild',
    'draft',
    'CPM',
    1000.00,
    NOW(),
    NOW() + INTERVAL '30 days'
) ON CONFLICT DO NOTHING;

-- ================================================
-- MIGRATION COMPLETE
-- ================================================
-- Run this migration in Supabase SQL Editor
-- Tables created: 6
-- Indexes created: 13
-- RLS policies created: 11
-- Functions created: 2
-- Triggers created: 3
-- ================================================
