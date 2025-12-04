-- 20_fix_site_assets_bucket.sql
-- Run this script in the Supabase SQL Editor to fix the storage bucket issues.

-- 1. Create bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'site-assets', 
    'site-assets', 
    true, 
    524288000, -- 500MB
    ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/avi', 'image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Enable RLS on objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop all existing policies for this bucket to start fresh
DROP POLICY IF EXISTS "Public Access site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete from site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Give me access to site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users full access site-assets" ON storage.objects;

-- 4. Create permissive policies

-- Public Read Access
CREATE POLICY "Public Access site-assets"
ON storage.objects FOR SELECT
USING ( bucket_id = 'site-assets' );

-- Authenticated Upload Access
CREATE POLICY "Authenticated users full access site-assets"
ON storage.objects FOR ALL
USING ( bucket_id = 'site-assets' AND auth.role() = 'authenticated' )
WITH CHECK ( bucket_id = 'site-assets' AND auth.role() = 'authenticated' );

-- 5. Verify
SELECT * FROM storage.buckets WHERE id = 'site-assets';
