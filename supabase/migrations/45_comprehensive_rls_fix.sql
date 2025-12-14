-- ================================================
-- COMPREHENSIVE RLS FIX FOR ALL PUBLIC TABLES
-- Allow anonymous users to read all public data
-- ================================================

-- Enable RLS on all tables
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classified_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.real_estate_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous read access to stores" ON public.stores;
DROP POLICY IF EXISTS "Allow authenticated users to read stores" ON public.stores;
DROP POLICY IF EXISTS "Allow anonymous read access to classified_listings" ON public.classified_listings;
DROP POLICY IF EXISTS "Allow anonymous read access to jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow anonymous read access to events" ON public.events;
DROP POLICY IF EXISTS "Allow anonymous read access to real_estate_listings" ON public.real_estate_listings;
DROP POLICY IF EXISTS "Allow anonymous read access to products" ON public.products;
DROP POLICY IF EXISTS "Allow anonymous read access to success_stories" ON public.success_stories;
DROP POLICY IF EXISTS "Allow anonymous read access to video_placements" ON public.video_placements;
DROP POLICY IF EXISTS "Allow anonymous read access to blogs" ON public.blogs;

-- Create policies for STORES
CREATE POLICY "Allow anonymous read access to stores"
ON public.stores
FOR SELECT
TO anon
USING (status = 'active');

CREATE POLICY "Allow authenticated users to read stores"
ON public.stores
FOR SELECT
TO authenticated
USING (true);

-- Create policies for CLASSIFIED_LISTINGS
CREATE POLICY "Allow anonymous read access to classified_listings"
ON public.classified_listings
FOR SELECT
TO anon
USING (true);

-- Create policies for JOBS
CREATE POLICY "Allow anonymous read access to jobs"
ON public.jobs
FOR SELECT
TO anon
USING (true);

-- Create policies for EVENTS
CREATE POLICY "Allow anonymous read access to events"
ON public.events
FOR SELECT
TO anon
USING (true);

-- Create policies for REAL_ESTATE_LISTINGS
CREATE POLICY "Allow anonymous read access to real_estate_listings"
ON public.real_estate_listings
FOR SELECT
TO anon
USING (true);

-- Create policies for PRODUCTS
CREATE POLICY "Allow anonymous read access to products"
ON public.products
FOR SELECT
TO anon
USING (true);

-- Create policies for SUCCESS_STORIES
CREATE POLICY "Allow anonymous read access to success_stories"
ON public.success_stories
FOR SELECT
TO anon
USING (true);

-- Create policies for VIDEO_PLACEMENTS
CREATE POLICY "Allow anonymous read access to video_placements"
ON public.video_placements
FOR SELECT
TO anon
USING (is_active = true);

-- Create policies for BLOGS
CREATE POLICY "Allow anonymous read access to blogs"
ON public.blogs
FOR SELECT
TO anon
USING (published = true);

-- Verify all policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN (
  'stores', 
  'classified_listings', 
  'jobs', 
  'events', 
  'real_estate_listings', 
  'products', 
  'success_stories', 
  'video_placements', 
  'blogs'
)
ORDER BY tablename, policyname;
