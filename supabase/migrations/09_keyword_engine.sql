-- =====================================================
-- TRINIBUILD KEYWORD TRAFFIC ENGINE - DATABASE SCHEMA
-- Key: kw_engine
-- Island Keyword Intelligence System
-- =====================================================

-- 1. KEYWORD SEARCHES - Track every search
-- =====================================================
CREATE TABLE IF NOT EXISTS public.keyword_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Search details
    keyword_text TEXT NOT NULL,
    keyword_normalized TEXT NOT NULL, -- lowercase, trimmed
    search_source TEXT NOT NULL CHECK (search_source IN (
        'search_bar', 'ai_search', 'category_click', 'location_filter',
        'blog_search', 'store_search', 'job_search', 'property_search',
        'rideshare_route', 'event_search', 'service_search'
    )),
    
    -- User context
    user_id UUID REFERENCES auth.users(id),
    session_id TEXT,
    ip_hash TEXT, -- Anonymized IP for unique visitor counting
    
    -- Location context
    detected_location TEXT,
    location_slug TEXT,
    user_coordinates JSONB,
    
    -- Results context
    results_count INTEGER DEFAULT 0,
    result_vertical TEXT[], -- Which verticals had results
    clicked_result_id TEXT,
    clicked_result_type TEXT,
    time_to_click_seconds INTEGER,
    
    -- Engagement
    bounced BOOLEAN DEFAULT FALSE,
    pages_viewed_after INTEGER DEFAULT 0,
    converted BOOLEAN DEFAULT FALSE,
    conversion_type TEXT, -- 'signup', 'listing_click', 'contact', 'booking'
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes for fast lookups
    CONSTRAINT valid_keyword CHECK (LENGTH(keyword_text) > 0)
);

-- 2. KEYWORD METRICS - Aggregated daily stats
-- =====================================================
CREATE TABLE IF NOT EXISTS public.keyword_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Keyword identification
    keyword_normalized TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Volume metrics
    search_volume INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    unique_sessions INTEGER DEFAULT 0,
    
    -- Engagement metrics
    total_clicks INTEGER DEFAULT 0,
    ctr DECIMAL(5,4) DEFAULT 0, -- Click-through rate
    bounce_rate DECIMAL(5,4) DEFAULT 0,
    avg_time_on_results DECIMAL(8,2) DEFAULT 0, -- seconds
    
    -- Conversion metrics
    conversions INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,4) DEFAULT 0,
    
    -- Content metrics
    results_count_avg DECIMAL(8,2) DEFAULT 0,
    zero_result_searches INTEGER DEFAULT 0,
    
    -- Location breakdown (JSONB)
    location_breakdown JSONB DEFAULT '{}',
    -- Example: {"port_of_spain": 45, "san_fernando": 30, "chaguanas": 25}
    
    -- Top results clicked (JSONB)
    top_clicked_results JSONB DEFAULT '[]',
    
    -- Related keywords discovered
    related_keywords TEXT[] DEFAULT '{}',
    
    -- Trend indicators
    volume_change_percent DECIMAL(8,2) DEFAULT 0,
    is_rising BOOLEAN DEFAULT FALSE,
    is_falling BOOLEAN DEFAULT FALSE,
    
    -- Opportunity score
    opportunity_score INTEGER DEFAULT 50,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_keyword_date UNIQUE (keyword_normalized, date)
);

-- 3. KEYWORD GAPS - Where we need content
-- =====================================================
CREATE TABLE IF NOT EXISTS public.keyword_gaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    keyword_normalized TEXT NOT NULL,
    
    -- Gap type
    gap_type TEXT NOT NULL CHECK (gap_type IN (
        'zero_results', 'low_listings', 'no_blog_content',
        'location_gap', 'category_gap', 'service_gap'
    )),
    
    -- Metrics
    search_volume_30d INTEGER DEFAULT 0,
    current_results_count INTEGER DEFAULT 0,
    ideal_results_count INTEGER DEFAULT 10,
    gap_severity TEXT DEFAULT 'medium' CHECK (gap_severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Recommendations
    recommended_action TEXT NOT NULL,
    suggested_vertical TEXT,
    suggested_location TEXT,
    suggested_blog_title TEXT,
    suggested_listing_type TEXT,
    
    -- Status
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'ignored')),
    assigned_to UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. LOCATION KEYWORD HEATMAP - Keywords by location
-- =====================================================
CREATE TABLE IF NOT EXISTS public.location_keyword_heatmap (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    location_slug TEXT NOT NULL,
    location_name TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Top keywords for this location (JSONB array)
    top_keywords JSONB DEFAULT '[]',
    -- Example: [{"keyword": "jobs", "volume": 150}, {"keyword": "rentals", "volume": 120}]
    
    -- Rising keywords
    rising_keywords JSONB DEFAULT '[]',
    
    -- Trending categories
    trending_categories JSONB DEFAULT '[]',
    
    -- Search patterns
    peak_search_hour INTEGER, -- 0-23
    weekend_vs_weekday_ratio DECIMAL(5,2) DEFAULT 1.0,
    
    -- Aggregate metrics
    total_searches INTEGER DEFAULT 0,
    unique_keywords INTEGER DEFAULT 0,
    avg_conversion_rate DECIMAL(5,4) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_location_date UNIQUE (location_slug, date)
);

-- 5. KEYWORD ALERTS - Notifications for admins
-- =====================================================
CREATE TABLE IF NOT EXISTS public.keyword_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    alert_type TEXT NOT NULL CHECK (alert_type IN (
        'rising_keyword', 'zero_results', 'location_trend',
        'high_volume_no_content', 'seasonal_spike', 'competitor_keyword'
    )),
    
    keyword TEXT NOT NULL,
    location TEXT,
    
    -- Alert details
    message TEXT NOT NULL,
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    
    -- Metrics that triggered alert
    trigger_value DECIMAL(10,2),
    threshold_value DECIMAL(10,2),
    
    -- Status
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'viewed', 'actioned', 'dismissed')),
    viewed_at TIMESTAMPTZ,
    actioned_by UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. KEYWORD SUGGESTIONS - AI-generated recommendations
-- =====================================================
CREATE TABLE IF NOT EXISTS public.keyword_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    keyword TEXT NOT NULL,
    suggestion_type TEXT NOT NULL CHECK (suggestion_type IN (
        'blog_topic', 'landing_page', 'product_listing', 
        'service_category', 'rideshare_route', 'business_recruitment'
    )),
    
    -- Estimated metrics
    estimated_volume INTEGER DEFAULT 0,
    difficulty_score INTEGER DEFAULT 50, -- 0-100
    opportunity_score INTEGER DEFAULT 50, -- 0-100
    
    -- Recommendations
    content_recommendation TEXT,
    suggested_title TEXT,
    suggested_description TEXT,
    target_vertical TEXT,
    target_location TEXT,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'implemented')),
    implemented_at TIMESTAMPTZ,
    implemented_content_id UUID,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

-- 7. SEARCH SESSIONS - Track full search journeys
-- =====================================================
CREATE TABLE IF NOT EXISTS public.search_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    
    -- Session timeline
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    
    -- Search journey
    total_searches INTEGER DEFAULT 0,
    unique_keywords_searched INTEGER DEFAULT 0,
    keywords_searched TEXT[] DEFAULT '{}',
    
    -- Outcomes
    total_clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    final_action TEXT, -- 'signup', 'listing_view', 'contact', 'booking', 'bounce'
    
    -- Device/Location
    device_type TEXT,
    browser TEXT,
    location_detected TEXT
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_keyword_searches_keyword ON public.keyword_searches(keyword_normalized);
CREATE INDEX IF NOT EXISTS idx_keyword_searches_date ON public.keyword_searches(created_at);
CREATE INDEX IF NOT EXISTS idx_keyword_searches_source ON public.keyword_searches(search_source);
CREATE INDEX IF NOT EXISTS idx_keyword_searches_location ON public.keyword_searches(location_slug);
CREATE INDEX IF NOT EXISTS idx_keyword_metrics_date ON public.keyword_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_keyword_metrics_volume ON public.keyword_metrics(search_volume DESC);
CREATE INDEX IF NOT EXISTS idx_keyword_metrics_opportunity ON public.keyword_metrics(opportunity_score DESC);
CREATE INDEX IF NOT EXISTS idx_keyword_gaps_status ON public.keyword_gaps(status);
CREATE INDEX IF NOT EXISTS idx_keyword_alerts_status ON public.keyword_alerts(status, created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.keyword_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_keyword_heatmap ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_sessions ENABLE ROW LEVEL SECURITY;

-- Admin can read all
CREATE POLICY "Admins can read keyword data"
    ON public.keyword_searches FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can read keyword metrics"
    ON public.keyword_metrics FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage keyword gaps"
    ON public.keyword_gaps FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage keyword alerts"
    ON public.keyword_alerts FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage keyword suggestions"
    ON public.keyword_suggestions FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can read location heatmaps"
    ON public.location_keyword_heatmap FOR SELECT
    USING (auth.role() = 'authenticated');

-- Anyone can insert searches (for tracking)
CREATE POLICY "Anyone can log searches"
    ON public.keyword_searches FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- FUNCTIONS FOR ANALYTICS
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
        keyword_text,
        keyword_normalized,
        search_source,
        user_id,
        session_id,
        detected_location,
        results_count
    ) VALUES (
        p_keyword,
        LOWER(TRIM(p_keyword)),
        p_source,
        p_user_id,
        p_session_id,
        p_location,
        p_results_count
    ) RETURNING id INTO search_id;
    
    RETURN search_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update search with click
CREATE OR REPLACE FUNCTION log_search_click(
    p_search_id UUID,
    p_result_id TEXT,
    p_result_type TEXT,
    p_time_to_click INTEGER DEFAULT 0
) RETURNS void AS $$
BEGIN
    UPDATE public.keyword_searches
    SET clicked_result_id = p_result_id,
        clicked_result_type = p_result_type,
        time_to_click_seconds = p_time_to_click,
        bounced = FALSE
    WHERE id = p_search_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to aggregate daily metrics
CREATE OR REPLACE FUNCTION aggregate_keyword_metrics(p_date DATE DEFAULT CURRENT_DATE - 1)
RETURNS void AS $$
BEGIN
    INSERT INTO public.keyword_metrics (
        keyword_normalized,
        date,
        search_volume,
        unique_users,
        unique_sessions,
        total_clicks,
        ctr,
        bounce_rate,
        conversions,
        conversion_rate,
        zero_result_searches,
        location_breakdown
    )
    SELECT 
        keyword_normalized,
        p_date,
        COUNT(*) as search_volume,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT session_id) as unique_sessions,
        COUNT(clicked_result_id) as total_clicks,
        CASE WHEN COUNT(*) > 0 
            THEN COUNT(clicked_result_id)::DECIMAL / COUNT(*) 
            ELSE 0 
        END as ctr,
        CASE WHEN COUNT(*) > 0 
            THEN COUNT(*) FILTER (WHERE bounced = TRUE)::DECIMAL / COUNT(*) 
            ELSE 0 
        END as bounce_rate,
        COUNT(*) FILTER (WHERE converted = TRUE) as conversions,
        CASE WHEN COUNT(*) > 0 
            THEN COUNT(*) FILTER (WHERE converted = TRUE)::DECIMAL / COUNT(*) 
            ELSE 0 
        END as conversion_rate,
        COUNT(*) FILTER (WHERE results_count = 0) as zero_result_searches,
        jsonb_object_agg(
            COALESCE(location_slug, 'unknown'),
            location_count
        ) as location_breakdown
    FROM public.keyword_searches
    CROSS JOIN LATERAL (
        SELECT location_slug, COUNT(*) as location_count
        FROM public.keyword_searches ks2
        WHERE ks2.keyword_normalized = keyword_searches.keyword_normalized
          AND DATE(ks2.created_at) = p_date
        GROUP BY ks2.location_slug
    ) location_counts
    WHERE DATE(created_at) = p_date
    GROUP BY keyword_normalized
    ON CONFLICT (keyword_normalized, date)
    DO UPDATE SET
        search_volume = EXCLUDED.search_volume,
        unique_users = EXCLUDED.unique_users,
        total_clicks = EXCLUDED.total_clicks,
        ctr = EXCLUDED.ctr,
        bounce_rate = EXCLUDED.bounce_rate,
        conversions = EXCLUDED.conversions,
        conversion_rate = EXCLUDED.conversion_rate,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to identify keyword gaps
CREATE OR REPLACE FUNCTION identify_keyword_gaps()
RETURNS INTEGER AS $$
DECLARE
    gaps_found INTEGER := 0;
BEGIN
    -- Find high-volume zero-result keywords
    INSERT INTO public.keyword_gaps (
        keyword_normalized,
        gap_type,
        search_volume_30d,
        current_results_count,
        gap_severity,
        recommended_action
    )
    SELECT 
        keyword_normalized,
        'zero_results',
        SUM(search_volume) as volume,
        0,
        CASE 
            WHEN SUM(search_volume) > 100 THEN 'critical'
            WHEN SUM(search_volume) > 50 THEN 'high'
            WHEN SUM(search_volume) > 20 THEN 'medium'
            ELSE 'low'
        END,
        'Create content or listings for this keyword'
    FROM public.keyword_metrics
    WHERE date >= CURRENT_DATE - 30
      AND zero_result_searches > search_volume * 0.5
    GROUP BY keyword_normalized
    HAVING SUM(search_volume) >= 10
    ON CONFLICT DO NOTHING;
    
    GET DIAGNOSTICS gaps_found = ROW_COUNT;
    RETURN gaps_found;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top keywords
CREATE OR REPLACE FUNCTION get_top_keywords(
    p_days INTEGER DEFAULT 7,
    p_limit INTEGER DEFAULT 20,
    p_location TEXT DEFAULT NULL
)
RETURNS TABLE (
    keyword TEXT,
    total_volume BIGINT,
    avg_ctr DECIMAL,
    avg_conversion_rate DECIMAL,
    opportunity_score INTEGER,
    trend TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        km.keyword_normalized as keyword,
        SUM(km.search_volume)::BIGINT as total_volume,
        AVG(km.ctr) as avg_ctr,
        AVG(km.conversion_rate) as avg_conversion_rate,
        AVG(km.opportunity_score)::INTEGER as opportunity_score,
        CASE 
            WHEN bool_or(km.is_rising) THEN 'rising'
            WHEN bool_or(km.is_falling) THEN 'falling'
            ELSE 'stable'
        END as trend
    FROM public.keyword_metrics km
    WHERE km.date >= CURRENT_DATE - p_days
    GROUP BY km.keyword_normalized
    ORDER BY total_volume DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.keyword_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.keyword_gaps;
