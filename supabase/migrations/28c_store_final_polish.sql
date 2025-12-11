-- ============================================
-- Migration: 28c_store_final_polish.sql
-- Description: Final data integrity improvements
-- Applied: 2025-12-11
-- ============================================

-- 1. Remove redundant legacy index (if exists)
DROP INDEX IF EXISTS idx_stores_owner;

-- 2. Prevent duplicate product slugs within the same store
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_store_slug 
ON public.products(store_id, slug);

-- 3. Add CHECK constraint for valid product status values
-- First, update any invalid statuses to 'draft' (safety net)
UPDATE public.products 
SET status = 'draft' 
WHERE status NOT IN ('active', 'draft', 'archived', 'out_of_stock');

-- Add the constraint (drop first if exists to avoid errors)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'products_status_check'
    ) THEN
        ALTER TABLE public.products 
        ADD CONSTRAINT products_status_check 
        CHECK (status IN ('active', 'draft', 'archived', 'out_of_stock'));
    END IF;
END $$;

-- 4. Add unique constraint on store slug (for clean URLs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_slug_unique 
ON public.stores(slug) WHERE slug IS NOT NULL;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'Migration 28c complete - Store system fully polished!' as status;
