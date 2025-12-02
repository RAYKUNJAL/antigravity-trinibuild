-- User Gamification and Progress Tracking

-- User Badges and Achievements
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_type TEXT NOT NULL, -- 'top_seller', 'early_adopter', 'streak_master', 'verified_vendor', etc.
    badge_name TEXT NOT NULL,
    badge_description TEXT,
    badge_icon TEXT, -- URL or icon name
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB, -- Additional data like streak count, sales count, etc.
    UNIQUE(user_id, badge_type)
);

-- User Login Streaks
CREATE TABLE IF NOT EXISTS user_streaks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_login_date DATE,
    total_logins INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Onboarding Progress
CREATE TABLE IF NOT EXISTS user_onboarding (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    step_current INTEGER DEFAULT 1,
    step_total INTEGER DEFAULT 5,
    steps_completed JSONB DEFAULT '[]'::jsonb, -- Array of completed step IDs
    profile_completed BOOLEAN DEFAULT false,
    first_listing_created BOOLEAN DEFAULT false,
    first_sale_made BOOLEAN DEFAULT false,
    website_customized BOOLEAN DEFAULT false,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    time_to_complete_seconds INTEGER
);

-- User Recommendations (Personalized)
CREATE TABLE IF NOT EXISTS user_recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recommendation_type TEXT NOT NULL, -- 'add_listing', 'customize_site', 'seasonal_boost', etc.
    title TEXT NOT NULL,
    description TEXT,
    action_url TEXT,
    action_label TEXT,
    priority INTEGER DEFAULT 0, -- Higher = more important
    dismissed BOOLEAN DEFAULT false,
    actioned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Success Stories
CREATE TABLE IF NOT EXISTS success_stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    vendor_name TEXT NOT NULL,
    location TEXT, -- e.g., "Port of Spain", "San Fernando"
    story_text TEXT NOT NULL,
    achievement TEXT, -- e.g., "Sold 100+ items in first month"
    avatar_url TEXT,
    featured BOOLEAN DEFAULT false,
    approved BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON user_badges(earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_user_id ON user_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_priority ON user_recommendations(priority DESC);
CREATE INDEX IF NOT EXISTS idx_success_stories_featured ON success_stories(featured, display_order);

-- Enable RLS
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE success_stories ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- User Badges
CREATE POLICY "Users can view their own badges" ON user_badges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert badges" ON user_badges
    FOR INSERT WITH CHECK (true);

-- User Streaks
CREATE POLICY "Users can view their own streaks" ON user_streaks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks" ON user_streaks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert streaks" ON user_streaks
    FOR INSERT WITH CHECK (true);

-- User Onboarding
CREATE POLICY "Users can view their own onboarding" ON user_onboarding
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding" ON user_onboarding
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert onboarding" ON user_onboarding
    FOR INSERT WITH CHECK (true);

-- User Recommendations
CREATE POLICY "Users can view their own recommendations" ON user_recommendations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations" ON user_recommendations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert recommendations" ON user_recommendations
    FOR INSERT WITH CHECK (true);

-- Success Stories
CREATE POLICY "Anyone can view approved stories" ON success_stories
    FOR SELECT USING (approved = true);

CREATE POLICY "Users can insert their own stories" ON success_stories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own stories" ON success_stories
    FOR UPDATE USING (auth.uid() = user_id);

-- Seed some success stories
INSERT INTO success_stories (vendor_name, location, story_text, achievement, featured, approved, display_order) VALUES
('Sarah''s Soca Wear', 'Port of Spain', 'Started selling Carnival costumes online and made TT$50,000 in my first month! TriniBuild made it so easy to set up my store.', 'TT$50K in first month', true, true, 1),
('Mike''s Auto Parts', 'San Fernando', 'I was skeptical at first, but after listing my car parts, I got 20 orders in the first week. No more waiting around the shop!', '20 orders in first week', true, true, 2),
('Trini Treats by Lisa', 'Arima', 'My homemade snacks were only selling locally. Now I ship across Trinidad and even to Tobago! This platform changed my business.', 'Island-wide delivery', true, true, 3),
('David''s Construction', 'Chaguanas', 'Got 5 new clients in 2 weeks just from my free TriniBuild page. The AI helped me write professional quotes too!', '5 new clients in 2 weeks', true, true, 4)
ON CONFLICT DO NOTHING;
