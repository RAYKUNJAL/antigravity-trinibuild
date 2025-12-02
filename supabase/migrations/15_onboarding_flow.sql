-- Onboarding Flow Tracking and Optimization

-- Onboarding Sessions
CREATE TABLE IF NOT EXISTS onboarding_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT UNIQUE NOT NULL,
    entry_point TEXT, -- 'direct', 'referral', 'whatsapp', 'facebook', 'instagram'
    referrer_code TEXT,
    current_step INTEGER DEFAULT 1,
    total_steps INTEGER DEFAULT 7,
    completed BOOLEAN DEFAULT false,
    completion_time_seconds INTEGER,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    abandoned_at TIMESTAMPTZ,
    device_type TEXT,
    user_agent TEXT,
    ip_address TEXT,
    country_code TEXT
);

-- Onboarding Step Events
CREATE TABLE IF NOT EXISTS onboarding_step_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT REFERENCES onboarding_sessions(session_id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    step_name TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'started', 'completed', 'skipped', 'error'
    time_spent_seconds INTEGER,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles (from onboarding)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'seller', 'buyer', 'driver', 'farmer', 'job_seeker', 'employer'
    primary_role BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Generated Websites (from onboarding)
CREATE TABLE IF NOT EXISTS user_websites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    subdomain TEXT UNIQUE NOT NULL,
    business_name TEXT,
    template_id TEXT,
    logo_url TEXT,
    color_scheme JSONB,
    sections JSONB, -- Array of section configs
    published BOOLEAN DEFAULT true,
    custom_domain TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Drop-off Recovery
CREATE TABLE IF NOT EXISTS onboarding_recovery (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT REFERENCES onboarding_sessions(session_id) ON DELETE CASCADE,
    recovery_type TEXT NOT NULL, -- 'exit_intent', 'sms_24h', 'email_day1', 'email_day3', 'email_day7'
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    clicked BOOLEAN DEFAULT false,
    clicked_at TIMESTAMPTZ,
    converted BOOLEAN DEFAULT false,
    converted_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_user_id ON onboarding_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_session_id ON onboarding_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_completed ON onboarding_sessions(completed);
CREATE INDEX IF NOT EXISTS idx_onboarding_step_events_session_id ON onboarding_step_events(session_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_websites_user_id ON user_websites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_websites_subdomain ON user_websites(subdomain);

-- Enable RLS
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_step_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_recovery ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Onboarding Sessions
CREATE POLICY "Users can view their own sessions" ON onboarding_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage sessions" ON onboarding_sessions
    FOR ALL USING (true);

-- Onboarding Step Events
CREATE POLICY "Users can view their own step events" ON onboarding_step_events
    FOR SELECT USING (
        session_id IN (SELECT session_id FROM onboarding_sessions WHERE user_id = auth.uid())
    );

CREATE POLICY "System can manage step events" ON onboarding_step_events
    FOR ALL USING (true);

-- User Roles
CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own roles" ON user_roles
    FOR ALL USING (auth.uid() = user_id);

-- User Websites
CREATE POLICY "Users can view their own website" ON user_websites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view published websites" ON user_websites
    FOR SELECT USING (published = true);

CREATE POLICY "Users can manage their own website" ON user_websites
    FOR ALL USING (auth.uid() = user_id);

-- Onboarding Recovery
CREATE POLICY "System can manage recovery" ON onboarding_recovery
    FOR ALL USING (true);

-- Function to generate unique subdomain
CREATE OR REPLACE FUNCTION generate_subdomain(p_business_name TEXT, p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_subdomain TEXT;
    v_counter INTEGER := 0;
    v_exists BOOLEAN;
BEGIN
    -- Clean business name
    v_subdomain := lower(regexp_replace(p_business_name, '[^a-zA-Z0-9]', '', 'g'));
    
    -- Limit to 20 characters
    v_subdomain := substring(v_subdomain from 1 for 20);
    
    -- If empty, use user ID
    IF v_subdomain = '' THEN
        v_subdomain := 'site' || substring(p_user_id::text from 1 for 8);
    END IF;
    
    -- Check if exists and add counter if needed
    LOOP
        IF v_counter > 0 THEN
            v_subdomain := v_subdomain || v_counter::text;
        END IF;
        
        SELECT EXISTS(SELECT 1 FROM user_websites WHERE subdomain = v_subdomain) INTO v_exists;
        
        EXIT WHEN NOT v_exists;
        
        v_counter := v_counter + 1;
    END LOOP;
    
    RETURN v_subdomain;
END;
$$ LANGUAGE plpgsql;

-- Function to track onboarding completion
CREATE OR REPLACE FUNCTION complete_onboarding(p_session_id TEXT)
RETURNS void AS $$
DECLARE
    v_started_at TIMESTAMPTZ;
    v_completion_time INTEGER;
BEGIN
    -- Get start time
    SELECT started_at INTO v_started_at
    FROM onboarding_sessions
    WHERE session_id = p_session_id;
    
    -- Calculate completion time
    v_completion_time := EXTRACT(EPOCH FROM (NOW() - v_started_at))::INTEGER;
    
    -- Update session
    UPDATE onboarding_sessions
    SET 
        completed = true,
        completed_at = NOW(),
        completion_time_seconds = v_completion_time,
        current_step = total_steps
    WHERE session_id = p_session_id;
    
    -- Track in onboarding progress (from gamification)
    UPDATE user_onboarding
    SET 
        completed_at = NOW(),
        time_to_complete_seconds = v_completion_time
    WHERE user_id = (SELECT user_id FROM onboarding_sessions WHERE session_id = p_session_id);
END;
$$ LANGUAGE plpgsql;

-- View for onboarding analytics
CREATE OR REPLACE VIEW onboarding_analytics AS
SELECT 
    DATE(started_at) as date,
    entry_point,
    COUNT(*) as total_sessions,
    COUNT(*) FILTER (WHERE completed = true) as completed_sessions,
    ROUND(COUNT(*) FILTER (WHERE completed = true)::NUMERIC / COUNT(*) * 100, 2) as completion_rate,
    AVG(completion_time_seconds) FILTER (WHERE completed = true) as avg_completion_time,
    COUNT(*) FILTER (WHERE current_step = 1) as dropped_at_phone,
    COUNT(*) FILTER (WHERE current_step = 2) as dropped_at_otp,
    COUNT(*) FILTER (WHERE current_step = 3) as dropped_at_role,
    COUNT(*) FILTER (WHERE current_step = 4) as dropped_at_profile,
    COUNT(*) FILTER (WHERE current_step = 5) as dropped_at_website,
    COUNT(*) FILTER (WHERE current_step = 6) as dropped_at_legal,
    COUNT(*) FILTER (WHERE current_step = 7) as dropped_at_referral
FROM onboarding_sessions
GROUP BY DATE(started_at), entry_point;

-- Grant access
GRANT SELECT ON onboarding_analytics TO authenticated;
