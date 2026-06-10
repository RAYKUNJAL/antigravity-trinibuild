-- ============================================================
-- TRINIBUILD — Self-Hosted PostgreSQL Schema
-- Replaces Supabase: local users table replaces auth.users
-- All 4 systems: COD, Affiliate, Documents, Subscriptions
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── AUTH (replaces Supabase Auth) ──────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text,
  phone text,
  email_verified boolean DEFAULT false,
  google_id text UNIQUE,
  facebook_id text UNIQUE,
  role text DEFAULT 'user' CHECK (role IN ('user','merchant','admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  refresh_token text UNIQUE NOT NULL,
  user_agent text,
  ip text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- ─── STORES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  short_slug text UNIQUE,
  description text,
  category text,
  phone text,
  whatsapp text,
  address text,
  logo_url text,
  theme_config jsonb DEFAULT '{}',
  plan_tier text DEFAULT 'free',
  accepts_cod boolean DEFAULT true,
  delivery_radius int DEFAULT 10,
  status text DEFAULT 'active' CHECK (status IN ('active','suspended','closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stores_owner ON stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);

-- ─── PRODUCTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text,
  price numeric NOT NULL DEFAULT 0,
  compare_at_price numeric,
  stock int DEFAULT 0,
  condition text DEFAULT 'new',
  images jsonb DEFAULT '[]',
  sku text,
  status text DEFAULT 'active' CHECK (status IN ('active','draft','sold_out','archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);

-- ─── SYSTEM 1: COD ORDERS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS cod_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  order_ref text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  customer_address text NOT NULL,
  delivery_area text,
  items jsonb NOT NULL DEFAULT '[]',
  subtotal numeric NOT NULL DEFAULT 0,
  delivery_fee numeric DEFAULT 25,
  vat_amount numeric DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  payment_method text DEFAULT 'cod' CHECK (payment_method IN ('cod','bank_transfer','wipay')),
  order_status text DEFAULT 'pending' CHECK (order_status IN ('pending','confirmed','preparing','picked_up','out_for_delivery','delivered','cancelled','returned')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending','collected','verified','refunded')),
  driver_name text,
  driver_phone text,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  whatsapp_sent boolean DEFAULT false,
  cod_commission_rate numeric DEFAULT 0.05,
  cod_commission_amount numeric DEFAULT 0,
  merchant_payout numeric DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cod_orders_store ON cod_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_cod_orders_status ON cod_orders(order_status);
CREATE INDEX IF NOT EXISTS idx_cod_orders_ref ON cod_orders(order_ref);

CREATE TABLE IF NOT EXISTS cod_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cod_order_id uuid REFERENCES cod_orders(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by text DEFAULT 'system',
  note text,
  created_at timestamptz DEFAULT now()
);

-- Commission auto-calc trigger
CREATE OR REPLACE FUNCTION process_cod_order()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.cod_commission_amount := ROUND(NEW.total_amount * NEW.cod_commission_rate, 2);
  NEW.merchant_payout := NEW.total_amount - NEW.cod_commission_amount;
  NEW.updated_at := now();
  IF (TG_OP = 'UPDATE' AND OLD.order_status IS DISTINCT FROM NEW.order_status) THEN
    INSERT INTO cod_status_history (cod_order_id, old_status, new_status)
    VALUES (NEW.id, OLD.order_status, NEW.order_status);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_process_cod_order ON cod_orders;
CREATE TRIGGER trg_process_cod_order
  BEFORE INSERT OR UPDATE ON cod_orders
  FOR EACH ROW EXECUTE FUNCTION process_cod_order();

-- ─── SYSTEM 2: AFFILIATE ────────────────────────────────────
CREATE TABLE IF NOT EXISTS affiliate_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  referral_code text UNIQUE NOT NULL,
  tier text DEFAULT 'bronze' CHECK (tier IN ('bronze','silver','gold','platinum')),
  commission_rate numeric DEFAULT 0.10,
  total_referrals int DEFAULT 0,
  paid_referrals int DEFAULT 0,
  total_earned_ttd numeric DEFAULT 0,
  pending_payout_ttd numeric DEFAULT 0,
  paid_out_ttd numeric DEFAULT 0,
  bank_name text,
  bank_account_name text,
  bank_account_number text,
  bank_branch text,
  wipay_phone text,
  payout_method text DEFAULT 'bank' CHECK (payout_method IN ('bank','wipay','credit')),
  status text DEFAULT 'active',
  joined_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_affiliate_code ON affiliate_profiles(referral_code);

CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES affiliate_profiles(id) ON DELETE CASCADE,
  referred_user_id uuid REFERENCES users(id),
  referred_email text,
  referral_code text,
  status text DEFAULT 'signed_up' CHECK (status IN ('signed_up','store_created','first_order','subscription','qualified')),
  commission_ttd numeric DEFAULT 0,
  commission_paid boolean DEFAULT false,
  event_date timestamptz DEFAULT now(),
  subscription_plan text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS affiliate_payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES affiliate_profiles(id) ON DELETE CASCADE,
  amount_ttd numeric NOT NULL,
  method text NOT NULL CHECK (method IN ('bank','wipay','credit')),
  bank_details jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','rejected')),
  reference text,
  processed_at timestamptz,
  admin_notes text,
  created_at timestamptz DEFAULT now()
);

-- Tier auto-upgrade trigger
CREATE OR REPLACE FUNCTION upgrade_affiliate_tier()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.paid_referrals >= 50 THEN NEW.tier := 'platinum'; NEW.commission_rate := 0.20;
  ELSIF NEW.paid_referrals >= 20 THEN NEW.tier := 'gold'; NEW.commission_rate := 0.17;
  ELSIF NEW.paid_referrals >= 5 THEN NEW.tier := 'silver'; NEW.commission_rate := 0.13;
  ELSE NEW.tier := 'bronze'; NEW.commission_rate := 0.10;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_upgrade_affiliate ON affiliate_profiles;
CREATE TRIGGER trg_upgrade_affiliate
  BEFORE UPDATE ON affiliate_profiles
  FOR EACH ROW EXECUTE FUNCTION upgrade_affiliate_tier();

-- ─── SYSTEM 3: AI DOCUMENTS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS document_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  fields jsonb NOT NULL DEFAULT '{}',
  generated_content text,
  pdf_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','generating','complete','failed')),
  is_free boolean DEFAULT false,
  price_ttd numeric DEFAULT 0,
  paid boolean DEFAULT false,
  payment_method text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_doc_orders_user ON document_orders(user_id);

-- ─── SYSTEM 4: SUBSCRIPTIONS ────────────────────────────────
CREATE TABLE IF NOT EXISTS plan_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  price_ttd numeric NOT NULL DEFAULT 0,
  is_free_for_life boolean DEFAULT false,
  features jsonb DEFAULT '[]',
  max_products int DEFAULT 10,
  max_stores int DEFAULT 1,
  ai_documents boolean DEFAULT false,
  ai_listing boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

INSERT INTO plan_tiers (slug, name, price_ttd, is_free_for_life, max_products, max_stores, ai_documents, ai_listing, features)
VALUES
  ('free', 'Free for Life', 0, true, 10, 1, false, false, '["10 product listings","1 store","COD checkout","WhatsApp sharing","Basic analytics"]'),
  ('pro', 'Pro', 199, false, 999999, 3, true, true, '["Unlimited products","3 stores","AI listings","AI documents","Priority support","VAT tracking","QR reservations"]'),
  ('premium', 'Premium', 399, false, 999999, 10, true, true, '["Everything in Pro","10 stores","Custom domain","API access","Dedicated support","White-label option"]')
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS bank_subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  plan_slug text REFERENCES plan_tiers(slug),
  amount_ttd numeric NOT NULL,
  bank_name text,
  branch text,
  account_number text,
  account_name text DEFAULT 'R&R Digital Solutions Ltd',
  reference_code text UNIQUE NOT NULL,
  proof_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','submitted','verified','rejected','expired')),
  months_paid int DEFAULT 1,
  period_start date,
  period_end date,
  verified_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_plan_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  plan_slug text REFERENCES plan_tiers(slug) DEFAULT 'free',
  source text DEFAULT 'free' CHECK (source IN ('free','paypal','bank_pay','promo','admin')),
  paypal_subscription_id text,
  bank_payment_id uuid REFERENCES bank_subscription_payments(id),
  status text DEFAULT 'active' CHECK (status IN ('active','cancelled','expired','paused')),
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Auto-assign free plan on user signup
CREATE OR REPLACE FUNCTION assign_free_plan_on_signup()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO user_plan_subscriptions (user_id, plan_slug, source, status)
  VALUES (NEW.id, 'free', 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_user_signup_plan ON users;
CREATE TRIGGER on_user_signup_plan
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION assign_free_plan_on_signup();
