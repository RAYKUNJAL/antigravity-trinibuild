-- Viral Loops V2: Enhanced Affiliate System with Tiered Rewards

-- Update referral_conversions table to support tiered rewards
ALTER TABLE referral_conversions ADD COLUMN IF NOT EXISTS tier TEXT;
ALTER TABLE referral_conversions ADD COLUMN IF NOT EXISTS platform_fee_amount NUMERIC(10, 2);
ALTER TABLE referral_conversions ADD COLUMN IF NOT EXISTS commission_percentage NUMERIC(5, 2);

-- Update affiliate_earnings table for enhanced tracking
ALTER TABLE affiliate_earnings ADD COLUMN IF NOT EXISTS tier TEXT;
ALTER TABLE affiliate_earnings ADD COLUMN IF NOT EXISTS transaction_id TEXT;
ALTER TABLE affiliate_earnings ADD COLUMN IF NOT EXISTS lifetime_cap NUMERIC(10, 2) DEFAULT 5000.00;
ALTER TABLE affiliate_earnings ADD COLUMN IF NOT EXISTS total_earned_from_user NUMERIC(10, 2) DEFAULT 0;

-- Affiliate Eligibility Tracking
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
    method TEXT NOT NULL, -- 'wipay', 'linx', 'bank_transfer'
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
    bank_details JSONB, -- Account info if bank transfer
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
    check_type TEXT NOT NULL, -- 'self_referral', 'device_fingerprint', 'ip_check', 'velocity'
    flagged BOOLEAN DEFAULT false,
    details JSONB,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral Activity Log (for velocity checks)
CREATE TABLE IF NOT EXISTS referral_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address TEXT,
    device_fingerprint TEXT,
    referral_code TEXT,
    user_agent TEXT,
    country_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboard (materialized view for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS affiliate_leaderboard AS
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payout_requests_user_id ON payout_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_fraud_checks_user_id ON fraud_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_checks_flagged ON fraud_checks(flagged);
CREATE INDEX IF NOT EXISTS idx_referral_activity_ip ON referral_activity_log(ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_referral_activity_device ON referral_activity_log(device_fingerprint);

-- Enable RLS
ALTER TABLE affiliate_eligibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Affiliate Eligibility
CREATE POLICY "Users can view their own eligibility" ON affiliate_eligibility
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can update eligibility" ON affiliate_eligibility
    FOR ALL USING (true);

-- Payout Requests
CREATE POLICY "Users can view their own payout requests" ON payout_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create payout requests" ON payout_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update payout requests" ON payout_requests
    FOR UPDATE USING (true);

-- Fraud Checks
CREATE POLICY "Users can view their own fraud checks" ON fraud_checks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage fraud checks" ON fraud_checks
    FOR ALL USING (true);

-- Referral Activity Log
CREATE POLICY "System can manage activity log" ON referral_activity_log
    FOR ALL USING (true);

-- Function to check affiliate eligibility
CREATE OR REPLACE FUNCTION check_affiliate_eligibility(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_eligible BOOLEAN;
    v_age_verified BOOLEAN;
    v_phone_verified BOOLEAN;
    v_profile_completion INTEGER;
    v_has_activity BOOLEAN;
BEGIN
    -- Get eligibility data
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

    -- Check all criteria
    v_eligible := (
        v_age_verified = true AND
        v_phone_verified = true AND
        v_profile_completion >= 80 AND
        v_has_activity = true
    );

    -- Update eligibility status
    UPDATE affiliate_eligibility
    SET 
        eligible = v_eligible,
        eligibility_date = CASE WHEN v_eligible AND eligibility_date IS NULL THEN NOW() ELSE eligibility_date END,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    RETURN v_eligible;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate tiered commission
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
    -- Get total already earned from this user
    SELECT COALESCE(SUM(amount), 0)
    INTO v_total_earned
    FROM affiliate_earnings
    WHERE user_id = p_referrer_id 
    AND referral_conversion_id IN (
        SELECT id FROM referral_conversions WHERE referee_id = p_referee_id
    );

    -- Calculate commission based on tier
    CASE p_tier
        WHEN 'level_2_first_transaction' THEN
            v_commission := p_platform_fee * 0.25; -- 25% of platform fee
        WHEN 'level_3_recurring' THEN
            -- Check if under cap
            IF v_total_earned < v_cap THEN
                v_commission := LEAST(p_platform_fee * 0.10, v_cap - v_total_earned); -- 10% recurring, capped
            END IF;
        ELSE
            v_commission := 0;
    END CASE;

    -- Insert earning record if commission > 0
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

-- Function to check for fraud (velocity check)
CREATE OR REPLACE FUNCTION check_referral_velocity(p_ip_address TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Count signups from this IP in last 24 hours
    SELECT COUNT(*)
    INTO v_count
    FROM referral_activity_log
    WHERE ip_address = p_ip_address
    AND created_at > NOW() - INTERVAL '24 hours';

    -- Flag if over 20
    IF v_count > 20 THEN
        RETURN false;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh leaderboard
CREATE OR REPLACE FUNCTION refresh_affiliate_leaderboard()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW affiliate_leaderboard;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create eligibility record on user signup
CREATE OR REPLACE FUNCTION create_affiliate_eligibility()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO affiliate_eligibility (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_affiliate_eligibility
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_affiliate_eligibility();

-- Schedule leaderboard refresh (run this manually or via cron)
-- SELECT cron.schedule('refresh-leaderboard', '0 */6 * * *', 'SELECT refresh_affiliate_leaderboard()');
