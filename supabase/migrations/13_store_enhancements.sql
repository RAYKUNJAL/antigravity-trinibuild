-- Migration: 13_store_enhancements.sql
-- Description: Upgrade stores and products tables to support complex settings, themes, and variants locally.

-- 1. Create CATEGORIES table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT, -- URL friendly name
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public categories are viewable by everyone."
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Vendors can manage their own categories."
  ON public.categories FOR ALL
  USING ( EXISTS ( SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid() ) );

-- 2. Enhance STORES table
ALTER TABLE public.stores
    ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb, -- currency, taxes, shipping
    ADD COLUMN IF NOT EXISTS theme JSONB DEFAULT '{}'::jsonb, -- colors, templates
    ADD COLUMN IF NOT EXISTS customer_config JSONB DEFAULT '{}'::jsonb, -- guest checkout
    ADD COLUMN IF NOT EXISTS checkout_config JSONB DEFAULT '{}'::jsonb, -- rules, steps
    ADD COLUMN IF NOT EXISTS contact_info JSONB DEFAULT '{}'::jsonb; -- email, phone, address (metadata)

-- Index for slug lookups (fast store loading)
CREATE INDEX IF NOT EXISTS stores_slug_idx ON public.stores(slug);

-- 3. Enhance PRODUCTS table
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS sku TEXT,
    ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS category_ids TEXT[] DEFAULT '{}', -- Array of category UUIDs
    ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb, -- Complex variant data
    ADD COLUMN IF NOT EXISTS seo JSONB DEFAULT '{}'::jsonb, -- meta tags
    ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb; -- technical specs

-- Index for SKU lookups
CREATE INDEX IF NOT EXISTS products_sku_idx ON public.products(sku);

-- 4. Create INVENTORY_TRANSACTIONS table (Optional but good for commercial grade)
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    variant_id TEXT, -- ID from the variants JSONB
    quantity_change INTEGER NOT NULL,
    reason TEXT, -- 'order', 'restock', 'adjustment'
    reference_id TEXT, -- order_id or other ref
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view their inventory logs"
    ON public.inventory_transactions FOR SELECT
    USING ( EXISTS (
        SELECT 1 FROM public.products p
        JOIN public.stores s ON s.id = p.store_id
        WHERE p.id = inventory_transactions.product_id AND s.owner_id = auth.uid()
    ));

-- Grant permissions (if needed for your setup, usually authenticated user is enough via RLS)
GRANT ALL ON public.categories TO authenticated;
GRANT ALL ON public.inventory_transactions TO authenticated;
