-- Caribbean AI Trade Network — PostgreSQL schema
-- Migrates the JSON-file store to Postgres and adds the trade/escrow engine.
-- Self-hosted, open source. Apply: psql -U postgres -d caribbean_trade -f db/schema.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============ Migrated app core (was data/db.json) ============
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT,
  role TEXT DEFAULT 'owner',
  island TEXT DEFAULT 'tt',
  currency TEXT DEFAULT 'TTD',
  buyer_external BOOLEAN DEFAULT FALSE,
  buyer_destination TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  island TEXT DEFAULT 'tt',
  currency TEXT DEFAULT 'TTD',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  org_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'owner',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  org_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  plan_slug TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  source TEXT DEFAULT 'free',
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY,
  state TEXT NOT NULL DEFAULT 'UNCLAIMED_PUBLIC_PROFILE',
  name TEXT NOT NULL,
  legal_name TEXT,
  country TEXT,
  city TEXT,
  category TEXT,
  website TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  verification JSONB DEFAULT '{}'::jsonb,
  provenance JSONB DEFAULT '{}'::jsonb,
  claimed_by TEXT,
  claimed_at TIMESTAMPTZ,
  owner_org_id TEXT REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses(category);
CREATE INDEX IF NOT EXISTS idx_businesses_country ON businesses(country);

CREATE TABLE IF NOT EXISTS representatives (
  id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  business_id TEXT REFERENCES businesses(id) ON DELETE CASCADE,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  business_id TEXT REFERENCES businesses(id) ON DELETE CASCADE,
  org_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  hs_candidate TEXT,
  moq NUMERIC DEFAULT 1,
  lead_time TEXT,
  price_usd NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  origin_country TEXT,
  published_by TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rfqs (
  id TEXT PRIMARY KEY,
  buyer_user_id TEXT,
  buyer_org_id TEXT,
  product TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  destination_country TEXT,
  deadline TEXT,
  notes TEXT,
  category TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  rfq_id TEXT REFERENCES rfqs(id) ON DELETE CASCADE,
  supplier_org_id TEXT,
  business_id TEXT,
  price_usd NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  incoterm TEXT DEFAULT 'EXW',
  lead_time TEXT,
  moq NUMERIC DEFAULT 1,
  validity_days NUMERIC DEFAULT 30,
  notes TEXT,
  status TEXT DEFAULT 'submitted',
  version INTEGER DEFAULT 1,
  parent_quote_id TEXT,
  negotiation_thread JSONB DEFAULT '[]'::jsonb,
  payment_terms TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  landed_cost_estimate JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  order_id TEXT,
  buyer_org_id TEXT,
  amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  method TEXT,
  provider TEXT,
  status TEXT DEFAULT 'CREATED',
  metadata JSONB DEFAULT '{}'::jsonb,
  provider_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  captured_at TIMESTAMPTZ,
  wam_payment_id TEXT,
  wam_checkout_url TEXT,
  wam_status TEXT
);

CREATE TABLE IF NOT EXISTS landed_cost_scenarios (
  id TEXT PRIMARY KEY,
  org_id TEXT,
  input JSONB DEFAULT '{}'::jsonb,
  result JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trade_rules (
  id TEXT PRIMARY KEY,
  jurisdiction TEXT,
  product_scope JSONB DEFAULT '[]'::jsonb,
  title TEXT NOT NULL,
  rule_type TEXT,
  value TEXT,
  source_url TEXT,
  source_tier NUMERIC,
  effective_from TEXT
);

CREATE TABLE IF NOT EXISTS hs_candidates (
  id TEXT PRIMARY KEY,
  hs TEXT,
  description TEXT,
  jurisdiction TEXT,
  confidence NUMERIC,
  source_url TEXT
);

CREATE TABLE IF NOT EXISTS activity (
  id TEXT PRIMARY KEY,
  action TEXT,
  actor TEXT,
  target TEXT,
  detail JSONB DEFAULT '{}'::jsonb,
  at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_activity_at ON activity(at DESC);

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT,
  tier NUMERIC,
  owner TEXT,
  terms TEXT,
  active BOOLEAN DEFAULT TRUE,
  added_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============ Roadmap: Country / Tariff / Freight ============
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='trade_currency') THEN CREATE TYPE trade_currency AS ENUM ('USD','TTD','JMD','BBD','XCD','GYD','USDC'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='incoterm_type') THEN CREATE TYPE incoterm_type AS ENUM ('EXW','FOB','CIF','DDP'); END IF; END $$;

CREATE TABLE IF NOT EXISTS country_trade_profiles (
  iso_code CHAR(2) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  default_currency trade_currency NOT NULL DEFAULT 'USD',
  vat_gct_rate NUMERIC(5,4) NOT NULL DEFAULT 0.0000,
  customs_service_charge NUMERIC(5,4) NOT NULL DEFAULT 0.0000,
  environmental_levy NUMERIC(5,4) NOT NULL DEFAULT 0.0000,
  is_caricom_member BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tariff_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hs_code VARCHAR(12) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  standard_cet_rate NUMERIC(5,4) NOT NULL DEFAULT 0.0000,
  caricom_duty_rate NUMERIC(5,4) NOT NULL DEFAULT 0.0000,
  is_sps_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS freight_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  origin_country CHAR(2) REFERENCES country_trade_profiles(iso_code),
  destination_country CHAR(2) REFERENCES country_trade_profiles(iso_code),
  carrier_name VARCHAR(100) NOT NULL,
  transit_mode VARCHAR(20) NOT NULL DEFAULT 'MARITIME_LCL',
  base_fee_usd NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  per_cbm_usd NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  per_kg_usd NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  est_transit_days INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============ Roadmap: Trade Orders (merged with existing order lifecycle) ============
CREATE TABLE IF NOT EXISTS trade_orders (
  id TEXT PRIMARY KEY,
  order_number VARCHAR(32) UNIQUE,
  buyer_id TEXT REFERENCES organizations(id),
  seller_id TEXT REFERENCES organizations(id),
  buyer_org_id TEXT,
  supplier_org_id TEXT,
  rfq_id TEXT,
  quote_id TEXT,
  product TEXT,
  quantity NUMERIC DEFAULT 1,
  price_usd NUMERIC(14,2) DEFAULT 0.00,
  currency trade_currency NOT NULL DEFAULT 'USD',
  incoterm incoterm_type NOT NULL DEFAULT 'CIF',
  status TEXT DEFAULT 'created',
  origin_country CHAR(2),
  destination_country CHAR(2),
  has_caricom_coo BOOLEAN DEFAULT TRUE,
  terms JSONB DEFAULT '{}'::jsonb,
  milestones JSONB DEFAULT '[]'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  status_history JSONB DEFAULT '[]'::jsonb,
  po_number TEXT,
  deposit_amount NUMERIC(14,2) DEFAULT 0.00,
  payment_terms TEXT,
  fx_rate NUMERIC(14,6),
  shipping JSONB DEFAULT '{}'::jsonb,
  -- Landed cost breakdown (USD)
  base_goods_total_usd NUMERIC(14,2) DEFAULT 0.00,
  freight_charge_usd NUMERIC(14,2) DEFAULT 0.00,
  insurance_charge_usd NUMERIC(14,2) DEFAULT 0.00,
  cif_value_usd NUMERIC(14,2) DEFAULT 0.00,
  import_duty_usd NUMERIC(14,2) DEFAULT 0.00,
  customs_service_charge_usd NUMERIC(14,2) DEFAULT 0.00,
  environmental_levy_usd NUMERIC(14,2) DEFAULT 0.00,
  vat_gct_usd NUMERIC(14,2) DEFAULT 0.00,
  port_handling_usd NUMERIC(14,2) DEFAULT 0.00,
  final_landed_total_usd NUMERIC(14,2) DEFAULT 0.00,
  duty_rate_applied NUMERIC(5,4) DEFAULT 0.0000,
  vat_rate_applied NUMERIC(5,4) DEFAULT 0.0000,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_trade_orders_buyer ON trade_orders(buyer_org_id);
CREATE INDEX IF NOT EXISTS idx_trade_orders_seller ON trade_orders(supplier_org_id);

-- ============ Roadmap: Escrow & Settlement ============
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='escrow_status') THEN CREATE TYPE escrow_status AS ENUM ('AWAITING_PAYMENT','HELD_IN_ESCROW','IN_TRANSIT','CUSTOMS_CLEARED','COMPLETED','DISPUTED','REFUNDED'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='payment_rail') THEN CREATE TYPE payment_rail AS ENUM ('WIPAY','BRAINTREE','MERCURY_ACH','USDC_POLYGON','WAM'); END IF; END $$;

CREATE TABLE IF NOT EXISTS trade_escrows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT UNIQUE REFERENCES trade_orders(id) ON DELETE RESTRICT,
  buyer_id TEXT,
  seller_id TEXT,
  status escrow_status NOT NULL DEFAULT 'AWAITING_PAYMENT',
  amount_total_usd NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  platform_fee_usd NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  seller_net_payout_usd NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  inbound_rail payment_rail NOT NULL,
  inbound_tx_ref VARCHAR(255),
  outbound_rail payment_rail,
  outbound_tx_ref VARCHAR(255),
  payment_currency trade_currency DEFAULT 'USD',
  fx_rate NUMERIC(12,4) DEFAULT 1.0000,
  checkout_url TEXT,
  expires_at TIMESTAMPTZ,
  funded_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_escrows_status ON trade_escrows(status);

CREATE TABLE IF NOT EXISTS escrow_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_id UUID REFERENCES trade_escrows(id) ON DELETE CASCADE,
  previous_status escrow_status,
  new_status escrow_status NOT NULL,
  actor_id TEXT,
  actor_role VARCHAR(50) DEFAULT 'SYSTEM',
  notes TEXT,
  event_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_escrow_events_escrow ON escrow_events(escrow_id);


-- ============ Roadmap: Advertising platform ============
CREATE TABLE IF NOT EXISTS ads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id TEXT,
  business_id TEXT,
  advertiser TEXT,
  title TEXT NOT NULL,
  body TEXT,
  image_url TEXT,
  target_url TEXT,
  placement TEXT DEFAULT 'directory',
  budget_usd NUMERIC(10,2) DEFAULT 0.00,
  status TEXT DEFAULT 'draft',
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ads_status_placement ON ads(status, placement);

CREATE TABLE IF NOT EXISTS ad_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ad_events_ad ON ad_events(ad_id);

-- ============ AI Operations Team: agent run log ============
CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  input JSONB DEFAULT '{}'::jsonb,
  output JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_agent_runs_agent ON agent_runs(agent);

-- Idempotent upgrades for pre-existing databases (safe to re-run on every boot)
ALTER TABLE trade_orders ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE trade_orders ADD COLUMN IF NOT EXISTS po_number TEXT;
ALTER TABLE trade_orders ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(14,2) DEFAULT 0.00;
ALTER TABLE trade_orders ADD COLUMN IF NOT EXISTS payment_terms TEXT;
ALTER TABLE trade_orders ADD COLUMN IF NOT EXISTS fx_rate NUMERIC(14,6);
ALTER TABLE trade_orders ADD COLUMN IF NOT EXISTS shipping JSONB DEFAULT '{}'::jsonb;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS parent_quote_id TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS negotiation_thread JSONB DEFAULT '[]'::jsonb;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_terms TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS landed_cost_estimate JSONB;
