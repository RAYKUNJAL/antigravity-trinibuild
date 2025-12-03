-- Final fix for video_placements table
-- 1. Add sort_order column if it doesn't exist
ALTER TABLE video_placements 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 1;

-- 2. Add is_youtube column if it doesn't exist
ALTER TABLE video_placements 
ADD COLUMN IF NOT EXISTS is_youtube BOOLEAN DEFAULT false;

-- 3. Migrate data from position to sort_order if position exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'video_placements' 
        AND column_name = 'position'
    ) THEN
        UPDATE video_placements 
        SET sort_order = position 
        WHERE sort_order IS NULL OR sort_order = 1;
        
        ALTER TABLE video_placements DROP COLUMN position;
    END IF;
END $$;

-- 4. Create unique constraint on (page, section, sort_order)
DROP INDEX IF EXISTS video_placements_page_section_sort_order_key;
CREATE UNIQUE INDEX video_placements_page_section_sort_order_key 
ON video_placements(page, section, sort_order);

-- 5. Update RLS policies to be more permissive for authenticated users
-- Drop existing policies
DROP POLICY IF EXISTS "Public can view active videos" ON video_placements;
DROP POLICY IF EXISTS "Authenticated users can insert videos" ON video_placements;
DROP POLICY IF EXISTS "Authenticated users can update videos" ON video_placements;
DROP POLICY IF EXISTS "Authenticated users can delete videos" ON video_placements;
DROP POLICY IF EXISTS "Authenticated users full access" ON video_placements;

-- Create new simplified policies
CREATE POLICY "Public can view active videos" ON video_placements
    FOR SELECT
    USING (active = true);

CREATE POLICY "Authenticated users can view all videos" ON video_placements
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON video_placements
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- 6. Ensure storage policies are permissive
-- Allow anonymous uploads to site-assets (for development)
DROP POLICY IF EXISTS "Anyone can upload to site-assets" ON storage.objects;
CREATE POLICY "Anyone can upload to site-assets"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'site-assets' );

DROP POLICY IF EXISTS "Anyone can update site-assets" ON storage.objects;
CREATE POLICY "Anyone can update site-assets"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'site-assets' );

DROP POLICY IF EXISTS "Anyone can delete from site-assets" ON storage.objects;
CREATE POLICY "Anyone can delete from site-assets"
ON storage.objects FOR DELETE
USING ( bucket_id = 'site-assets' );
