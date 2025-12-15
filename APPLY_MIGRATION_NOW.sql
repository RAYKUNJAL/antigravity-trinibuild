-- ============================================
-- Store Builder V2 - Complete Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add new columns to stores table
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS logo_style TEXT,
ADD COLUMN IF NOT EXISTS vibe TEXT[],
ADD COLUMN IF NOT EXISTS operating_hours JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS delivery_options TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS payment_methods TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS font_pair JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS color_scheme JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- 2. Add helpful comments
COMMENT ON COLUMN public.stores.tagline IS 'Short business tagline';
COMMENT ON COLUMN public.stores.logo_style IS 'Selected logo style (modern, traditional, etc)';
COMMENT ON COLUMN public.stores.vibe IS 'Array of business vibe tags';
COMMENT ON COLUMN public.stores.operating_hours IS 'JSON object of operating hours';
COMMENT ON COLUMN public.stores.delivery_options IS 'Array of delivery options (pickup, delivery, etc)';
COMMENT ON COLUMN public.stores.payment_methods IS 'Array of accepted payment methods';
COMMENT ON COLUMN public.stores.font_pair IS 'JSON object of font configuration';
COMMENT ON COLUMN public.stores.color_scheme IS 'JSON object of color palette';
COMMENT ON COLUMN public.stores.social_links IS 'JSON object of social media links';

-- 3. Verify the migration
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'stores'
  AND column_name IN (
    'tagline', 'logo_style', 'vibe', 'operating_hours', 
    'delivery_options', 'payment_methods', 'font_pair', 
    'color_scheme', 'social_links'
  )
ORDER BY column_name;

-- Expected output: 9 rows showing the new columns
