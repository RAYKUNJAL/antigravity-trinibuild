-- Force fix for Video Uploads
-- 1. Ensure site-assets bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'site-assets', 
    'site-assets', 
    true, 
    524288000, -- 500MB
    ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/avi', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 524288000,
    allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/avi', 'image/jpeg', 'image/png', 'image/webp'];

-- 2. Reset RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Create PERMISSIVE policies for site-assets
-- Allow public read access
DROP POLICY IF EXISTS "Public Access site-assets" ON storage.objects;
CREATE POLICY "Public Access site-assets"
ON storage.objects FOR SELECT
USING ( bucket_id = 'site-assets' );

-- Allow authenticated users to upload (INSERT)
DROP POLICY IF EXISTS "Authenticated users can upload site-assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload site-assets"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'site-assets' AND auth.role() = 'authenticated' );

-- Allow authenticated users to update their own uploads
DROP POLICY IF EXISTS "Users can update own site-assets" ON storage.objects;
CREATE POLICY "Users can update own site-assets"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'site-assets' AND auth.uid() = owner );

-- Allow authenticated users to delete their own uploads
DROP POLICY IF EXISTS "Users can delete own site-assets" ON storage.objects;
CREATE POLICY "Users can delete own site-assets"
ON storage.objects FOR DELETE
USING ( bucket_id = 'site-assets' AND auth.uid() = owner );

-- 4. Verify video_placements table
CREATE TABLE IF NOT EXISTS video_placements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page TEXT NOT NULL,
    section TEXT NOT NULL,
    video_url TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    autoplay BOOLEAN DEFAULT false,
    loop BOOLEAN DEFAULT false,
    muted BOOLEAN DEFAULT true,
    controls BOOLEAN DEFAULT true,
    position INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Fix RLS for video_placements
ALTER TABLE video_placements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active videos" ON video_placements;
CREATE POLICY "Public can view active videos" ON video_placements
    FOR SELECT
    USING (active = true);

DROP POLICY IF EXISTS "Authenticated users can insert videos" ON video_placements;
CREATE POLICY "Authenticated users can insert videos" ON video_placements
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update videos" ON video_placements;
CREATE POLICY "Authenticated users can update videos" ON video_placements
    FOR UPDATE
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete videos" ON video_placements;
CREATE POLICY "Authenticated users can delete videos" ON video_placements
    FOR DELETE
    USING (auth.role() = 'authenticated');
