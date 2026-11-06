-- Juvay store-core Phase 1 migration DRAFT
-- Target: existing Postgres used by server/index.js (DATABASE_URL)
-- DO NOT apply from architect agent; Lead/Code apply after named cut.
-- Date: 2026-11-06
-- Depends on: deploy/schema.sql, deploy/schema-wam.sql, plan_tiers, stores, products, cod_orders, wam_payments

BEGIN;

-- ─── Plans: unlimited free + fee columns ─────────────────────
ALTER TABLE plan_tiers
  ADD COLUMN IF NOT EXISTS juvay_fee_bps int NOT NULL DEFAULT 450,
  ADD COLUMN IF NOT EXISTS cod_handling_fee_cents int NOT NULL DEFAULT 1000;

UPDATE plan_tiers SET
  max_products = -1,
  juvay_fee_bps = 450,
  cod_handling_fee_cents = 1000,
  features = '["Unlimited product listings","1 store","Cash pickup","COD with handling fee","juvay.app slug","Wam online pay when configured"]'
WHERE slug = 'free';

-- Map premium-like tiers if present (pro/premium/starter/business — update what exists)
UPDATE plan_tiers SET juvay_fee_bps = 300, max_products = -1
WHERE slug IN ('pro','premium','starter','business');

-- ─── Wam countries (single source) ───────────────────────────
CREATE TABLE IF NOT EXISTS wam_countries (
  id text PRIMARY KEY,              -- tt, jm, bb, ...
  name text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('tier1_full','tier2_global','tier3_case','blocked')),
  currency_code text,
  phone_prefix text,
  flag text,
  ads_priority int NOT NULL DEFAULT 100,  -- lower = sooner
  active boolean NOT NULL DEFAULT true,
  source_checked_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO wam_countries (id, name, tier, currency_code, phone_prefix, ads_priority, source_checked_on) VALUES
  ('tt','Trinidad & Tobago','tier1_full','TTD','+1-868',1, DATE '2026-11-06'),
  ('ai','Anguilla','tier2_global',NULL,'+1-264',20, DATE '2026-11-06'),
  ('ag','Antigua & Barbuda','tier2_global','XCD','+1-268',20, DATE '2026-11-06'),
  ('aw','Aruba','tier2_global',NULL,'+297',30, DATE '2026-11-06'),
  ('bs','Bahamas','tier2_global',NULL,'+1-242',15, DATE '2026-11-06'),
  ('bb','Barbados','tier2_global','BBD','+1-246',10, DATE '2026-11-06'),
  ('bz','Belize','tier2_global','BZD','+501',25, DATE '2026-11-06'),
  ('bm','Bermuda','tier2_global',NULL,'+1-441',40, DATE '2026-11-06'),
  ('bq','Bonaire, St. Eustatius & Saba','tier2_global',NULL,NULL,40, DATE '2026-11-06'),
  ('ky','Cayman Islands','tier2_global',NULL,'+1-345',25, DATE '2026-11-06'),
  ('cw','Curaçao','tier2_global',NULL,'+599',30, DATE '2026-11-06'),
  ('dm','Dominica','tier2_global','XCD','+1-767',20, DATE '2026-11-06'),
  ('do','Dominican Republic','tier2_global',NULL,'+1-809',15, DATE '2026-11-06'),
  ('gd','Grenada','tier2_global','XCD','+1-473',20, DATE '2026-11-06'),
  ('gp','Guadeloupe','tier2_global',NULL,'+590',35, DATE '2026-11-06'),
  ('gy','Guyana','tier2_global','GYD','+592',12, DATE '2026-11-06'),
  ('jm','Jamaica','tier2_global','JMD','+1-876',10, DATE '2026-11-06'),
  ('mq','Martinique','tier2_global',NULL,'+596',35, DATE '2026-11-06'),
  ('ms','Montserrat','tier2_global','XCD','+1-664',40, DATE '2026-11-06'),
  ('pr','Puerto Rico','tier2_global','USD','+1-787',25, DATE '2026-11-06'),
  ('lc','Saint Lucia','tier2_global','XCD','+1-758',18, DATE '2026-11-06'),
  ('sx','Sint Maarten (Dutch)','tier2_global',NULL,'+1-721',35, DATE '2026-11-06'),
  ('bl','St. Barthélemy','tier2_global',NULL,'+590',45, DATE '2026-11-06'),
  ('kn','St. Kitts & Nevis','tier2_global','XCD','+1-869',20, DATE '2026-11-06'),
  ('mf','St. Martin (French)','tier2_global',NULL,'+590',45, DATE '2026-11-06'),
  ('vc','St. Vincent & the Grenadines','tier2_global','XCD','+1-784',20, DATE '2026-11-06'),
  ('sr','Suriname','tier2_global',NULL,'+597',25, DATE '2026-11-06'),
  ('tc','Turks & Caicos','tier2_global',NULL,'+1-649',30, DATE '2026-11-06'),
  ('vi','US Virgin Islands','tier2_global','USD','+1-340',25, DATE '2026-11-06'),
  ('vg','British Virgin Islands','tier3_case',NULL,'+1-284',90, DATE '2026-11-06'),
  ('ht','Haiti','tier3_case',NULL,'+509',90, DATE '2026-11-06'),
  ('cu','Cuba','blocked',NULL,NULL,999, DATE '2026-11-06')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  tier = EXCLUDED.tier,
  currency_code = EXCLUDED.currency_code,
  phone_prefix = EXCLUDED.phone_prefix,
  ads_priority = EXCLUDED.ads_priority,
  source_checked_on = EXCLUDED.source_checked_on,
  updated_at = now();

UPDATE wam_countries SET active = false WHERE tier = 'blocked';

-- ─── Stores extensions ───────────────────────────────────────
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS country_code text REFERENCES wam_countries(id),
  ADD COLUMN IF NOT EXISTS theme_id text,
  ADD COLUMN IF NOT EXISTS premium_branding boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cod_handling_fee_cents int,
  ADD COLUMN IF NOT EXISTS cod_min_order_cents int,
  ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz;

-- ─── Products: priced active listings ────────────────────────
-- Application layer must enforce; optional CHECK if column numeric:
-- ALTER TABLE products ADD CONSTRAINT products_active_price_positive
--   CHECK (status <> 'active' OR price > 0);

-- ─── Unified store orders (Phase 1) ──────────────────────────
CREATE TABLE IF NOT EXISTS store_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_ref text UNIQUE NOT NULL,
  buyer_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  buyer_name text NOT NULL,
  buyer_phone text NOT NULL,
  buyer_email text,
  buyer_address text,
  fulfillment text NOT NULL CHECK (fulfillment IN ('delivery','pickup')),
  payment_method text NOT NULL CHECK (payment_method IN ('wam','cod','cash_pickup')),
  currency text NOT NULL DEFAULT 'TTD',
  subtotal_cents int NOT NULL CHECK (subtotal_cents >= 0),
  delivery_fee_cents int NOT NULL DEFAULT 0,
  handling_fee_cents int NOT NULL DEFAULT 0,
  juvay_fee_cents int NOT NULL DEFAULT 0,
  wam_fee_cents int NOT NULL DEFAULT 0,
  total_cents int NOT NULL CHECK (total_cents >= 0),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending','awaiting_payment','paid','awaiting_dispatch_confirm',
      'confirmed','preparing','out_for_delivery','delivered',
      'cancelled','refused','refunded'
    )),
  payment_status text NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending','authorized','captured','collected','failed','refunded')),
  buyer_otp_verified_at timestamptz,
  dispatch_confirmed_at timestamptz,
  delivery_otp_verified_at timestamptz,
  refused_at timestamptz,
  refusal_reason text,
  items jsonb NOT NULL DEFAULT '[]',
  quote_snapshot jsonb NOT NULL DEFAULT '{}',
  cod_order_id uuid REFERENCES cod_orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_store_orders_store ON store_orders (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_orders_status ON store_orders (status);
CREATE INDEX IF NOT EXISTS idx_store_orders_phone ON store_orders (buyer_phone);

-- ─── COD order control columns ───────────────────────────────
ALTER TABLE cod_orders
  ADD COLUMN IF NOT EXISTS buyer_otp_hash text,
  ADD COLUMN IF NOT EXISTS buyer_otp_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivery_otp_hash text,
  ADD COLUMN IF NOT EXISTS delivery_otp_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS dispatch_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS dispatch_confirmed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS refused_at timestamptz,
  ADD COLUMN IF NOT EXISTS refusal_reason text,
  ADD COLUMN IF NOT EXISTS handling_fee_cents int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS store_order_id uuid REFERENCES store_orders(id) ON DELETE SET NULL;

-- ─── Wam payments fulfill columns ────────────────────────────
ALTER TABLE wam_payments
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES store_orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS juvay_fee_cents int,
  ADD COLUMN IF NOT EXISTS wam_fee_cents int,
  ADD COLUMN IF NOT EXISTS merchant_net_cents int,
  ADD COLUMN IF NOT EXISTS fulfilled_at timestamptz;

-- Expand status check: recreate constraint safely
ALTER TABLE wam_payments DROP CONSTRAINT IF EXISTS wam_payments_status_check;
ALTER TABLE wam_payments ADD CONSTRAINT wam_payments_status_check
  CHECK (status IN ('pending','recorded','captured','fulfilled','rejected','duplicate','failed'));

CREATE INDEX IF NOT EXISTS idx_wam_payments_order ON wam_payments (order_id);

-- ─── Immutable ledger ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_id uuid REFERENCES store_orders(id) ON DELETE SET NULL,
  wam_payment_id uuid REFERENCES wam_payments(id) ON DELETE SET NULL,
  entry_type text NOT NULL CHECK (entry_type IN (
    'sale_gross','juvay_fee','wam_fee','merchant_net',
    'cod_handling','cod_refusal','payout','adjustment'
  )),
  amount_cents int NOT NULL,          -- signed: fees negative for merchant view optional; prefer positive + direction
  direction text NOT NULL CHECK (direction IN ('credit','debit')),
  currency text NOT NULL DEFAULT 'TTD',
  idempotency_key text UNIQUE NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ledger_store ON order_ledger_entries (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_order ON order_ledger_entries (order_id);

-- ─── OTP challenges ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS phone_otp_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  purpose text NOT NULL CHECK (purpose IN ('signup','buyer_order','delivery','store_publish')),
  code_hash text NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  order_id uuid REFERENCES store_orders(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON phone_otp_challenges (phone, purpose, created_at DESC);

-- ─── Listing rate limits ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS listing_rate_limits (
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  window_start timestamptz NOT NULL,
  create_count int NOT NULL DEFAULT 0,
  PRIMARY KEY (store_id, window_start)
);

-- ─── Theme catalog (metadata only; assets live in repo) ──────
CREATE TABLE IF NOT EXISTS theme_catalog (
  id text PRIMARY KEY,
  name text NOT NULL,
  layout_family text NOT NULL,  -- dense_grid | editorial | menu | services
  mobile_priority int NOT NULL DEFAULT 100,
  is_premium boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  preview_image_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO theme_catalog (id, name, layout_family, mobile_priority, is_premium) VALUES
  ('food','Food','menu',10,false),
  ('fashion','Fashion','editorial',20,false),
  ('services','Services','services',30,false),
  ('general','General','dense_grid',5,false),
  ('beauty','Beauty','editorial',25,false),
  ('home','Home','dense_grid',15,false),
  ('electronics','Electronics','dense_grid',15,false),
  ('auto','Auto','dense_grid',40,false)
ON CONFLICT (id) DO NOTHING;

COMMIT;
