-- Create a storage bucket for real estate images
-- Note: We use 'insert into' because storage.buckets is a table in the storage schema
INSERT INTO storage.buckets (id, name, public)
VALUES ('real-estate', 'real-estate', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'real-estate' );

-- Policy: Authenticated users can upload images
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'real-estate' AND auth.role() = 'authenticated' );

-- Policy: Users can update their own images
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'real-estate' AND auth.uid() = owner );

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
USING ( bucket_id = 'real-estate' AND auth.uid() = owner );
