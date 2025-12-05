-- =====================================================
-- TRINIBUILD AI OS - COMPLETE MIGRATION SCRIPT
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PART 1: KEYWORD ENGINE TABLES
-- =====================================================

-- 1.1 Keyword Searches
CREATE TABLE IF NOT EXISTS public.keyword_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword_text TEXT NOT NULL,
    keyword_normalized TEXT NOT NULL,
    search_source TEXT NOT NULL CHECK (search_source IN (
        'search_bar', 'ai_search', 'category_click', 'location_filter',
        'blog_search', 'store_search', 'job_search', 'property_search',
        'rideshare_route', 'event_search', 'service_search'
    )),
    user_id UUID REFERENCES auth.users(id),
    session_id TEXT,
    ip_hash TEXT,
    detected_location TEXT,
    location_slug TEXT,
    user_coordinates JSONB,
    results_count INTEGER DEFAULT 0,
    result_vertical TEXT[],
    clicked_result_id TEXT,
    clicked_result_type TEXT,
    time_to_click_seconds INTEGER,
    bounced BOOLEAN DEFAULT FALSE,
    pages_viewed_after INTEGER DEFAULT 0,
    converted BOOLEAN DEFAULT FALSE,
    conversion_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_keyword CHECK (LENGTH(keyword_text) > 0)
);

-- 1.2 Keyword Metrics
CREATE TABLE IF NOT EXISTS public.keyword_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword_normalized TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    search_volume INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    unique_sessions INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    ctr DECIMAL(5,4) DEFAULT 0,
    bounce_rate DECIMAL(5,4) DEFAULT 0,
    avg_time_on_results DECIMAL(8,2) DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,4) DEFAULT 0,
    results_count_avg DECIMAL(8,2) DEFAULT 0,
    zero_result_searches INTEGER DEFAULT 0,
    location_breakdown JSONB DEFAULT '{}',
    top_clicked_results JSONB DEFAULT '[]',
    related_keywords TEXT[] DEFAULT '{}',
    volume_change_percent DECIMAL(8,2) DEFAULT 0,
    is_rising BOOLEAN DEFAULT FALSE,
    is_falling BOOLEAN DEFAULT FALSE,
    opportunity_score INTEGER DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_keyword_date UNIQUE (keyword_normalized, date)
);

-- 1.3 Keyword Gaps
CREATE TABLE IF NOT EXISTS public.keyword_gaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword_normalized TEXT NOT NULL,
    gap_type TEXT NOT NULL CHECK (gap_type IN (
        'zero_results', 'low_listings', 'no_blog_content',
        'location_gap', 'category_gap', 'service_gap'
    )),
    search_volume_30d INTEGER DEFAULT 0,
    current_results_count INTEGER DEFAULT 0,
    ideal_results_count INTEGER DEFAULT 10,
    gap_severity TEXT DEFAULT 'medium' CHECK (gap_severity IN ('low', 'medium', 'high', 'critical')),
    recommended_action TEXT NOT NULL,
    suggested_vertical TEXT,
    suggested_location TEXT,
    suggested_blog_title TEXT,
    suggested_listing_type TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'ignored')),
    assigned_to UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.4 Location Keyword Heatmap
CREATE TABLE IF NOT EXISTS public.location_keyword_heatmap (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_slug TEXT NOT NULL,
    location_name TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    top_keywords JSONB DEFAULT '[]',
    rising_keywords JSONB DEFAULT '[]',
    trending_categories JSONB DEFAULT '[]',
    peak_search_hour INTEGER,
    weekend_vs_weekday_ratio DECIMAL(5,2) DEFAULT 1.0,
    total_searches INTEGER DEFAULT 0,
    unique_keywords INTEGER DEFAULT 0,
    avg_conversion_rate DECIMAL(5,4) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_location_date UNIQUE (location_slug, date)
);

-- 1.5 Keyword Alerts
CREATE TABLE IF NOT EXISTS public.keyword_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type TEXT NOT NULL CHECK (alert_type IN (
        'rising_keyword', 'zero_results', 'location_trend',
        'high_volume_no_content', 'seasonal_spike', 'competitor_keyword'
    )),
    keyword TEXT NOT NULL,
    location TEXT,
    message TEXT NOT NULL,
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    trigger_value DECIMAL(10,2),
    threshold_value DECIMAL(10,2),
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'viewed', 'actioned', 'dismissed')),
    viewed_at TIMESTAMPTZ,
    actioned_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.6 Keyword Suggestions
CREATE TABLE IF NOT EXISTS public.keyword_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword TEXT NOT NULL,
    suggestion_type TEXT NOT NULL CHECK (suggestion_type IN (
        'blog_topic', 'landing_page', 'product_listing', 
        'service_category', 'rideshare_route', 'business_recruitment'
    )),
    estimated_volume INTEGER DEFAULT 0,
    difficulty_score INTEGER DEFAULT 50,
    opportunity_score INTEGER DEFAULT 50,
    content_recommendation TEXT,
    suggested_title TEXT,
    suggested_description TEXT,
    target_vertical TEXT,
    target_location TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'implemented')),
    implemented_at TIMESTAMPTZ,
    implemented_content_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

-- 1.7 Search Sessions
CREATE TABLE IF NOT EXISTS public.search_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    total_searches INTEGER DEFAULT 0,
    unique_keywords_searched INTEGER DEFAULT 0,
    keywords_searched TEXT[] DEFAULT '{}',
    total_clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    final_action TEXT,
    device_type TEXT,
    browser TEXT,
    location_detected TEXT
);

-- =====================================================
-- PART 2: TRUST SCORE TABLES
-- =====================================================

-- 2.1 Trust Scores
CREATE TABLE IF NOT EXISTS public.trust_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 50 CHECK (score >= 0 AND score <= 100),
    verification_level INTEGER DEFAULT 0 CHECK (verification_level >= 0 AND verification_level <= 3),
    transaction_score INTEGER DEFAULT 50,
    performance_score INTEGER DEFAULT 50,
    review_score INTEGER DEFAULT 50,
    profile_score INTEGER DEFAULT 50,
    age_score INTEGER DEFAULT 10,
    total_transactions INTEGER DEFAULT 0,
    successful_transactions INTEGER DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    avg_rating DECIMAL(3,2),
    disputes_filed INTEGER DEFAULT 0,
    disputes_against INTEGER DEFAULT 0,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    id_verified BOOLEAN DEFAULT FALSE,
    address_verified BOOLEAN DEFAULT FALSE,
    business_verified BOOLEAN DEFAULT FALSE,
    profile_completeness INTEGER DEFAULT 0,
    account_age_days INTEGER DEFAULT 0,
    last_active_days INTEGER DEFAULT 0,
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    is_suspended BOOLEAN DEFAULT FALSE,
    suspension_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_trust UNIQUE (user_id)
);

-- 2.2 Trust Score History
CREATE TABLE IF NOT EXISTS public.trust_score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    old_score INTEGER,
    new_score INTEGER NOT NULL,
    change_reason TEXT NOT NULL,
    change_type TEXT NOT NULL CHECK (change_type IN (
        'transaction', 'review', 'verification', 'dispute',
        'profile_update', 'activity', 'admin_action', 'penalty', 'bonus'
    )),
    related_entity_type TEXT,
    related_entity_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 Verification Requests
CREATE TABLE IF NOT EXISTS public.verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    verification_type TEXT NOT NULL CHECK (verification_type IN (
        'email', 'phone', 'national_id', 'drivers_license',
        'passport', 'address', 'business'
    )),
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'approved', 'rejected', 'expired'
    )),
    document_urls TEXT[],
    submitted_data JSONB,
    reviewed_by UUID REFERENCES auth.users(id),
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

-- 2.4 Trust Badges
CREATE TABLE IF NOT EXISTS public.trust_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_type TEXT NOT NULL CHECK (badge_type IN (
        'verified_seller', 'top_rated', 'quick_responder',
        'trusted_buyer', 'power_user', 'community_helper',
        'early_adopter', 'superhost', 'expert_provider'
    )),
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'
);

-- =====================================================
-- PART 3: LANDING PAGES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.landing_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vertical TEXT NOT NULL CHECK (vertical IN (
        'jobs', 'real_estate', 'services', 'events', 'marketplace', 'rideshare'
    )),
    location_slug TEXT NOT NULL,
    location_name TEXT NOT NULL,
    keyword TEXT NOT NULL,
    url_slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    meta_description TEXT NOT NULL,
    h1 TEXT NOT NULL,
    intro_paragraph TEXT,
    benefits_section JSONB DEFAULT '[]',
    faq_section JSONB DEFAULT '[]',
    local_context TEXT,
    cta_text TEXT,
    related_listings UUID[] DEFAULT '{}',
    related_blogs UUID[] DEFAULT '{}',
    schema_type TEXT DEFAULT 'WebPage',
    schema_data JSONB DEFAULT '{}',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    auto_generated BOOLEAN DEFAULT TRUE,
    manually_edited BOOLEAN DEFAULT FALSE,
    views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,4) DEFAULT 0,
    avg_time_on_page INTEGER DEFAULT 0,
    google_indexed BOOLEAN DEFAULT FALSE,
    google_position INTEGER,
    last_crawled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    CONSTRAINT unique_vertical_location_keyword UNIQUE (vertical, location_slug, keyword)
);

CREATE TABLE IF NOT EXISTS public.landing_page_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vertical TEXT NOT NULL,
    template_name TEXT NOT NULL,
    title_template TEXT NOT NULL,
    h1_template TEXT NOT NULL,
    meta_template TEXT NOT NULL,
    intro_template TEXT,
    cta_template TEXT,
    default_benefits JSONB DEFAULT '[]',
    default_faq_questions TEXT[] DEFAULT '{}',
    schema_type TEXT DEFAULT 'WebPage',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.landing_page_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL REFERENCES public.landing_pages(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    ctr DECIMAL(5,4) DEFAULT 0,
    bounce_rate DECIMAL(5,4) DEFAULT 0,
    avg_time_on_page INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,4) DEFAULT 0,
    traffic_sources JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_page_date UNIQUE (page_id, date)
);

-- =====================================================
-- PART 4: AI SYSTEMS
-- =====================================================

-- 4.1 Smart Notifications
CREATE TABLE IF NOT EXISTS public.smart_notifications (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    channels TEXT[] DEFAULT '{}',
    action_url TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    clicked BOOLEAN DEFAULT FALSE,
    clicked_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.2 Notification Preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    push_enabled BOOLEAN DEFAULT TRUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    whatsapp_enabled BOOLEAN DEFAULT FALSE,
    job_alerts BOOLEAN DEFAULT TRUE,
    property_alerts BOOLEAN DEFAULT TRUE,
    price_alerts BOOLEAN DEFAULT TRUE,
    message_notifications BOOLEAN DEFAULT TRUE,
    order_updates BOOLEAN DEFAULT TRUE,
    promotional BOOLEAN DEFAULT TRUE,
    quiet_hours_start TEXT,
    quiet_hours_end TEXT,
    preferred_time TEXT,
    digest_frequency TEXT DEFAULT 'immediate' CHECK (digest_frequency IN ('immediate', 'hourly', 'daily', 'weekly')),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.3 Social Posts
CREATE TABLE IF NOT EXISTS public.social_posts (
    id TEXT PRIMARY KEY,
    platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'whatsapp')),
    content_type TEXT NOT NULL,
    text TEXT NOT NULL,
    hashtags TEXT[] DEFAULT '{}',
    emoji_text TEXT,
    image_prompt TEXT,
    video_script TEXT,
    carousel_items JSONB DEFAULT '[]',
    source_id TEXT,
    source_type TEXT,
    scheduled_for TIMESTAMPTZ,
    posted_at TIMESTAMPTZ,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posted', 'failed')),
    impressions INTEGER DEFAULT 0,
    engagements INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.4 Site Alerts
CREATE TABLE IF NOT EXISTS public.site_alerts (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL CHECK (category IN ('performance', 'content', 'security', 'spam', 'quality', 'seo', 'availability', 'database')),
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    auto_fixable BOOLEAN DEFAULT FALSE,
    fix_applied BOOLEAN DEFAULT FALSE,
    fix_result TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'resolved', 'ignored')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 4.5 Content Quality Reports
CREATE TABLE IF NOT EXISTS public.content_quality_reports (
    id TEXT PRIMARY KEY,
    content_type TEXT NOT NULL,
    content_id TEXT NOT NULL,
    quality_score INTEGER DEFAULT 100 CHECK (quality_score >= 0 AND quality_score <= 100),
    issues TEXT[] DEFAULT '{}',
    suggestions TEXT[] DEFAULT '{}',
    auto_fixed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.6 User Activity
CREATE TABLE IF NOT EXISTS public.user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('view', 'click', 'search', 'save', 'share', 'apply', 'book')),
    item_type TEXT,
    item_id TEXT,
    search_query TEXT,
    results_count INTEGER,
    context TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.7 User Preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_locations TEXT[] DEFAULT '{}',
    preferred_categories TEXT[] DEFAULT '{}',
    price_range_min INTEGER,
    price_range_max INTEGER,
    job_types TEXT[] DEFAULT '{}',
    property_types TEXT[] DEFAULT '{}',
    event_types TEXT[] DEFAULT '{}',
    interests TEXT[] DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_keyword_searches_keyword ON public.keyword_searches(keyword_normalized);
CREATE INDEX IF NOT EXISTS idx_keyword_searches_date ON public.keyword_searches(created_at);
CREATE INDEX IF NOT EXISTS idx_keyword_metrics_date ON public.keyword_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_keyword_gaps_status ON public.keyword_gaps(status);
CREATE INDEX IF NOT EXISTS idx_trust_scores_user ON public.trust_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_trust_scores_score ON public.trust_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_landing_pages_vertical ON public.landing_pages(vertical);
CREATE INDEX IF NOT EXISTS idx_landing_pages_url ON public.landing_pages(url_slug);
CREATE INDEX IF NOT EXISTS idx_smart_notif_user ON public.smart_notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_user ON public.user_activity(user_id, created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.keyword_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_page_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_page_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES
-- =====================================================

-- Keyword tables - admin access
CREATE POLICY "Admins can read keyword data" ON public.keyword_searches FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can read keyword metrics" ON public.keyword_metrics FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage keyword gaps" ON public.keyword_gaps FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage keyword alerts" ON public.keyword_alerts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage keyword suggestions" ON public.keyword_suggestions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Anyone can log searches" ON public.keyword_searches FOR INSERT WITH CHECK (true);

-- Trust scores - public read, user update own
CREATE POLICY "Trust scores are public" ON public.trust_scores FOR SELECT USING (true);
CREATE POLICY "Users update own trust" ON public.trust_scores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Trust badges are public" ON public.trust_badges FOR SELECT USING (true);

-- User-specific data
CREATE POLICY "Users manage own notifications" ON public.smart_notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own preferences" ON public.notification_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own user_preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);

-- Activity tracking
CREATE POLICY "Users see own activity" ON public.user_activity FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Anyone can insert activity" ON public.user_activity FOR INSERT WITH CHECK (true);

-- Landing pages - public read
CREATE POLICY "Published landing pages are public" ON public.landing_pages FOR SELECT USING (status = 'published');
CREATE POLICY "Admin full access to landing pages" ON public.landing_pages FOR ALL USING (auth.role() = 'authenticated');

-- Admin tables
CREATE POLICY "Admin access to social posts" ON public.social_posts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin access to site alerts" ON public.site_alerts FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to log a search
CREATE OR REPLACE FUNCTION log_keyword_search(
    p_keyword TEXT,
    p_source TEXT,
    p_user_id UUID DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_location TEXT DEFAULT NULL,
    p_results_count INTEGER DEFAULT 0
) RETURNS UUID AS $$
DECLARE
    search_id UUID;
BEGIN
    INSERT INTO public.keyword_searches (
        keyword_text, keyword_normalized, search_source,
        user_id, session_id, detected_location, results_count
    ) VALUES (
        p_keyword, LOWER(TRIM(p_keyword)), p_source,
        p_user_id, p_session_id, p_location, p_results_count
    ) RETURNING id INTO search_id;
    RETURN search_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment landing page views
CREATE OR REPLACE FUNCTION increment_landing_page_views(page_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.landing_pages SET views = views + 1, updated_at = NOW() WHERE id = page_id;
    INSERT INTO public.landing_page_analytics (page_id, date, views)
    VALUES (page_id, CURRENT_DATE, 1)
    ON CONFLICT (page_id, date) DO UPDATE SET views = landing_page_analytics.views + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate trust score
CREATE OR REPLACE FUNCTION calculate_trust_score(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_score INTEGER := 50;
    v_transaction_score INTEGER;
    v_review_score INTEGER;
    v_profile_score INTEGER;
    v_verification_bonus INTEGER := 0;
BEGIN
    SELECT 
        COALESCE(transaction_score, 50),
        COALESCE(review_score, 50),
        COALESCE(profile_completeness, 0)
    INTO v_transaction_score, v_review_score, v_profile_score
    FROM public.trust_scores WHERE user_id = p_user_id;
    
    IF v_transaction_score IS NULL THEN
        RETURN 50;
    END IF;
    
    SELECT 
        CASE WHEN email_verified THEN 5 ELSE 0 END +
        CASE WHEN phone_verified THEN 10 ELSE 0 END +
        CASE WHEN id_verified THEN 15 ELSE 0 END +
        CASE WHEN address_verified THEN 10 ELSE 0 END
    INTO v_verification_bonus
    FROM public.trust_scores WHERE user_id = p_user_id;
    
    v_score := (v_transaction_score * 0.3 + v_review_score * 0.3 + v_profile_score * 0.2 + v_verification_bonus)::INTEGER;
    v_score := GREATEST(0, LEAST(100, v_score));
    
    UPDATE public.trust_scores SET score = v_score, updated_at = NOW() WHERE user_id = p_user_id;
    
    RETURN v_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMPLETE! Run this script in Supabase SQL Editor
-- =====================================================
