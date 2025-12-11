-- Migration: 19_subscription_system.sql
-- Description: Adds subscription plans and store subscription tracking with 4-tier model

-- ============================================
-- 1. SUBSCRIPTION PLANS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id TEXT PRIMARY KEY, -- 'hustle', 'storefront', 'growth', 'empire'
    name TEXT NOT NULL,
    price_ttd DECIMAL(10, 2) NOT NULL DEFAULT 0,
    tagline TEXT,
    killer_feature TEXT,
    features JSONB DEFAULT '[]'::jsonb, -- Array of strings
    limits JSONB DEFAULT '{}'::jsonb, -- {"products": 15, "staff": 1}
    icon TEXT,
    target_user TEXT,
    
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 2. STORE SUBSCRIPTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.store_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    plan_id TEXT REFERENCES public.subscription_plans(id) NOT NULL,
    
    status TEXT DEFAULT 'active', -- 'active', 'past_due', 'cancelled'
    
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE, -- Null means lifetime/indefinite (for free tier)
    
    cancel_at_period_end BOOLEAN DEFAULT false,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(store_id) -- One active subscription per store (historical records can be archived elsewhere if needed)
);

-- ============================================
-- 3. UPDATE STORES TABLE
-- ============================================

-- Add cached plan_tier for easy access (e.g., used in RLS policies)
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS plan_tier TEXT DEFAULT 'hustle';
ALTER TABLE public.stores ADD CONSTRAINT fk_plan_tier FOREIGN KEY (plan_tier) REFERENCES public.subscription_plans(id);

-- ============================================
-- 4. SEED DATA (THE 4 TIERS)
-- ============================================

INSERT INTO public.subscription_plans (id, name, price_ttd, tagline, killer_feature, features, limits, icon, target_user)
VALUES 
(
    'hustle', 
    'The Hustle', 
    0, 
    'Start Tonight. Risk Free.', 
    '5% Transaction Fee (We only eat if you eat)', 
    '["1 TriniBuild Storefront", "15 Products", "TriniBuild Go Delivery Access", "Basic SEO & Analytics", "In-app Messaging", "Auto Income Dashboard", "Hosted at yourstore.trinibuild.com"]'::jsonb,
    '{"products": 15, "staff": 1, "custom_domain": false, "pos": false}'::jsonb,
    '🆓',
    'Beginners and side hustlers'
),
(
    'storefront', 
    'The Storefront', 
    100, 
    'Your Brand. Your Rules.', 
    '0% Transaction Fees (Keep 100% of your sales)', 
    '["Everything in The Hustle +", "Custom Domain (.com)", "Remove TriniBuild Branding", "50 Products", "Full Theme Customization", "Abandoned Cart Emails", "Email Capture Popups", "Marketplace Boost"]'::jsonb,
    '{"products": 50, "staff": 2, "custom_domain": true, "pos": false}'::jsonb,
    '🏢',
    'Growing vendors seeking legitimacy'
),
(
    'growth', 
    'The Growth', 
    200, 
    'Business on Autopilot.', 
    'WhatsApp Order Alerts & Abandoned Cart Recovery', 
    '["Everything in The Storefront +", "Unlimited Products", "Advanced Analytics Dashboard", "Discount Codes & Coupons", "AI SEO Optimizer", "AI Marketing Assistant", "Social Media Automation"]'::jsonb,
    '{"products": 999999, "staff": 5, "custom_domain": true, "pos": false}'::jsonb,
    '🚀',
    'Serious entrepreneurs scaling operations'
),
(
    'empire', 
    'The Empire', 
    400, 
    'The VIP Treatment.', 
    'We Build It Service (One-time setup included)', 
    '["Everything in The Growth +", "Staff Accounts", "POS Mode for Physical Shop", "Priority Support", "Professional Store Setup", "Early Feature Access"]'::jsonb,
    '{"products": 999999, "staff": 999, "custom_domain": true, "pos": true}'::jsonb,
    '👑',
    'Established brands and enterprises'
)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    price_ttd = EXCLUDED.price_ttd,
    tagline = EXCLUDED.tagline,
    killer_feature = EXCLUDED.killer_feature,
    features = EXCLUDED.features,
    limits = EXCLUDED.limits,
    icon = EXCLUDED.icon,
    target_user = EXCLUDED.target_user;

-- ============================================
-- 5. RLS POLICIES
-- ============================================

-- Subscription Plans (Public Read)
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subscription plans are viewable by everyone" ON public.subscription_plans FOR SELECT USING (true);

-- Store Subscriptions
ALTER TABLE public.store_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners can view their subscription" ON public.store_subscriptions FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.stores WHERE id = store_subscriptions.store_id AND owner_id = auth.uid()));

-- ============================================
-- 6. TRIGGERS & FUNCTIONS
-- ============================================

-- Function to keep stores.plan_tier synced with active subscription
CREATE OR REPLACE FUNCTION public.sync_store_plan_tier()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.stores
    SET plan_tier = NEW.plan_id
    WHERE id = NEW.store_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on subscription update/insert
CREATE TRIGGER on_subscription_change
AFTER INSERT OR UPDATE OF plan_id ON public.store_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.sync_store_plan_tier();

-- Function to auto-subscribe new stores to 'hustle' plan
CREATE OR REPLACE FUNCTION public.handle_new_store_subscription()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default 'hustle' subscription for new store
    INSERT INTO public.store_subscriptions (store_id, plan_id, status)
    VALUES (NEW.id, 'hustle', 'active');
    
    -- Function sync_store_plan_tier will handle the update to stores.plan_tier
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on new store creation
DROP TRIGGER IF EXISTS on_store_created_subscription ON public.stores;
CREATE TRIGGER on_store_created_subscription
AFTER INSERT ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_store_subscription();

