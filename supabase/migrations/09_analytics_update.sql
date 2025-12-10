-- 1. Analytics Update
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS referrer text;
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS session_id text;

-- 2. Site Settings Management
-- Ensure the table exists even if migration 08_admin_settings was missed
CREATE TABLE IF NOT EXISTS site_settings (
    key text PRIMARY KEY,
    value text,
    type text CHECK (type IN ('string', 'boolean', 'number', 'json')),
    description text,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Read Settings" ON site_settings;
DROP POLICY IF EXISTS "Admins Manage Settings" ON site_settings;

CREATE POLICY "Public Read Settings" ON site_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins Manage Settings" ON site_settings
    FOR ALL
    USING (auth.role() = 'authenticated');

-- Seed default AI settings if they don't exist
INSERT INTO site_settings (key, value, type, description)
VALUES 
    ('ai_boost_vendors', 'true', 'boolean', 'Boost visibility for new vendors'),
    ('ai_location_content', 'true', 'boolean', 'Dynamically adjust content based on location'),
    ('ai_load_balancing', 'true', 'boolean', 'Smart traffic distribution')
ON CONFLICT (key) DO NOTHING;
