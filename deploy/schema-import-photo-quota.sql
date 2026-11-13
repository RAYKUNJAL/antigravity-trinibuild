-- Photo-listing quota + import provenance for Bring-my-store-over.
-- Safe to re-run. Do NOT apply from this cut — Code building applies after Ray's OK.
-- Depends on: deploy/schema.sql (stores, products).

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS photo_listings_used int NOT NULL DEFAULT 0;

COMMENT ON COLUMN stores.photo_listings_used IS
  'Count of photo-to-listing drafts created on this store. Every seller gets 5 free. Premium is unlimited.';

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS import_source text,
  ADD COLUMN IF NOT EXISTS price_found boolean;

COMMENT ON COLUMN products.import_source IS
  'Set when a draft was created by URL, CSV, or photo import (json-ld, opengraph, shopify, csv, photo). Not a published source of truth.';
COMMENT ON COLUMN products.price_found IS
  'true only when a price was present in the import source or later typed by the seller. false/NULL means do not display a price.';

CREATE TABLE IF NOT EXISTS store_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  source_kind text NOT NULL,
  source_url text,
  draft_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_store_import_batches_store ON store_import_batches (store_id, created_at DESC);

COMMENT ON TABLE store_import_batches IS
  'Append-only record of import runs. Draft products are the source the seller reviews.';
