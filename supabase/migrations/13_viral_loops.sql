-- Viral Loops and Referral System

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
    conversion_type TEXT NOT NULL, -- 'signup', 'first_listing', 'first_sale', 'upgrade'
    reward_amount NUMERIC(10, 2) DEFAULT 0,
    reward_type TEXT, -- 'listings', 'credits', 'commission', 'upgrade'
    reward_claimed BOOLEAN DEFAULT false,
    conversion_value NUMERIC(10, 2), -- Value of the conversion (e.g., sale amount)
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate Earnings
CREATE TABLE IF NOT EXISTS affiliate_earnings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_conversion_id UUID REFERENCES referral_conversions(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    commission_rate NUMERIC(5, 2) DEFAULT 10.00, -- Percentage
    source_type TEXT, -- 'referral_sale', 'affiliate_commission', 'bonus'
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'cancelled'
    payout_date TIMESTAMPTZ,
    payout_method TEXT, -- 'bank_transfer', 'credits', 'wallet'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Share Tracking
CREATE TABLE IF NOT EXISTS share_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content_type TEXT NOT NULL, -- 'listing', 'website', 'event', 'job'
    content_id TEXT NOT NULL,
    platform TEXT NOT NULL, -- 'whatsapp', 'facebook', 'instagram', 'twitter', 'email'
    share_url TEXT NOT NULL,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Viral Widgets (Embeddable content)
CREATE TABLE IF NOT EXISTS viral_widgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    widget_type TEXT NOT NULL, -- 'listing_carousel', 'featured_products', 'testimonials'
    widget_code TEXT NOT NULL, -- Embed code
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Referral Stats (Aggregated view)
CREATE TABLE IF NOT EXISTS user_referral_stats (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    total_referrals INTEGER DEFAULT 0,
    successful_referrals INTEGER DEFAULT 0,
    total_earnings NUMERIC(10, 2) DEFAULT 0,
    pending_earnings NUMERIC(10, 2) DEFAULT 0,
    paid_earnings NUMERIC(10, 2) DEFAULT 0,
    bonus_listings_earned INTEGER DEFAULT 0,
    k_factor NUMERIC(5, 2) DEFAULT 0, -- Viral coefficient
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_referral_links_user_id ON referral_links(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_code ON referral_links(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_referrer ON referral_conversions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_referee ON referral_conversions(referee_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_earnings_user_id ON affiliate_earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_earnings_status ON affiliate_earnings(status);
CREATE INDEX IF NOT EXISTS idx_share_tracking_user_id ON share_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_share_tracking_content ON share_tracking(content_type, content_id);

-- Enable RLS
ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE viral_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_referral_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Referral Links
CREATE POLICY "Users can view their own referral links" ON referral_links
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral links" ON referral_links
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update referral link stats" ON referral_links
    FOR UPDATE USING (true);

-- Referral Conversions
CREATE POLICY "Users can view their own conversions" ON referral_conversions
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "System can insert conversions" ON referral_conversions
    FOR INSERT WITH CHECK (true);

-- Affiliate Earnings
CREATE POLICY "Users can view their own earnings" ON affiliate_earnings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert earnings" ON affiliate_earnings
    FOR INSERT WITH CHECK (true);

-- Share Tracking
CREATE POLICY "Users can view their own shares" ON share_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert share tracking" ON share_tracking
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update share stats" ON share_tracking
    FOR UPDATE USING (true);

-- Viral Widgets
CREATE POLICY "Users can view their own widgets" ON viral_widgets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own widgets" ON viral_widgets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own widgets" ON viral_widgets
    FOR UPDATE USING (auth.uid() = user_id);

-- User Referral Stats
CREATE POLICY "Users can view their own stats" ON user_referral_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can update stats" ON user_referral_stats
    FOR ALL USING (true);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 8-character alphanumeric code
        code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM referral_links WHERE referral_code = code) INTO exists;
        
        EXIT WHEN NOT exists;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-create referral link on user signup
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

-- Trigger to auto-create referral link
CREATE TRIGGER auto_create_referral_link
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_referral_link();

-- Function to update referral stats
CREATE OR REPLACE FUNCTION update_referral_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update referrer's stats
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
    
    -- Update referral link stats
    UPDATE referral_links
    SET 
        total_conversions = total_conversions + 1,
        last_used_at = NOW()
    WHERE id = NEW.referral_link_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats on conversion
CREATE TRIGGER update_stats_on_conversion
    AFTER INSERT ON referral_conversions
    FOR EACH ROW
    EXECUTE FUNCTION update_referral_stats();
