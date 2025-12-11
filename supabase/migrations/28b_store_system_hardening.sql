-- ============================================
-- Migration: 28b_store_system_hardening.sql
-- Description: Security, performance, and data integrity improvements for Store System
-- Applied: 2025-12-11
-- ============================================

-- 1. SECURITY: Restrict agreement insertion to authenticated users only
-- (Fixes policy that was previously open to 'public' role)
DROP POLICY IF EXISTS "Users can insert their own agreements" ON public.signed_agreements;
CREATE POLICY "Users can insert their own agreements" 
ON public.signed_agreements FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. PERFORMANCE: Add indexes for foreign key and policy lookups
-- These dramatically improve RLS policy evaluation at scale
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON public.stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_themes_store_id ON public.themes(store_id);
CREATE INDEX IF NOT EXISTS idx_signed_agreements_user_id ON public.signed_agreements(user_id);
CREATE INDEX IF NOT EXISTS idx_signed_agreements_document_type ON public.signed_agreements(document_type);

-- 3. DATA INTEGRITY: Auto-update updated_at timestamps
-- Reusable function for any table with updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to products table
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Apply trigger to themes table
DROP TRIGGER IF EXISTS update_themes_updated_at ON public.themes;
CREATE TRIGGER update_themes_updated_at
    BEFORE UPDATE ON public.themes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- VERIFICATION QUERIES (for manual inspection)
-- ============================================
-- Check indexes created:
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('stores', 'products', 'themes', 'signed_agreements');

-- Check triggers created:
-- SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public';

-- Check policy is now authenticated-only:
-- SELECT policyname, roles FROM pg_policies WHERE tablename = 'signed_agreements';

SELECT 'Migration 28b complete - Store system hardened for production traffic!' as status;
