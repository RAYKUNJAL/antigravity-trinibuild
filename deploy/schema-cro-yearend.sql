-- Additive year-end CRO + growth-level columns and reviews.
-- Reviews are only accepted on completed store_orders (enforced in the API).
-- Safe to re-run. Do NOT apply from this cut — Code building applies after Ray's OK.
-- Depends on: deploy/schema.sql, deploy/schema-store-core-p1.sql, deploy/schema-product-modifiers.sql.

-- Store availability (Open now / Sold out today / estimated ready time).
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS sold_out_today boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS open_now boolean,
  ADD COLUMN IF NOT EXISTS prep_minutes int,
  ADD COLUMN IF NOT EXISTS wam_verified_at timestamptz;

COMMENT ON COLUMN stores.open_now IS
  'Merchant toggle. NULL = do not claim Open or Closed. true/false shown as Open/Closed.';
COMMENT ON COLUMN stores.prep_minutes IS
  'Merchant-typed estimate, minutes. NULL = do not show a ready time. Never invent.';
COMMENT ON COLUMN stores.wam_verified_at IS
  'Set when Wam has verified this shop. The Verified badge stays free. Required for Pro and Market Leader levels.';

-- Product-level sold-out toggle (stock = 0 also means sold out).
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sold_out boolean NOT NULL DEFAULT false;

-- Reviews: one per completed order. No seed rows. No aggregate stored on stores.
CREATE TABLE IF NOT EXISTS store_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES store_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  body text,
  buyer_phone_masked text,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id)
);
CREATE INDEX IF NOT EXISTS idx_store_reviews_store ON store_reviews (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_reviews_published ON store_reviews (store_id, published);

COMMENT ON TABLE store_reviews IS
  'Buyer reviews on completed store_orders only. 0 rows means "No reviews yet" — never invent a rating.';
