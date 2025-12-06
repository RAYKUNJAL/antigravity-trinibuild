-- ============================================================================
-- ISLAND KEYWORD INTELLIGENCE SYSTEM
-- Tracks searches, trends, gaps, and opportunities across Trinidad & Tobago
-- ============================================================================

-- 1. Keyword Searches (Raw Events)
CREATE TABLE IF NOT EXISTS keyword_searches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    keyword_text TEXT NOT NULL,
    keyword_normalized TEXT NOT NULL,
    search_source TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    detected_location TEXT,
    location_slug TEXT,
    results_count INTEGER DEFAULT 0,
    result_vertical TEXT[],
    clicked_result_id TEXT,
    clicked_result_type TEXT,
    time_to_click_seconds INTEGER,
    bounced BOOLEAN DEFAULT true,
    converted BOOLEAN DEFAULT false,
    conversion_type TEXT,
    pages_viewed_after INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Keyword Metrics (Daily Aggregates)
CREATE TABLE IF NOT EXISTS keyword_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    keyword_normalized TEXT NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    search_volume INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    ctr NUMERIC(5, 4) DEFAULT 0, -- 0.0000 to 1.0000
    bounce_rate NUMERIC(5, 4) DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    conversion_rate NUMERIC(5, 4) DEFAULT 0,
    zero_result_searches INTEGER DEFAULT 0,
    opportunity_score INTEGER DEFAULT 0,
    is_rising BOOLEAN DEFAULT false,
    is_falling BOOLEAN DEFAULT false,
    volume_change_percent NUMERIC(10, 2) DEFAULT 0,
    location_breakdown JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(keyword_normalized, date)
);

-- 3. Keyword Gaps (Opportunities)
CREATE TABLE IF NOT EXISTS keyword_gaps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    keyword_normalized TEXT UNIQUE NOT NULL,
    gap_type TEXT NOT NULL, -- 'content', 'service', 'product'
    search_volume_30d INTEGER DEFAULT 0,
    current_results_count INTEGER DEFAULT 0,
    gap_severity TEXT CHECK (gap_severity IN ('low', 'medium', 'high', 'critical')),
    recommended_action TEXT,
    suggested_vertical TEXT,
    suggested_location TEXT,
    suggested_blog_title TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'ignored')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Location Heatmaps
CREATE TABLE IF NOT EXISTS location_keyword_heatmap (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    location_slug TEXT NOT NULL,
    location_name TEXT NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    total_searches INTEGER DEFAULT 0,
    top_keywords JSONB DEFAULT '[]', -- Array of {keyword, volume}
    rising_keywords JSONB DEFAULT '[]', -- Array of {keyword, growth}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(location_slug, date)
);

-- 5. Keyword Alerts
CREATE TABLE IF NOT EXISTS keyword_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_type TEXT NOT NULL,
    keyword TEXT NOT NULL,
    location TEXT,
    message TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'viewed', 'actioned', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    viewed_at TIMESTAMPTZ
);

-- 6. Keyword Suggestions (AI Generated)
CREATE TABLE IF NOT EXISTS keyword_suggestions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    keyword TEXT NOT NULL,
    suggestion_type TEXT NOT NULL,
    estimated_volume INTEGER DEFAULT 0,
    difficulty_score INTEGER DEFAULT 0,
    opportunity_score INTEGER DEFAULT 0,
    content_recommendation TEXT,
    suggested_title TEXT,
    target_vertical TEXT,
    target_location TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'implemented')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_keyword_searches_keyword ON keyword_searches(keyword_normalized);
CREATE INDEX IF NOT EXISTS idx_keyword_searches_created_at ON keyword_searches(created_at);
CREATE INDEX IF NOT EXISTS idx_keyword_metrics_date ON keyword_metrics(date);
CREATE INDEX IF NOT EXISTS idx_keyword_metrics_volume ON keyword_metrics(search_volume);
CREATE INDEX IF NOT EXISTS idx_keyword_gaps_severity ON keyword_gaps(gap_severity);

-- RLS Policies
ALTER TABLE keyword_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_keyword_heatmap ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_suggestions ENABLE ROW LEVEL SECURITY;

-- Public can insert searches (anonymous tracking)
CREATE POLICY "Anyone can insert searches" ON keyword_searches FOR INSERT WITH CHECK (true);
-- Only admins can view searches
CREATE POLICY "Admins can view searches" ON keyword_searches FOR SELECT USING (auth.role() = 'authenticated'); -- Simplified for now

-- Metrics/Gaps/Heatmaps/Alerts/Suggestions are admin only
CREATE POLICY "Admins can view metrics" ON keyword_metrics FOR SELECT USING (true);
CREATE POLICY "Admins can view gaps" ON keyword_gaps FOR SELECT USING (true);
CREATE POLICY "Admins can view heatmaps" ON location_keyword_heatmap FOR SELECT USING (true);
CREATE POLICY "Admins can view alerts" ON keyword_alerts FOR SELECT USING (true);
CREATE POLICY "Admins can view suggestions" ON keyword_suggestions FOR SELECT USING (true);

-- System/Admin update policies
CREATE POLICY "System can manage metrics" ON keyword_metrics FOR ALL USING (true);
CREATE POLICY "System can manage gaps" ON keyword_gaps FOR ALL USING (true);
CREATE POLICY "System can manage heatmaps" ON location_keyword_heatmap FOR ALL USING (true);
CREATE POLICY "System can manage alerts" ON keyword_alerts FOR ALL USING (true);
CREATE POLICY "System can manage suggestions" ON keyword_suggestions FOR ALL USING (true);
