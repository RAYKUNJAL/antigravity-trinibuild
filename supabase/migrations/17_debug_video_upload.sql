-- DEBUG: Allow public uploads to site-assets to fix "not working" issue
-- This removes the authentication requirement for uploads to this specific bucket

-- 1. Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can upload site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Access site-assets" ON storage.objects;

-- 2. Create permissive upload policy (Allows anyone with the Anon Key to upload)
CREATE POLICY "Public Upload Access site-assets"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'site-assets' );

-- 3. Ensure update/delete are also permissive for now (optional, but good for debugging)
DROP POLICY IF EXISTS "Users can update own site-assets" ON storage.objects;
CREATE POLICY "Public Update Access site-assets"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'site-assets' );

DROP POLICY IF EXISTS "Users can delete own site-assets" ON storage.objects;
CREATE POLICY "Public Delete Access site-assets"
ON storage.objects FOR DELETE
USING ( bucket_id = 'site-assets' );
