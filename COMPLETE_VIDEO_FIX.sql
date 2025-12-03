-- COMPLETE VIDEO UPLOAD FIX
-- Run this entire script in Supabase SQL Editor
-- Project: https://supabase.com/dashboard/project/cdprbbyptjdntcrhmwxf/sql

-- ========================================
-- STEP 1: CLEAN UP ANY EXISTING ISSUES
-- ========================================

-- Remove any conflicting policies
DROP POLICY IF EXISTS "Public Access site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own site-assets" ON storage.objects;

-- ========================================
-- STEP 2: CREATE/UPDATE BUCKET
-- ========================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'site-assets', 
    'site-assets', 
    true, 
    524288000, -- 500MB
    ARRAY[
        'video/mp4', 
        'video/webm', 
        'video/quicktime', 
        'video/x-msvideo', 
        'video/avi',
        'video/x-matroska',
        'image/jpeg', 
        'image/png', 
        'image/webp',
        'image/gif'
    ]
)
ON CONFLICT (id) 
DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ========================================
-- STEP 3: ENABLE RLS
-- ========================================

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 4: CREATE PERMISSIVE POLICIES
-- ========================================

-- Allow everyone to read (public access)
CREATE POLICY "Public Access site-assets"
ON storage.objects FOR SELECT
USING ( bucket_id = 'site-assets' );

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload site-assets"
ON storage.objects FOR INSERT
WITH CHECK ( 
    bucket_id = 'site-assets' 
    AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
);

-- Allow users to update their own files
CREATE POLICY "Users can update own site-assets"
ON storage.objects FOR UPDATE
USING ( 
    bucket_id = 'site-assets' 
    AND (auth.uid() = owner OR auth.role() = 'service_role')
)
WITH CHECK ( 
    bucket_id = 'site-assets' 
    AND (auth.uid() = owner OR auth.role() = 'service_role')
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own site-assets"
ON storage.objects FOR DELETE
USING ( 
    bucket_id = 'site-assets' 
    AND (auth.uid() = owner OR auth.role() = 'service_role')
);

-- ========================================
-- STEP 5: VERIFY (Check results)
-- ========================================

-- Check bucket exists
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'site-assets';

-- Check policies exist
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- Done! You should see:
-- 1. One row showing site-assets bucket
-- 2. At least 4 policies listed
