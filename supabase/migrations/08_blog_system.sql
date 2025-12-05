-- =====================================================
-- TRINIBUILD AI BLOG SYSTEM - COMPLETE DATABASE SCHEMA
-- =====================================================
-- This migration creates all tables needed for the 
-- automated AI-driven SEO blog generation system.
-- =====================================================

-- 1. BLOGS TABLE - Stores all generated blog posts
-- =====================================================
CREATE TABLE IF NOT EXISTS public.blogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Location Info
    location_name TEXT NOT NULL,
    location_slug TEXT NOT NULL,
    region TEXT NOT NULL,
    island TEXT NOT NULL CHECK (island IN ('Trinidad', 'Tobago')),
    
    -- Vertical Info
    vertical_key TEXT NOT NULL CHECK (vertical_key IN ('jobs', 'stores', 'tickets', 'real_estate', 'rideshare', 'combo')),
    vertical_label TEXT NOT NULL,
    
    -- SEO Fields
    seo_title TEXT NOT NULL,
    meta_description TEXT NOT NULL,
    url_slug TEXT UNIQUE NOT NULL,
    primary_keyword TEXT NOT NULL,
    secondary_keywords TEXT[] DEFAULT '{}',
    
    -- Content
    h1 TEXT NOT NULL,
    headings TEXT[] DEFAULT '{}',
    body_markdown TEXT NOT NULL,
    body_html TEXT NOT NULL,
    excerpt TEXT,
    featured_image TEXT,
    
    -- CTAs & Links (stored as JSONB)
    cta_blocks JSONB DEFAULT '[]',
    internal_links_used JSONB DEFAULT '[]',
    
    -- Metadata
    word_count INTEGER NOT NULL DEFAULT 0,
    reading_time_minutes INTEGER NOT NULL DEFAULT 0,
    tone_variant TEXT DEFAULT 'default' CHECK (tone_variant IN ('default', 'more_trini')),
    
    -- SEO Structured Data (stored as JSONB)
    schema_org JSONB DEFAULT '{}',
    open_graph JSONB DEFAULT '{}',
    twitter_card JSONB DEFAULT '{}',
    
    -- Publishing Workflow
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    scheduled_for TIMESTAMPTZ,
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    click_through_count INTEGER DEFAULT 0,
    
    -- Social Media
    social_posted BOOLEAN DEFAULT FALSE,
    social_post_ids JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_refreshed_at TIMESTAMPTZ,
    
    -- Author
    author_id UUID REFERENCES auth.users(id),
    author_name TEXT DEFAULT 'TriniBuild AI',
    
    -- Uniqueness constraint to prevent duplicates
    CONSTRAINT unique_location_vertical UNIQUE (location_slug, vertical_key)
);

-- 2. BLOG GENERATION QUEUE - For scheduled batch processing
-- =====================================================
CREATE TABLE IF NOT EXISTS public.blog_generation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_slug TEXT NOT NULL,
    location_name TEXT NOT NULL,
    vertical_key TEXT NOT NULL,
    priority INTEGER DEFAULT 5, -- 1 = highest, 10 = lowest
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_queue_item UNIQUE (location_slug, vertical_key, status)
);

-- 3. BLOG ANALYTICS - Track performance over time
-- =====================================================
CREATE TABLE IF NOT EXISTS public.blog_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_id UUID REFERENCES public.blogs(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Daily metrics
    views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    time_on_page_seconds INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    
    -- SEO metrics
    google_impressions INTEGER DEFAULT 0,
    google_clicks INTEGER DEFAULT 0,
    google_position DECIMAL(5,2),
    
    -- Social metrics
    social_shares INTEGER DEFAULT 0,
    social_clicks INTEGER DEFAULT 0,
    
    -- Conversion metrics
    signup_clicks INTEGER DEFAULT 0,
    cta_clicks JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_blog_date UNIQUE (blog_id, date)
);

-- 4. BLOG SCHEDULER SETTINGS - Global configuration
-- =====================================================
CREATE TABLE IF NOT EXISTS public.blog_scheduler_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Scheduling
    is_enabled BOOLEAN DEFAULT TRUE,
    blogs_per_day INTEGER DEFAULT 3,
    preferred_publish_hour INTEGER DEFAULT 9, -- 9 AM
    preferred_timezone TEXT DEFAULT 'America/Port_of_Spain',
    
    -- Generation settings
    default_word_count INTEGER DEFAULT 1200,
    default_tone TEXT DEFAULT 'default',
    include_success_stories BOOLEAN DEFAULT TRUE,
    
    -- Priority rules (JSONB)
    location_priority_rules JSONB DEFAULT '{"major_cities": 1, "towns": 2, "villages": 3}',
    vertical_priority_rules JSONB DEFAULT '{"jobs": 1, "stores": 2, "real_estate": 3, "tickets": 4, "rideshare": 5}',
    
    -- Social media auto-post
    auto_post_facebook BOOLEAN DEFAULT FALSE,
    auto_post_twitter BOOLEAN DEFAULT FALSE,
    auto_post_linkedin BOOLEAN DEFAULT FALSE,
    
    -- Notifications
    notify_on_publish BOOLEAN DEFAULT TRUE,
    notification_email TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SOCIAL MEDIA POSTS - Track social shares
-- =====================================================
CREATE TABLE IF NOT EXISTS public.blog_social_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_id UUID REFERENCES public.blogs(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('facebook', 'twitter', 'linkedin', 'instagram', 'whatsapp')),
    post_id TEXT,
    post_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'failed')),
    posted_at TIMESTAMPTZ,
    engagement JSONB DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SITEMAP CACHE - For XML sitemap generation
-- =====================================================
CREATE TABLE IF NOT EXISTS public.blog_sitemap_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sitemap_xml TEXT NOT NULL,
    blog_count INTEGER NOT NULL,
    last_generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour'
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_blogs_status ON public.blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_location ON public.blogs(location_slug);
CREATE INDEX IF NOT EXISTS idx_blogs_vertical ON public.blogs(vertical_key);
CREATE INDEX IF NOT EXISTS idx_blogs_published ON public.blogs(published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_blogs_scheduled ON public.blogs(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_queue_pending ON public.blog_generation_queue(priority, scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_analytics_blog ON public.blog_analytics(blog_id, date DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_generation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_scheduler_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_sitemap_cache ENABLE ROW LEVEL SECURITY;

-- Public read access for published blogs
CREATE POLICY "Published blogs are viewable by everyone"
    ON public.blogs FOR SELECT
    USING (status = 'published');

-- Authenticated users can manage blogs (admin)
CREATE POLICY "Authenticated users can manage blogs"
    ON public.blogs FOR ALL
    USING (auth.role() = 'authenticated');

-- Public read for sitemap
CREATE POLICY "Sitemap is public"
    ON public.blog_sitemap_cache FOR SELECT
    USING (true);

-- Admin access for other tables
CREATE POLICY "Authenticated users can manage queue"
    ON public.blog_generation_queue FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage analytics"
    ON public.blog_analytics FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage settings"
    ON public.blog_scheduler_settings FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage social posts"
    ON public.blog_social_posts FOR ALL
    USING (auth.role() = 'authenticated');

-- =====================================================
-- FUNCTIONS FOR AUTOMATION
-- =====================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_blog_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating timestamps
DROP TRIGGER IF EXISTS blogs_updated_at ON public.blogs;
CREATE TRIGGER blogs_updated_at
    BEFORE UPDATE ON public.blogs
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_timestamp();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_blog_views(blog_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.blogs 
    SET view_count = view_count + 1 
    WHERE id = blog_uuid;
    
    -- Also update daily analytics
    INSERT INTO public.blog_analytics (blog_id, date, views)
    VALUES (blog_uuid, CURRENT_DATE, 1)
    ON CONFLICT (blog_id, date)
    DO UPDATE SET views = blog_analytics.views + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to publish scheduled blogs
CREATE OR REPLACE FUNCTION publish_scheduled_blogs()
RETURNS INTEGER AS $$
DECLARE
    published_count INTEGER := 0;
BEGIN
    UPDATE public.blogs
    SET status = 'published',
        published_at = NOW()
    WHERE status = 'scheduled'
      AND scheduled_for <= NOW();
    
    GET DIAGNOSTICS published_count = ROW_COUNT;
    RETURN published_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get next queue items for processing
CREATE OR REPLACE FUNCTION get_next_queue_items(batch_size INTEGER DEFAULT 5)
RETURNS SETOF public.blog_generation_queue AS $$
BEGIN
    RETURN QUERY
    UPDATE public.blog_generation_queue
    SET status = 'processing',
        attempts = attempts + 1
    WHERE id IN (
        SELECT id FROM public.blog_generation_queue
        WHERE status = 'pending'
          AND scheduled_for <= NOW()
          AND attempts < max_attempts
        ORDER BY priority ASC, scheduled_for ASC
        LIMIT batch_size
        FOR UPDATE SKIP LOCKED
    )
    RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INSERT DEFAULT SCHEDULER SETTINGS
-- =====================================================
INSERT INTO public.blog_scheduler_settings (
    is_enabled,
    blogs_per_day,
    preferred_publish_hour,
    default_word_count,
    notification_email
) VALUES (
    TRUE,
    3,
    9,
    1200,
    'admin@trinibuild.com'
) ON CONFLICT DO NOTHING;

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.blogs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blog_generation_queue;
