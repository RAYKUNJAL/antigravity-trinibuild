-- =====================================================
-- TRINIBUILD TRUST SCORE SYSTEM - DATABASE SCHEMA
-- Key: we_trust_score
-- Universal Trust Rating for all users
-- =====================================================

-- 1. TRUST SCORES - Main trust score table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.trust_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Core score (0-100)
    score INTEGER DEFAULT 50 CHECK (score >= 0 AND score <= 100),
    
    -- Verification level (0-3)
    verification_level INTEGER DEFAULT 0 CHECK (verification_level >= 0 AND verification_level <= 3),
    verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN (
        'unverified', 'basic', 'id_verified', 'trusted_pro'
    )),
    
    -- Component scores (each 0-100)
    transaction_score INTEGER DEFAULT 50,
    performance_score INTEGER DEFAULT 50,
    review_score INTEGER DEFAULT 50,
    profile_score INTEGER DEFAULT 50,
    age_score INTEGER DEFAULT 0,
    
    -- Metrics
    total_transactions INTEGER DEFAULT 0,
    successful_transactions INTEGER DEFAULT 0,
    cancelled_transactions INTEGER DEFAULT 0,
    on_time_deliveries INTEGER DEFAULT 0,
    late_deliveries INTEGER DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    positive_reviews INTEGER DEFAULT 0,
    negative_reviews INTEGER DEFAULT 0,
    disputes_opened INTEGER DEFAULT 0,
    disputes_lost INTEGER DEFAULT 0,
    
    -- Verification flags
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    national_id_verified BOOLEAN DEFAULT FALSE,
    address_verified BOOLEAN DEFAULT FALSE,
    business_docs_verified BOOLEAN DEFAULT FALSE,
    bank_account_linked BOOLEAN DEFAULT FALSE,
    
    -- Profile completeness
    profile_completeness INTEGER DEFAULT 0,
    has_profile_photo BOOLEAN DEFAULT FALSE,
    has_bio BOOLEAN DEFAULT FALSE,
    has_location BOOLEAN DEFAULT FALSE,
    
    -- Account info
    account_age_days INTEGER DEFAULT 0,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Risk flags
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    is_suspended BOOLEAN DEFAULT FALSE,
    suspension_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_trust UNIQUE (user_id)
);

-- 2. TRUST SCORE HISTORY - Track score changes over time
-- =====================================================
CREATE TABLE IF NOT EXISTS public.trust_score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    previous_score INTEGER NOT NULL,
    new_score INTEGER NOT NULL,
    score_change INTEGER NOT NULL,
    
    change_reason TEXT NOT NULL,
    change_type TEXT NOT NULL CHECK (change_type IN (
        'transaction_complete', 'transaction_cancelled', 'review_received',
        'dispute_opened', 'dispute_resolved', 'verification_added',
        'profile_updated', 'manual_adjustment', 'time_bonus', 'penalty'
    )),
    
    related_entity_type TEXT,
    related_entity_id UUID,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. VERIFICATION REQUESTS - Track ID verification requests
-- =====================================================
CREATE TABLE IF NOT EXISTS public.verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    verification_type TEXT NOT NULL CHECK (verification_type IN (
        'email', 'phone', 'national_id', 'passport', 'drivers_license',
        'address', 'business_registration', 'bank_statement'
    )),
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'under_review', 'approved', 'rejected', 'expired'
    )),
    
    -- Document info
    document_url TEXT,
    document_number_hash TEXT, -- Hashed for security
    expiry_date DATE,
    
    -- Review info
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Timestamps
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TRUST BADGES - Earned badges/achievements
-- =====================================================
CREATE TABLE IF NOT EXISTS public.trust_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    badge_type TEXT NOT NULL,
    badge_name TEXT NOT NULL,
    badge_description TEXT,
    badge_icon TEXT,
    
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    
    is_active BOOLEAN DEFAULT TRUE
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_trust_scores_user ON public.trust_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_trust_scores_score ON public.trust_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_trust_scores_level ON public.trust_scores(verification_level);
CREATE INDEX IF NOT EXISTS idx_trust_history_user ON public.trust_score_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_requests_user ON public.verification_requests(user_id, status);

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE public.trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_badges ENABLE ROW LEVEL SECURITY;

-- Trust scores readable by all (public info)
CREATE POLICY "Trust scores are viewable by everyone"
    ON public.trust_scores FOR SELECT
    USING (true);

-- Users can update their own profile-related fields
CREATE POLICY "Users can update own trust profile"
    ON public.trust_scores FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- History viewable by owner
CREATE POLICY "Users can view own history"
    ON public.trust_score_history FOR SELECT
    USING (auth.uid() = user_id);

-- Verification requests
CREATE POLICY "Users can view own verifications"
    ON public.verification_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can submit verifications"
    ON public.verification_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Badges
CREATE POLICY "Badges are viewable by everyone"
    ON public.trust_badges FOR SELECT
    USING (true);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Initialize trust score for new user
CREATE OR REPLACE FUNCTION initialize_trust_score()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.trust_scores (user_id, score, verification_level)
    VALUES (NEW.id, 50, 0)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create trust score
DROP TRIGGER IF EXISTS on_auth_user_created_trust ON auth.users;
CREATE TRIGGER on_auth_user_created_trust
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION initialize_trust_score();

-- Calculate and update trust score
CREATE OR REPLACE FUNCTION calculate_trust_score(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    ts RECORD;
    new_score INTEGER;
    trans_score INTEGER;
    perf_score INTEGER;
    rev_score INTEGER;
    prof_score INTEGER;
    age_bonus INTEGER;
    verification_bonus INTEGER;
BEGIN
    SELECT * INTO ts FROM public.trust_scores WHERE user_id = p_user_id;
    IF NOT FOUND THEN
        RETURN 50;
    END IF;
    
    -- Transaction score (0-100)
    IF ts.total_transactions > 0 THEN
        trans_score := LEAST(100, (ts.successful_transactions::FLOAT / ts.total_transactions * 100)::INTEGER);
    ELSE
        trans_score := 50;
    END IF;
    
    -- Performance score (0-100)
    IF ts.on_time_deliveries + ts.late_deliveries > 0 THEN
        perf_score := LEAST(100, (ts.on_time_deliveries::FLOAT / (ts.on_time_deliveries + ts.late_deliveries) * 100)::INTEGER);
    ELSE
        perf_score := 50;
    END IF;
    
    -- Review score (0-100)
    IF ts.total_reviews > 0 THEN
        rev_score := LEAST(100, (ts.positive_reviews::FLOAT / ts.total_reviews * 100)::INTEGER);
    ELSE
        rev_score := 50;
    END IF;
    
    -- Profile score (0-100)
    prof_score := ts.profile_completeness;
    
    -- Age bonus (up to 10 points)
    age_bonus := LEAST(10, ts.account_age_days / 30);
    
    -- Verification bonus (up to 20 points)
    verification_bonus := ts.verification_level * 5;
    IF ts.national_id_verified THEN verification_bonus := verification_bonus + 5; END IF;
    IF ts.business_docs_verified THEN verification_bonus := verification_bonus + 5; END IF;
    
    -- Weighted average
    new_score := (
        (trans_score * 0.30) +
        (perf_score * 0.25) +
        (rev_score * 0.25) +
        (prof_score * 0.10) +
        age_bonus +
        verification_bonus
    )::INTEGER;
    
    -- Apply penalties
    IF ts.disputes_lost > 0 THEN
        new_score := new_score - (ts.disputes_lost * 5);
    END IF;
    IF ts.is_flagged THEN
        new_score := new_score - 20;
    END IF;
    
    -- Clamp to 0-100
    new_score := GREATEST(0, LEAST(100, new_score));
    
    -- Update scores
    UPDATE public.trust_scores
    SET score = new_score,
        transaction_score = trans_score,
        performance_score = perf_score,
        review_score = rev_score,
        profile_score = prof_score,
        age_score = age_bonus,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record trust score change
CREATE OR REPLACE FUNCTION record_trust_change(
    p_user_id UUID,
    p_change_type TEXT,
    p_reason TEXT,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL
) RETURNS void AS $$
DECLARE
    old_score INTEGER;
    new_score INTEGER;
BEGIN
    SELECT score INTO old_score FROM public.trust_scores WHERE user_id = p_user_id;
    new_score := calculate_trust_score(p_user_id);
    
    INSERT INTO public.trust_score_history (
        user_id, previous_score, new_score, score_change,
        change_reason, change_type, related_entity_type, related_entity_id
    ) VALUES (
        p_user_id, old_score, new_score, new_score - old_score,
        p_reason, p_change_type, p_entity_type, p_entity_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update verification level
CREATE OR REPLACE FUNCTION update_verification_level(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    ts RECORD;
    new_level INTEGER := 0;
    new_status TEXT := 'unverified';
BEGIN
    SELECT * INTO ts FROM public.trust_scores WHERE user_id = p_user_id;
    IF NOT FOUND THEN RETURN 0; END IF;
    
    -- Level 1: Basic (email + phone)
    IF ts.email_verified AND ts.phone_verified THEN
        new_level := 1;
        new_status := 'basic';
    END IF;
    
    -- Level 2: ID Verified
    IF new_level >= 1 AND ts.national_id_verified THEN
        new_level := 2;
        new_status := 'id_verified';
    END IF;
    
    -- Level 3: Trusted Pro (good history + optional business docs)
    IF new_level >= 2 AND ts.score >= 80 AND ts.total_transactions >= 10 THEN
        new_level := 3;
        new_status := 'trusted_pro';
    END IF;
    
    UPDATE public.trust_scores
    SET verification_level = new_level,
        verification_status = new_status,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN new_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get trust badge label
CREATE OR REPLACE FUNCTION get_trust_label(p_score INTEGER, p_level INTEGER)
RETURNS TEXT AS $$
BEGIN
    IF p_level = 3 THEN RETURN 'Trusted Pro'; END IF;
    IF p_level = 2 THEN RETURN 'ID Verified'; END IF;
    IF p_level = 1 THEN RETURN 'Verified'; END IF;
    IF p_score >= 80 THEN RETURN 'Highly Trusted'; END IF;
    IF p_score >= 60 THEN RETURN 'Good Standing'; END IF;
    IF p_score >= 40 THEN RETURN 'Building Trust'; END IF;
    RETURN 'New User';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- REALTIME
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.trust_scores;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trust_badges;
