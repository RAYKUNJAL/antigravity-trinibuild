-- ================================================
-- FIX RLS POLICIES FOR PUBLIC ACCESS
-- Migration: 41_fix_public_access_rls.sql
-- Purpose: Allow anonymous users to read public data
-- ================================================

-- ================================================
-- 1. STORES TABLE - Public Directory Access
-- ================================================
CREATE POLICY IF NOT EXISTS "Allow anonymous SELECT on stores"
ON stores FOR SELECT
TO anon
USING (true);

-- ================================================
-- 2. BLOGS TABLE - Public Blog Access
-- ================================================
CREATE POLICY IF NOT EXISTS "Allow anonymous SELECT on blogs"
ON blogs FOR SELECT
TO anon
USING (true);

-- ================================================
-- 3. CLASSIFIED LISTINGS - Public Classifieds Access
-- ================================================
CREATE POLICY IF NOT EXISTS "Allow anonymous SELECT on classified_listings"
ON classified_listings FOR SELECT
TO anon
USING (true);

-- ================================================
-- 4. JOBS TABLE - Public Jobs Board Access
-- ================================================
CREATE POLICY IF NOT EXISTS "Allow anonymous SELECT on jobs"
ON jobs FOR SELECT
TO anon
USING (true);

-- ================================================
-- 5. REAL ESTATE LISTINGS - Public Property Access
-- ================================================
CREATE POLICY IF NOT EXISTS "Allow anonymous SELECT on real_estate_listings"
ON real_estate_listings FOR SELECT
TO anon
USING (true);

-- ================================================
-- 6. EVENTS TABLE - Public Events Calendar Access
-- ================================================
CREATE POLICY IF NOT EXISTS "Allow anonymous SELECT on events"
ON events FOR SELECT
TO anon
USING (true);

-- ================================================
-- 7. VIDEO PLACEMENTS - Public Video Ads Access
-- ================================================
CREATE POLICY IF NOT EXISTS "Allow anonymous SELECT on video_placements"
ON video_placements FOR SELECT
TO anon
USING (true);

-- ================================================
-- 8. SUCCESS STORIES - Public Testimonials Access
-- ================================================
CREATE POLICY IF NOT EXISTS "Allow anonymous SELECT on success_stories"
ON success_stories FOR SELECT
TO anon
USING (true);

-- ================================================
-- 9. STOREFRONTS - Public Storefront Access
-- ================================================
CREATE POLICY IF NOT EXISTS "Allow anonymous SELECT on storefronts"
ON storefronts FOR SELECT
TO anon
USING (true);

-- ================================================
-- 10. PRODUCTS - Public Product Catalog Access
-- ================================================
CREATE POLICY IF NOT EXISTS "Allow anonymous SELECT on products"
ON products FOR SELECT
TO anon
USING (true);

-- ================================================
-- VERIFICATION QUERY
-- ================================================
-- Run this to verify policies were created:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE policyname LIKE '%anonymous%'
-- ORDER BY tablename;
