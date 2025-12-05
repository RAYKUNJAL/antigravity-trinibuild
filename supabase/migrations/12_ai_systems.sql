-- =====================================================
-- TRINIBUILD AI SYSTEMS - DATABASE SCHEMA
-- Combined migrations for:
-- - Smart Notifications
-- - Social Content
-- - Site Guardian Alerts
-- =====================================================

-- 1. SMART NOTIFICATIONS TABLE
-- =====================================================
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

-- 2. NOTIFICATION PREFERENCES TABLE
-- =====================================================
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
    
    quiet_hours_start TEXT, -- "22:00"
    quiet_hours_end TEXT,   -- "07:00"
    preferred_time TEXT,
    
    digest_frequency TEXT DEFAULT 'immediate' CHECK (digest_frequency IN ('immediate', 'hourly', 'daily', 'weekly')),
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SOCIAL POSTS TABLE
-- =====================================================
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

-- 4. SOCIAL CAMPAIGNS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.social_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    platforms TEXT[] DEFAULT '{}',
    
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'paused')),
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SITE ALERTS TABLE
-- =====================================================
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

-- 6. CONTENT QUALITY REPORTS TABLE
-- =====================================================
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

-- 7. USER ACTIVITY TABLE (for recommendations)
-- =====================================================
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

-- 8. USER PREFERENCES TABLE (for recommendations)
-- =====================================================
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
CREATE INDEX IF NOT EXISTS idx_smart_notif_user ON public.smart_notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_smart_notif_status ON public.smart_notifications(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON public.social_posts(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_social_posts_platform ON public.social_posts(platform, status);
CREATE INDEX IF NOT EXISTS idx_site_alerts_status ON public.site_alerts(status, severity);
CREATE INDEX IF NOT EXISTS idx_user_activity_user ON public.user_activity(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_session ON public.user_activity(session_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE public.smart_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can manage their own notifications
CREATE POLICY "Users manage own notifications"
    ON public.smart_notifications FOR ALL
    USING (auth.uid() = user_id);

-- Users can manage their preferences
CREATE POLICY "Users manage own preferences"
    ON public.notification_preferences FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users manage own activity preferences"
    ON public.user_preferences FOR ALL
    USING (auth.uid() = user_id);

-- User activity - own data or anonymous
CREATE POLICY "Users see own activity"
    ON public.user_activity FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can insert activity"
    ON public.user_activity FOR INSERT
    WITH CHECK (true);

-- Admin access to social and alerts
CREATE POLICY "Admin access to social posts"
    ON public.social_posts FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admin access to site alerts"
    ON public.site_alerts FOR ALL
    USING (auth.role() = 'authenticated');

-- =====================================================
-- REALTIME
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.smart_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_alerts;
