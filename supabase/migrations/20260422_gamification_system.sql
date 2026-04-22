-- ============================================================================
-- GAMIFICATION SYSTEM - COMPLETE SUPABASE MIGRATION
-- ============================================================================
-- Tables: loyalty points, spin wheel, daily streaks, badges, mini-games, referrals
-- RLS Policies: User-based access control
-- ============================================================================

-- 1. USER LOYALTY POINTS TABLE
CREATE TABLE IF NOT EXISTS user_loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  total_points INT DEFAULT 0,
  available_points INT DEFAULT 0,
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  lifetime_purchases DECIMAL(10,2) DEFAULT 0,
  streak_count INT DEFAULT 0,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. SPIN WHEEL RESULTS TABLE
CREATE TABLE IF NOT EXISTS spin_wheel_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('consolation', 'win', 'big_win', 'mega_win')),
  discount_percentage INT NOT NULL,
  coupon_code TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DAILY STREAKS TABLE
CREATE TABLE IF NOT EXISTS daily_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_login DATE DEFAULT CURRENT_DATE,
  freeze_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 4. ACHIEVEMENT BADGES TABLE
CREATE TABLE IF NOT EXISTS achievement_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- 5. BADGE DEFINITIONS TABLE
CREATE TABLE IF NOT EXISTS badge_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  unlock_condition TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. MINI GAMES TABLE
CREATE TABLE IF NOT EXISTS mini_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  game_type TEXT NOT NULL CHECK (game_type IN ('scratch_card', 'lucky_pick', 'trivia', 'daily_spin')),
  name TEXT NOT NULL,
  description TEXT,
  plays_remaining INT DEFAULT 1,
  max_plays INT DEFAULT 1,
  reward_type TEXT CHECK (reward_type IN ('points', 'coupon', 'badge')),
  reward_amount INT DEFAULT 0,
  last_played TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_type)
);

-- 7. GAME PLAYS LOG TABLE
CREATE TABLE IF NOT EXISTS game_plays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  game_id UUID REFERENCES mini_games,
  game_type TEXT NOT NULL,
  result TEXT,
  reward INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. LOYALTY ACTIVITIES LOG TABLE
CREATE TABLE IF NOT EXISTS loyalty_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  action TEXT NOT NULL,
  points_change INT DEFAULT 0,
  reason TEXT,
  new_balance INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. REFERRAL REWARDS TABLE
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES auth.users NOT NULL,
  referee_id UUID REFERENCES auth.users,
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days')
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_loyalty_user_id ON user_loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_spin_wheel_user_id ON spin_wheel_results(user_id);
CREATE INDEX IF NOT EXISTS idx_spin_wheel_created_at ON spin_wheel_results(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_streaks_user_id ON daily_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_badges_user_id ON achievement_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_mini_games_user_id ON mini_games(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_activities_user_id ON loyalty_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_referrer ON referral_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_code ON referral_rewards(referral_code);

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- USER LOYALTY POINTS RLS
ALTER TABLE user_loyalty_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own loyalty"
ON user_loyalty_points
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own loyalty"
ON user_loyalty_points
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own loyalty"
ON user_loyalty_points
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- SPIN WHEEL RESULTS RLS
ALTER TABLE spin_wheel_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own spins"
ON spin_wheel_results
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own spins"
ON spin_wheel_results
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own spins"
ON spin_wheel_results
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DAILY STREAKS RLS
ALTER TABLE daily_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streaks"
ON daily_streaks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own streaks"
ON daily_streaks
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ACHIEVEMENT BADGES RLS
ALTER TABLE achievement_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own badges"
ON achievement_badges
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can earn badges"
ON achievement_badges
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- MINI GAMES RLS
ALTER TABLE mini_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own games"
ON mini_games
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own games"
ON mini_games
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- GAME PLAYS RLS
ALTER TABLE game_plays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plays"
ON game_plays
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can log own plays"
ON game_plays
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- LOYALTY ACTIVITIES RLS
ALTER TABLE loyalty_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activities"
ON loyalty_activities
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can log activities"
ON loyalty_activities
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- REFERRAL REWARDS RLS
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals"
ON referral_rewards
FOR SELECT
USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "Users can create referrals"
ON referral_rewards
FOR INSERT
WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Users can update referrals"
ON referral_rewards
FOR UPDATE
USING (auth.uid() = referrer_id)
WITH CHECK (auth.uid() = referrer_id);

-- BADGE DEFINITIONS (Public read)
ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges"
ON badge_definitions
FOR SELECT
USING (TRUE);

-- ============================================================================
-- SAMPLE BADGE DEFINITIONS
-- ============================================================================

INSERT INTO badge_definitions (code, name, description, icon, rarity, unlock_condition)
VALUES
  ('first_purchase', 'First Time Buyer', 'Made your first purchase', '🎯', 'common', 'Complete 1 purchase'),
  ('loyal_customer', 'Loyal Customer', 'Spent over TT$5,000', '💎', 'rare', 'Lifetime purchases > TT$5000'),
  ('streak_master', '7-Day Streak', 'Logged in 7 days straight', '🔥', 'rare', 'Current streak = 7'),
  ('spin_winner', 'Lucky Winner', 'Won on the spin wheel', '🎡', 'common', 'Spin wheel result = win'),
  ('mega_winner', 'Mega Winner', 'Won 50% off on spin wheel', '🎊', 'epic', 'Spin wheel result = mega_win'),
  ('points_millionaire', 'Points Millionaire', 'Accumulated 10,000+ points', '👑', 'legendary', 'Total points > 10000'),
  ('referral_master', 'Referral Master', 'Referred 5+ customers', '📱', 'epic', 'Successful referrals >= 5'),
  ('game_master', 'Game Master', 'Played all mini-games', '🎮', 'rare', 'Played scratch, lucky, trivia'),
  ('early_adopter', 'Early Adopter', 'Joined in first month', '🌟', 'epic', 'Account age < 30 days'),
  ('vip_member', 'VIP Member', 'Platinum tier loyalty', '👑', 'legendary', 'Loyalty tier = platinum');

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATE
-- ============================================================================

-- Auto-update user_loyalty_points updated_at
CREATE OR REPLACE FUNCTION update_loyalty_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_loyalty_updated_at
BEFORE UPDATE ON user_loyalty_points
FOR EACH ROW
EXECUTE FUNCTION update_loyalty_timestamp();

-- Auto-update mini_games updated_at
CREATE OR REPLACE FUNCTION update_game_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_game_updated_at
BEFORE UPDATE ON mini_games
FOR EACH ROW
EXECUTE FUNCTION update_game_timestamp();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate user tier
CREATE OR REPLACE FUNCTION calculate_user_tier(points INT)
RETURNS TEXT AS $$
BEGIN
  IF points >= 10000 THEN RETURN 'platinum';
  ELSIF points >= 5000 THEN RETURN 'gold';
  ELSIF points >= 2000 THEN RETURN 'silver';
  ELSE RETURN 'bronze';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to add loyalty points with auto-tier update
CREATE OR REPLACE FUNCTION add_loyalty_points(
  user_id_param UUID,
  points_to_add INT,
  reason_text TEXT
)
RETURNS user_loyalty_points AS $$
DECLARE
  result user_loyalty_points;
BEGIN
  INSERT INTO user_loyalty_points (user_id, total_points, available_points)
  VALUES (user_id_param, points_to_add, points_to_add)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    total_points = user_loyalty_points.total_points + points_to_add,
    available_points = user_loyalty_points.available_points + points_to_add,
    tier = calculate_user_tier(user_loyalty_points.total_points + points_to_add)
  RETURNING * INTO result;

  INSERT INTO loyalty_activities (user_id, action, points_change, reason, new_balance)
  VALUES (user_id_param, 'points_earned', points_to_add, reason_text, result.total_points);

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Run this migration with:
-- supabase db push
-- ============================================================================
