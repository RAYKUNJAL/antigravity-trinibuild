-- Additive: generic product option-groups for island niche menus (doubles, street food, future).
-- Selected options ride on store_orders.items / cod_orders.items jsonb — no order table change.
-- Safe to re-run.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS modifier_groups jsonb NOT NULL DEFAULT '[]';

COMMENT ON COLUMN products.modifier_groups IS
  'ProductModifierGroup[] — merchant-editable option groups (pepper levels, chutneys, size, spice). priceDelta defaults 0.';

-- Optional store-level vendor flags for street niches (theme_config also holds these).
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS sold_out_today boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS map_directions_url text,
  ADD COLUMN IF NOT EXISTS daily_specials text;
