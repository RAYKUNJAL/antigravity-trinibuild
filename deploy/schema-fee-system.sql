-- Juvay fee system (additive). DRAFT — DO NOT apply from this agent.
-- Lead/Code apply after a named cut and Ray's direct OK.
-- Depends on: deploy/schema-store-core-p1.sql
-- Date: 2026-11-12
--
-- Approved rates (source, not live until cut):
--   Juvay 450 bps Free / 250 bps Premium on successful online Wam sales only,
--   computed on item subtotal, cap TT$25 (2500 cents), no minimum.
--   0% Juvay commission on cash pickup and COD.
--   Wam processing is pass-through (published rate, confirm with Wam).
-- Promoted listings: schema stub only, ADS_ENABLED=false, no sell UI.

BEGIN;

-- Premium plan fee: 300 bps → 250 bps (approved)
UPDATE plan_tiers SET juvay_fee_bps = 250
WHERE slug IN ('pro','premium','starter','business');

UPDATE plan_tiers SET juvay_fee_bps = 450
WHERE slug = 'free' AND (juvay_fee_bps IS DISTINCT FROM 450);

-- ─── Store orders: rail, buyer card fee, seller Wam cut, settlement ──
ALTER TABLE store_orders
  ADD COLUMN IF NOT EXISTS payment_rail text
    CHECK (payment_rail IS NULL OR payment_rail IN ('wallet','card')),
  ADD COLUMN IF NOT EXISTS buyer_card_fee_cents int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wam_fee_seller_cents int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seller_net_cents int,
  ADD COLUMN IF NOT EXISTS available_at timestamptz,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz,
  ADD COLUMN IF NOT EXISTS refund_reason text;

-- ─── Wam payments: rail + settlement ──
ALTER TABLE wam_payments
  ADD COLUMN IF NOT EXISTS payment_rail text
    CHECK (payment_rail IS NULL OR payment_rail IN ('wallet','card')),
  ADD COLUMN IF NOT EXISTS wam_fee_seller_cents int,
  ADD COLUMN IF NOT EXISTS buyer_card_fee_cents int,
  ADD COLUMN IF NOT EXISTS available_at timestamptz,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz;

-- ─── Ledger: settlement timestamp + refund entry types ──
ALTER TABLE order_ledger_entries
  ADD COLUMN IF NOT EXISTS available_at timestamptz,
  ADD COLUMN IF NOT EXISTS reversed_entry_id uuid REFERENCES order_ledger_entries(id) ON DELETE SET NULL;

ALTER TABLE order_ledger_entries DROP CONSTRAINT IF EXISTS order_ledger_entries_entry_type_check;
ALTER TABLE order_ledger_entries ADD CONSTRAINT order_ledger_entries_entry_type_check
  CHECK (entry_type IN (
    'sale_gross','juvay_fee','wam_fee','merchant_net',
    'cod_handling','cod_refusal','payout','adjustment',
    'refund_sale_gross','refund_juvay_fee','refund_wam_fee','refund_merchant_net'
  ));

CREATE INDEX IF NOT EXISTS idx_ledger_available ON order_ledger_entries (store_id, available_at);

-- ─── Promoted listings STUB (feature-flagged off; no UI selling it) ──
CREATE TABLE IF NOT EXISTS promoted_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id uuid,
  status text NOT NULL DEFAULT 'disabled'
    CHECK (status IN ('disabled','draft','scheduled','active','ended')),
  bid_cents int,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_promoted_listings_store ON promoted_listings (store_id);

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS ads_opt_in boolean NOT NULL DEFAULT false;

COMMENT ON TABLE promoted_listings IS
  'STUB only. Do not sell promoted listings while ADS_ENABLED is false. Optional ads; discounts remain opt-in.';

COMMIT;
