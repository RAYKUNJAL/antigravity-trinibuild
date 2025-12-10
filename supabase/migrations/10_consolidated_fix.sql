-- TRINIBUILD CONSOLIDATED FIX (V2 - Corrected Column Name)
-- Run this to ensure all potentially missing tables and settings are present.

-- 1. TICKETS
CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events(id) not null,
  user_id uuid references public.profiles(id) not null,
  tier_name text, -- e.g. "VIP", "General"
  price decimal(10,2) not null,
  status text default 'valid', -- valid, used, refunded
  qr_code text, -- distinct code for scanning
  purchased_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;
CREATE POLICY "Users can view their own tickets" ON public.tickets FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can purchase tickets" ON public.tickets;
CREATE POLICY "Users can purchase tickets" ON public.tickets FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Event hosts can view tickets for their events" ON public.tickets;
CREATE POLICY "Event hosts can view tickets for their events" ON public.tickets FOR SELECT USING (
    exists (select 1 from public.events where id = tickets.event_id and organizer_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
CREATE POLICY "Admins can view all tickets" ON public.tickets FOR SELECT USING (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

-- 2. SUPPORT MESSAGES
CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id), -- Optional
  email text,
  subject text,
  message text,
  status text default 'new',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage support messages" ON public.support_messages;
CREATE POLICY "Admins can manage support messages" ON public.support_messages FOR ALL USING (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

DROP POLICY IF EXISTS "Anyone can insert support messages" ON public.support_messages;
CREATE POLICY "Anyone can insert support messages" ON public.support_messages FOR INSERT WITH CHECK (true);

-- 3. LOCATION HEATMAP
CREATE TABLE IF NOT EXISTS public.location_keyword_heatmap (
  id uuid default uuid_generate_v4() primary key,
  location_slug text,
  location_name text,
  total_searches integer,
  top_keywords jsonb,
  rising_keywords jsonb,
  date date default current_date
);

ALTER TABLE public.location_keyword_heatmap ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view heatmap" ON public.location_keyword_heatmap;
CREATE POLICY "Admins view heatmap" ON public.location_keyword_heatmap FOR SELECT USING (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

-- 4. ANALYTICS COLUMNS (For Traffic Hub)
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS referrer text;
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS session_id text;

-- 5. SITE SETTINGS (For AI Traffic Controls)
CREATE TABLE IF NOT EXISTS site_settings (
    key text PRIMARY KEY,
    value text,
    type text CHECK (type IN ('string', 'boolean', 'number', 'json')),
    description text,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Settings" ON site_settings;
CREATE POLICY "Public Read Settings" ON site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins Manage Settings" ON site_settings;
CREATE POLICY "Admins Manage Settings" ON site_settings FOR ALL USING (auth.role() = 'authenticated');

-- 6. SEED DEFAULT AI SETTINGS
INSERT INTO site_settings (key, value, type, description)
VALUES 
    ('ai_boost_vendors', 'true', 'boolean', 'Boost visibility for new vendors'),
    ('ai_location_content', 'true', 'boolean', 'Dynamically adjust content based on location'),
    ('ai_load_balancing', 'true', 'boolean', 'Smart traffic distribution')
ON CONFLICT (key) DO NOTHING;
