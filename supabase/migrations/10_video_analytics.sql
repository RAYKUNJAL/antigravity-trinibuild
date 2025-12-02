-- Create Video Analytics Table
CREATE TABLE IF NOT EXISTS video_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id UUID REFERENCES video_placements(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'view', 'click', 'engagement', 'complete'
    page TEXT NOT NULL,
    section TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    metadata JSONB, -- Additional data like watch_time_seconds, device_type, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_video_analytics_video_id ON video_analytics(video_id);
CREATE INDEX IF NOT EXISTS idx_video_analytics_event_type ON video_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_video_analytics_created_at ON video_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_video_analytics_page ON video_analytics(page);

-- Enable RLS
ALTER TABLE video_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert analytics (for tracking)
CREATE POLICY "Anyone can insert analytics" ON video_analytics
    FOR INSERT
    WITH CHECK (true);

-- Policy: Authenticated users can view all analytics
CREATE POLICY "Authenticated users can view analytics" ON video_analytics
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Create a view for video performance metrics
CREATE OR REPLACE VIEW video_performance AS
SELECT 
    vp.id,
    vp.title,
    vp.page,
    vp.section,
    vp.video_url,
    COUNT(DISTINCT CASE WHEN va.event_type = 'view' THEN va.id END) as total_views,
    COUNT(DISTINCT CASE WHEN va.event_type = 'click' THEN va.id END) as total_clicks,
    COUNT(DISTINCT CASE WHEN va.event_type = 'complete' THEN va.id END) as total_completions,
    ROUND(
        (COUNT(DISTINCT CASE WHEN va.event_type = 'complete' THEN va.id END)::NUMERIC / 
         NULLIF(COUNT(DISTINCT CASE WHEN va.event_type = 'view' THEN va.id END), 0)) * 100, 
        2
    ) as completion_rate,
    AVG(
        CASE 
            WHEN va.event_type = 'engagement' AND va.metadata->>'watch_time_seconds' IS NOT NULL 
            THEN (va.metadata->>'watch_time_seconds')::NUMERIC 
        END
    ) as avg_watch_time_seconds,
    MAX(va.created_at) as last_viewed_at
FROM video_placements vp
LEFT JOIN video_analytics va ON vp.id = va.video_id
WHERE vp.active = true
GROUP BY vp.id, vp.title, vp.page, vp.section, vp.video_url;

-- Grant access to the view
GRANT SELECT ON video_performance TO authenticated;
