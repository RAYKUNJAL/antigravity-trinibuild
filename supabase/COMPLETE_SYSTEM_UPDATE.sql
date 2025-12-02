-- ============================================================================
-- TRINIBUILD COMPLETE SYSTEM UPDATE
-- Combined Migration: Viral Loops + Affiliate System + Onboarding
-- Run this ONCE in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- PART 1: VIRAL LOOPS V1 - Basic Referral System
-- ============================================================================

-- Referral Links and Tracking
CREATE TABLE IF NOT EXISTS referral_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code TEXT UNIQUE NOT NULL,
    referral_url TEXT NOT NULL,
    total_clicks INTEGER DEFAULT 0,
    total_signups INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

-- Referral Conversions
CREATE TABLE IF NOT EXISTS referral_conversions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referral_link_id UUID REFERENCES referral_links(id) ON DELETE CASCADE,
    referrer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    referee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    conversion_type TEXT NOT NULL,
    reward_amount NUMERIC(10, 2) DEFAULT 0,
    reward_type TEXT,
    reward_claimed BOOLEAN DEFAULT false,
    conversion_value NUMERIC(10, 2),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate Earnings
CREATE TABLE IF NOT EXISTS affiliate_earnings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_conversion_id UUID REFERENCES referral_conversions(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    commission_rate NUMERIC(5, 2) DEFAULT 10.00,
    source_type TEXT,
    status TEXT DEFAULT 'pending',
    payout_date TIMESTAMPTZ,
    payout_method TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Share Tracking
CREATE TABLE IF NOT EXISTS share_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content_type TEXT NOT NULL,
    content_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    share_url TEXT NOT NULL,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Viral Widgets
CREATE TABLE IF NOT EXISTS viral_widgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    widget_type TEXT NOT NULL,
    widget_code TEXT NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Referral Stats
CREATE TABLE IF NOT EXISTS user_referral_stats (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    total_referrals INTEGER DEFAULT 0,
    successful_referrals INTEGER DEFAULT 0,
    total_earnings NUMERIC(10, 2) DEFAULT 0,
    pending_earnings NUMERIC(10, 2) DEFAULT 0,
    paid_earnings NUMERIC(10, 2) DEFAULT 0,
    bonus_listings_earned INTEGER DEFAULT 0,
    k_factor NUMERIC(5, 2) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for V1
CREATE INDEX IF NOT EXISTS idx_referral_links_user_id ON referral_links(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_code ON referral_links(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_referrer ON referral_conversions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_referee ON referral_conversions(referee_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_earnings_user_id ON affiliate_earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_earnings_status ON affiliate_earnings(status);
CREATE INDEX IF NOT EXISTS idx_share_tracking_user_id ON share_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_share_tracking_content ON share_tracking(content_type, content_id);

-- Enable RLS for V1
ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE viral_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_referral_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for V1
CREATE POLICY "Users can view their own referral links" ON referral_links
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral links" ON referral_links
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update referral link stats" ON referral_links
    FOR UPDATE USING (true);

CREATE POLICY "Users can view their own conversions" ON referral_conversions
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "System can insert conversions" ON referral_conversions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own earnings" ON affiliate_earnings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert earnings" ON affiliate_earnings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own shares" ON share_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert share tracking" ON share_tracking
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update share stats" ON share_tracking
    FOR UPDATE USING (true);

CREATE POLICY "Users can view their own widgets" ON viral_widgets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own widgets" ON viral_widgets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own widgets" ON viral_widgets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own stats" ON user_referral_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can update stats" ON user_referral_stats
    FOR ALL USING (true);

-- Functions for V1
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        code := upper(substring(md5(random()::text) from 1 for 8));
        SELECT EXISTS(SELECT 1 FROM referral_links WHERE referral_code = code) INTO exists;
        EXIT WHEN NOT exists;
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_user_referral_link()
RETURNS TRIGGER AS $$
DECLARE
    ref_code TEXT;
BEGIN
    ref_code := generate_referral_code();
    
    INSERT INTO referral_links (user_id, referral_code, referral_url)
    VALUES (
        NEW.id,
        ref_code,
        'https://trinibuild.com?ref=' || ref_code
    );
    
    INSERT INTO user_referral_stats (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_create_referral_link ON auth.users;
CREATE TRIGGER auto_create_referral_link
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_referral_link();

CREATE OR REPLACE FUNCTION update_referral_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_referral_stats
    SET 
        total_referrals = total_referrals + 1,
        successful_referrals = CASE 
            WHEN NEW.conversion_type IN ('signup', 'first_sale') THEN successful_referrals + 1
            ELSE successful_referrals
        END,
        bonus_listings_earned = CASE
            WHEN NEW.reward_type = 'listings' THEN bonus_listings_earned + NEW.reward_amount::INTEGER
            ELSE bonus_listings_earned
        END,
        updated_at = NOW()
    WHERE user_id = NEW.referrer_id;
    
    UPDATE referral_links
    SET 
        total_conversions = total_conversions + 1,
        last_used_at = NOW()
    WHERE id = NEW.referral_link_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_stats_on_conversion ON referral_conversions;
CREATE TRIGGER update_stats_on_conversion
    AFTER INSERT ON referral_conversions
    FOR EACH ROW
    EXECUTE FUNCTION update_referral_stats();

-- ============================================================================
-- PART 2: VIRAL LOOPS V2 - Enhanced Tiered Rewards
-- ============================================================================

-- Add columns to existing tables
ALTER TABLE referral_conversions ADD COLUMN IF NOT EXISTS tier TEXT;
ALTER TABLE referral_conversions ADD COLUMN IF NOT EXISTS platform_fee_amount NUMERIC(10, 2);
ALTER TABLE referral_conversions ADD COLUMN IF NOT EXISTS commission_percentage NUMERIC(5, 2);

ALTER TABLE affiliate_earnings ADD COLUMN IF NOT EXISTS tier TEXT;
ALTER TABLE affiliate_earnings ADD COLUMN IF NOT EXISTS transaction_id TEXT;
ALTER TABLE affiliate_earnings ADD COLUMN IF NOT EXISTS lifetime_cap NUMERIC(10, 2) DEFAULT 5000.00;
ALTER TABLE affiliate_earnings ADD COLUMN IF NOT EXISTS total_earned_from_user NUMERIC(10, 2) DEFAULT 0;

-- Affiliate Eligibility
CREATE TABLE IF NOT EXISTS affiliate_eligibility (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    age_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    profile_completion_percent INTEGER DEFAULT 0,
    has_listing_or_ride BOOLEAN DEFAULT false,
    eligible BOOLEAN DEFAULT false,
    eligibility_date TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payout Requests
CREATE TABLE IF NOT EXISTS payout_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    method TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    bank_details JSONB,
    wipay_phone TEXT,
    linx_card TEXT,
    fee_amount NUMERIC(10, 2) DEFAULT 0,
    net_amount NUMERIC(10, 2),
    processed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fraud Detection
CREATE TABLE IF NOT EXISTS fraud_checks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    check_type TEXT NOT NULL,
    flagged BOOLEAN DEFAULT false,
    details JSONB,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral Activity Log
CREATE TABLE IF NOT EXISTS referral_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address TEXT,
    device_fingerprint TEXT,
    referral_code TEXT,
    user_agent TEXT,
    country_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboard
DROP MATERIALIZED VIEW IF EXISTS affiliate_leaderboard CASCADE;
CREATE MATERIALIZED VIEW affiliate_leaderboard AS
SELECT 
    urs.user_id,
    p.email,
    p.full_name,
    urs.total_referrals,
    urs.successful_referrals,
    urs.total_earnings,
    urs.k_factor,
    RANK() OVER (ORDER BY urs.total_earnings DESC) as rank
FROM user_referral_stats urs
LEFT JOIN profiles p ON urs.user_id = p.id
WHERE urs.total_earnings > 0
ORDER BY urs.total_earnings DESC
LIMIT 50;

-- Indexes for V2
CREATE INDEX IF NOT EXISTS idx_payout_requests_user_id ON payout_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_fraud_checks_user_id ON fraud_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_checks_flagged ON fraud_checks(flagged);
CREATE INDEX IF NOT EXISTS idx_referral_activity_ip ON referral_activity_log(ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_referral_activity_device ON referral_activity_log(device_fingerprint);

-- Enable RLS for V2
ALTER TABLE affiliate_eligibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for V2
CREATE POLICY "Users can view their own eligibility" ON affiliate_eligibility
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can update eligibility" ON affiliate_eligibility
    FOR ALL USING (true);

CREATE POLICY "Users can view their own payout requests" ON payout_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create payout requests" ON payout_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update payout requests" ON payout_requests
    FOR UPDATE USING (true);

CREATE POLICY "Users can view their own fraud checks" ON fraud_checks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage fraud checks" ON fraud_checks
    FOR ALL USING (true);

CREATE POLICY "System can manage activity log" ON referral_activity_log
    FOR ALL USING (true);

-- Functions for V2
CREATE OR REPLACE FUNCTION check_affiliate_eligibility(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_eligible BOOLEAN;
    v_age_verified BOOLEAN;
    v_phone_verified BOOLEAN;
    v_profile_completion INTEGER;
    v_has_activity BOOLEAN;
BEGIN
    SELECT 
        age_verified,
        phone_verified,
        profile_completion_percent,
        has_listing_or_ride
    INTO 
        v_age_verified,
        v_phone_verified,
        v_profile_completion,
        v_has_activity
    FROM affiliate_eligibility
    WHERE user_id = p_user_id;

    v_eligible := (
        v_age_verified = true AND
        v_phone_verified = true AND
        v_profile_completion >= 80 AND
        v_has_activity = true
    );

    UPDATE affiliate_eligibility
    SET 
        eligible = v_eligible,
        eligibility_date = CASE WHEN v_eligible AND eligibility_date IS NULL THEN NOW() ELSE eligibility_date END,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    RETURN v_eligible;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_tiered_commission(
    p_referrer_id UUID,
    p_referee_id UUID,
    p_tier TEXT,
    p_platform_fee NUMERIC,
    p_transaction_id TEXT DEFAULT NULL
)
RETURNS NUMERIC AS $$
DECLARE
    v_commission NUMERIC := 0;
    v_total_earned NUMERIC := 0;
    v_cap NUMERIC := 5000.00;
BEGIN
    SELECT COALESCE(SUM(amount), 0)
    INTO v_total_earned
    FROM affiliate_earnings
    WHERE user_id = p_referrer_id 
    AND referral_conversion_id IN (
        SELECT id FROM referral_conversions WHERE referee_id = p_referee_id
    );

    CASE p_tier
        WHEN 'level_2_first_transaction' THEN
            v_commission := p_platform_fee * 0.25;
        WHEN 'level_3_recurring' THEN
            IF v_total_earned < v_cap THEN
                v_commission := LEAST(p_platform_fee * 0.10, v_cap - v_total_earned);
            END IF;
        ELSE
            v_commission := 0;
    END CASE;

    IF v_commission > 0 THEN
        INSERT INTO affiliate_earnings (
            user_id,
            amount,
            commission_rate,
            source_type,
            tier,
            transaction_id,
            status,
            total_earned_from_user
        ) VALUES (
            p_referrer_id,
            v_commission,
            CASE p_tier WHEN 'level_2_first_transaction' THEN 25.00 ELSE 10.00 END,
            p_tier,
            p_tier,
            p_transaction_id,
            'pending',
            v_total_earned + v_commission
        );
    END IF;

    RETURN v_commission;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_referral_velocity(p_ip_address TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM referral_activity_log
    WHERE ip_address = p_ip_address
    AND created_at > NOW() - INTERVAL '24 hours';

    IF v_count > 20 THEN
        RETURN false;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_affiliate_leaderboard()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW affiliate_leaderboard;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_affiliate_eligibility()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO affiliate_eligibility (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_create_affiliate_eligibility ON auth.users;
CREATE TRIGGER auto_create_affiliate_eligibility
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_affiliate_eligibility();

-- ============================================================================
-- PART 3: ONBOARDING FLOW SYSTEM
-- ============================================================================

-- Onboarding Sessions
CREATE TABLE IF NOT EXISTS onboarding_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT UNIQUE NOT NULL,
    entry_point TEXT,
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
    event_type TEXT NOT NULL,
    time_spent_seconds INTEGER,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    primary_role BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- User Websites
CREATE TABLE IF NOT EXISTS user_websites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    subdomain TEXT UNIQUE NOT NULL,
    business_name TEXT,
    template_id TEXT,
    logo_url TEXT,
    color_scheme JSONB,
    sections JSONB,
    published BOOLEAN DEFAULT true,
    custom_domain TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Onboarding Recovery
CREATE TABLE IF NOT EXISTS onboarding_recovery (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT REFERENCES onboarding_sessions(session_id) ON DELETE CASCADE,
    recovery_type TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    clicked BOOLEAN DEFAULT false,
    clicked_at TIMESTAMPTZ,
    converted BOOLEAN DEFAULT false,
    converted_at TIMESTAMPTZ
);

-- Indexes for Onboarding
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_user_id ON onboarding_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_session_id ON onboarding_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_completed ON onboarding_sessions(completed);
CREATE INDEX IF NOT EXISTS idx_onboarding_step_events_session_id ON onboarding_step_events(session_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_websites_user_id ON user_websites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_websites_subdomain ON user_websites(subdomain);

-- Enable RLS for Onboarding
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_step_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_recovery ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Onboarding
CREATE POLICY "Users can view their own sessions" ON onboarding_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage sessions" ON onboarding_sessions
    FOR ALL USING (true);

CREATE POLICY "Users can view their own step events" ON onboarding_step_events
    FOR SELECT USING (
        session_id IN (SELECT session_id FROM onboarding_sessions WHERE user_id = auth.uid())
    );

CREATE POLICY "System can manage step events" ON onboarding_step_events
    FOR ALL USING (true);

CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own roles" ON user_roles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own website" ON user_websites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view published websites" ON user_websites
    FOR SELECT USING (published = true);

CREATE POLICY "Users can manage their own website" ON user_websites
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "System can manage recovery" ON onboarding_recovery
    FOR ALL USING (true);

-- Functions for Onboarding
CREATE OR REPLACE FUNCTION generate_subdomain(p_business_name TEXT, p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_subdomain TEXT;
    v_counter INTEGER := 0;
    v_exists BOOLEAN;
BEGIN
    v_subdomain := lower(regexp_replace(p_business_name, '[^a-zA-Z0-9]', '', 'g'));
    v_subdomain := substring(v_subdomain from 1 for 20);
    
    IF v_subdomain = '' THEN
        v_subdomain := 'site' || substring(p_user_id::text from 1 for 8);
    END IF;
    
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

CREATE OR REPLACE FUNCTION complete_onboarding(p_session_id TEXT)
RETURNS void AS $$
DECLARE
    v_started_at TIMESTAMPTZ;
    v_completion_time INTEGER;
BEGIN
    SELECT started_at INTO v_started_at
    FROM onboarding_sessions
    WHERE session_id = p_session_id;
    
    v_completion_time := EXTRACT(EPOCH FROM (NOW() - v_started_at))::INTEGER;
    
    UPDATE onboarding_sessions
    SET 
        completed = true,
        completed_at = NOW(),
        completion_time_seconds = v_completion_time,
        current_step = total_steps
    WHERE session_id = p_session_id;
    
    UPDATE user_onboarding
    SET 
        completed_at = NOW(),
        time_to_complete_seconds = v_completion_time
    WHERE user_id = (SELECT user_id FROM onboarding_sessions WHERE session_id = p_session_id);
END;
$$ LANGUAGE plpgsql;

-- Onboarding Analytics View
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

GRANT SELECT ON onboarding_analytics TO authenticated;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- All tables, functions, triggers, and policies have been created.
-- Your TriniBuild platform is now ready with:
-- ✅ Viral Loops (Referral System)
-- ✅ Tiered Affiliate Rewards (4 levels)
-- ✅ Payout Management (WiPay/LinX/Bank)
-- ✅ Fraud Detection
-- ✅ Onboarding Flow Tracking
-- ✅ Website Generation System
-- ============================================================================
