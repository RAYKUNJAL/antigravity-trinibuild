-- =====================================================
-- JUVAY FOUNDATION MIGRATION
-- Caribbean Commerce Platform — v1.0
-- Covers: plan tiers, island config, events tracking,
--         store bot fields, anon order path, data consent
-- =====================================================

-- =============================================
-- 1. ISLAND CONFIG
-- Every user and store is tagged to an island
-- This is the expansion architecture
-- =============================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS island TEXT NOT NULL DEFAULT 'tt',
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'TTD',
  ADD COLUMN IF NOT EXISTS data_consent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS data_consent_at TIMESTAMPTZ;

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS island TEXT NOT NULL DEFAULT 'tt',
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'TTD',
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS bot_name TEXT DEFAULT 'Store Assistant',
  ADD COLUMN IF NOT EXISTS bot_persona TEXT DEFAULT 'support_bot',
  ADD COLUMN IF NOT EXISTS bot_system_prompt TEXT,
  ADD COLUMN IF NOT EXISTS bot_enabled BOOLEAN DEFAULT FALSE;

-- =============================================
-- 2. PLAN TIERS
-- Free / Pro / Premium — the commercial engine
-- =============================================
CREATE TABLE IF NOT EXISTS public.plan_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price_ttd INTEGER NOT NULL DEFAULT 0,
  price_usd DECIMAL(10,2) NOT NULL DEFAULT 0,
  paypal_plan_id TEXT,
  is_free_for_life BOOLEAN DEFAULT FALSE,
  max_stores INTEGER DEFAULT 1,
  max_products INTEGER DEFAULT 10,
  ai_chatbot BOOLEAN DEFAULT FALSE,
  ai_listings INTEGER DEFAULT 0,
  ai_documents BOOLEAN DEFAULT FALSE,
  email_marketing BOOLEAN DEFAULT FALSE,
  custom_domain BOOLEAN DEFAULT FALSE,
  remove_branding BOOLEAN DEFAULT FALSE,
  analytics TEXT DEFAULT 'basic',
  support TEXT DEFAULT 'community',
  features JSONB DEFAULT '[]',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the three plans
INSERT INTO public.plan_tiers
  (slug, name, price_ttd, price_usd, paypal_plan_id, is_free_for_life,
   max_stores, max_products, ai_chatbot, ai_listings, ai_documents,
   email_marketing, custom_domain, remove_branding, analytics, support,
   features, sort_order)
VALUES
(
  'free', 'Free', 0, 0.00, NULL, TRUE,
  1, 10, FALSE, 0, FALSE,
  FALSE, FALSE, FALSE, 'basic', 'community',
  '["1 store","10 product listings","COD checkout","WhatsApp order sharing",
    "Basic analytics","TriniBuild/Juvay branding","Community support"]',
  1
),
(
  'pro', 'Pro', 300, 44.00,
  'P-3A045277MX126054ENI7CBQI',
  FALSE,
  3, 50, TRUE, 25, TRUE,
  TRUE, TRUE, TRUE, 'advanced', 'email',
  '["3 stores","50 products per store","AI customer chatbot","Train bot on your business",
    "25 AI product listings/month","AI document generator","Email marketing (500/mo)",
    "Remove Juvay branding","Custom domain","Discount codes","Advanced analytics",
    "PayPal & COD payments","Priority marketplace listing","Email support (24hr)"]',
  2
),
(
  'premium', 'Premium', 600, 88.00,
  'P-1P442497BH231723RNI7CBQI',
  FALSE,
  10, -1, TRUE, -1, TRUE,
  TRUE, TRUE, TRUE, 'enterprise', 'priority',
  '["Unlimited stores","Unlimited products","Everything in Pro","Unlimited AI listings",
    "Unlimited AI documents","Unlimited email marketing","White-label option",
    "API access","Multi-location","5 staff accounts","Custom integrations",
    "Priority phone support","Dedicated account manager","Driver fleet management",
    "Marketplace featured placement"]',
  3
)
ON CONFLICT (slug) DO UPDATE SET
  price_ttd = EXCLUDED.price_ttd,
  price_usd = EXCLUDED.price_usd,
  paypal_plan_id = EXCLUDED.paypal_plan_id,
  max_stores = EXCLUDED.max_stores,
  max_products = EXCLUDED.max_products,
  ai_chatbot = EXCLUDED.ai_chatbot,
  ai_listings = EXCLUDED.ai_listings,
  features = EXCLUDED.features;

-- =============================================
-- 3. USER PLAN SUBSCRIPTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_plan_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_slug TEXT REFERENCES public.plan_tiers(slug) DEFAULT 'free',
  status TEXT DEFAULT 'active' CHECK (status IN ('active','cancelled','expired','past_due')),
  source TEXT DEFAULT 'free' CHECK (source IN ('free','paypal','bank_pay','admin')),
  paypal_subscription_id TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_plan_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON public.user_plan_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscription" ON public.user_plan_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role manages subscriptions" ON public.user_plan_subscriptions
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- =============================================
-- 4. BANK SUBSCRIPTION PAYMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.bank_subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_slug TEXT REFERENCES public.plan_tiers(slug),
  amount_ttd DECIMAL(10,2) NOT NULL,
  bank_name TEXT,
  branch TEXT,
  account_number TEXT,
  account_name TEXT,
  reference_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','submitted','verified','rejected')),
  proof_url TEXT,
  months_paid INTEGER DEFAULT 1,
  period_start DATE,
  period_end DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bank_subscription_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bank payments" ON public.bank_subscription_payments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bank payments" ON public.bank_subscription_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bank payments" ON public.bank_subscription_payments
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 5. PLATFORM EVENTS — the data layer
-- Every search, click, purchase gets logged here.
-- This is the foundation of the ad network.
-- =============================================
CREATE TABLE IF NOT EXISTS public.platform_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  island TEXT DEFAULT 'tt',
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_platform_events_user ON public.platform_events(user_id);
CREATE INDEX idx_platform_events_type ON public.platform_events(event_type);
CREATE INDEX idx_platform_events_category ON public.platform_events(event_category);
CREATE INDEX idx_platform_events_island ON public.platform_events(island);
CREATE INDEX idx_platform_events_created ON public.platform_events(created_at DESC);

ALTER TABLE public.platform_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own events" ON public.platform_events
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Service role reads all events" ON public.platform_events
  FOR SELECT USING (auth.jwt()->>'role' = 'service_role');

-- =============================================
-- 6. AUTO-PROVISION FREE PLAN ON SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user_plan()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_plan_subscriptions (user_id, plan_slug, source, status)
  VALUES (NEW.id, 'free', 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_plan ON auth.users;
CREATE TRIGGER on_auth_user_plan
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_plan();

-- =============================================
-- 7. ANON ORDER INSERT — fix guest COD checkout
-- Allows anonymous users to place COD orders
-- =============================================
DROP POLICY IF EXISTS "Anon can create orders" ON public.orders;
CREATE POLICY "Anon can create orders" ON public.orders
  FOR INSERT WITH CHECK (true);

-- =============================================
-- 8. STORE COUNT LIMIT FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.check_store_limit(p_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_max_stores INTEGER;
  v_current_count INTEGER;
BEGIN
  SELECT pt.max_stores INTO v_max_stores
  FROM public.user_plan_subscriptions ups
  JOIN public.plan_tiers pt ON pt.slug = ups.plan_slug
  WHERE ups.user_id = p_user_id AND ups.status = 'active'
  LIMIT 1;

  IF v_max_stores IS NULL THEN v_max_stores := 1; END IF;
  IF v_max_stores = -1 THEN RETURN TRUE; END IF;

  SELECT COUNT(*) INTO v_current_count
  FROM public.stores
  WHERE owner_id = p_user_id AND status != 'rejected';

  RETURN v_current_count < v_max_stores;
END;
$$;

-- =============================================
-- 9. PAYMENT TRANSACTIONS — COD tracking
-- =============================================
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID,
  method TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'TTD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded')),
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  bank_details JSONB,
  reference TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert payment_transactions" ON public.payment_transactions
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role manages transactions" ON public.payment_transactions
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- =============================================
-- 10. ISLAND CONFIG TABLE
-- Drives currency, payment methods, locale per island
-- =============================================
CREATE TABLE IF NOT EXISTS public.island_config (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  flag TEXT,
  currency_code TEXT NOT NULL,
  currency_symbol TEXT NOT NULL,
  exchange_rate_usd DECIMAL(10,4) NOT NULL DEFAULT 1.0,
  wipay_region TEXT,
  phone_prefix TEXT,
  active BOOLEAN DEFAULT TRUE
);

INSERT INTO public.island_config
  (id, name, flag, currency_code, currency_symbol, exchange_rate_usd, wipay_region, phone_prefix)
VALUES
  ('tt', 'Trinidad & Tobago', '🇹🇹', 'TTD', 'TT$', 6.80, 'tt', '+1-868'),
  ('jm', 'Jamaica',           '🇯🇲', 'JMD', 'J$',  157.0, 'jm', '+1-876'),
  ('bb', 'Barbados',          '🇧🇧', 'BBD', 'Bds$',  2.02, 'bb', '+1-246'),
  ('gy', 'Guyana',            '🇬🇾', 'GYD', 'G$',  209.0, 'gy', '+592'),
  ('lc', 'Saint Lucia',       '🇱🇨', 'XCD', 'EC$',  2.70, 'lc', '+1-758'),
  ('gd', 'Grenada',           '🇬🇩', 'XCD', 'EC$',  2.70, 'gd', '+1-473'),
  ('vc', 'St. Vincent',       '🇻🇨', 'XCD', 'EC$',  2.70, 'vc', '+1-784'),
  ('ag', 'Antigua & Barbuda', '🇦🇬', 'XCD', 'EC$',  2.70, 'ag', '+1-268'),
  ('bz', 'Belize',            '🇧🇿', 'BZD', 'BZ$',  2.00, NULL, '+501'),
  ('dm', 'Dominica',          '🇩🇲', 'XCD', 'EC$',  2.70, NULL, '+1-767')
ON CONFLICT (id) DO NOTHING;
