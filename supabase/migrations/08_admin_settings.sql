-- Create Site Settings Table
CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    type TEXT DEFAULT 'string', -- 'string', 'json', 'boolean', 'number'
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create Admin Audit Logs
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Storage Bucket for Site Assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public read of site assets
CREATE POLICY "Public Access" ON storage.objects FOR SELECT
USING ( bucket_id = 'site-assets' );

-- Policy to allow authenticated users (admins) to upload
CREATE POLICY "Admin Upload" ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'site-assets' AND auth.role() = 'authenticated' );

-- Policy to allow admins to update/delete
CREATE POLICY "Admin Update" ON storage.objects FOR UPDATE
USING ( bucket_id = 'site-assets' AND auth.role() = 'authenticated' );

CREATE POLICY "Admin Delete" ON storage.objects FOR DELETE
USING ( bucket_id = 'site-assets' AND auth.role() = 'authenticated' );

-- Seed default settings
INSERT INTO site_settings (key, value, type) VALUES
('hero_title', 'Build Your Future in Trinidad & Tobago', 'string'),
('hero_subtitle', 'The all-in-one platform for construction, real estate, and services.', 'string'),
('hero_image_url', 'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?q=80&w=3200', 'string'),
('promo_video_url', '', 'string'),
('maintenance_mode', 'false', 'boolean')
ON CONFLICT (key) DO NOTHING;
