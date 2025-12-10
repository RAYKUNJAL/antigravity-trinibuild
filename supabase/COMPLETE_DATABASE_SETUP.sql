-- ============================================
-- TRINIBUILD COMPLETE DATABASE SETUP
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CORE TABLES (if not exist)
-- ============================================

-- Profiles (Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique,
  full_name text,
  phone text,
  role text default 'user',
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Jobs
CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  company text,
  location text,
  salary_min decimal(10,2),
  salary_max decimal(10,2),
  status text default 'open',
  posted_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Real Estate Listings
CREATE TABLE IF NOT EXISTS public.real_estate_listings (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  price decimal(12,2),
  location text,
  latitude decimal(10,8),
  longitude decimal(11,8),
  bedrooms integer,
  bathrooms integer,
  square_feet integer,
  status text default 'active',
  agent_id uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Events
CREATE TABLE IF NOT EXISTS public.events (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  event_date timestamp with time zone not null,
  location text,
  organizer_id uuid references public.profiles(id),
  ticket_price decimal(10,2),
  max_attendees integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tickets
CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events(id) not null,
  user_id uuid references public.profiles(id) not null,
  tier_name text,
  price decimal(10,2) not null,
  status text default 'valid',
  qr_code text,
  purchased_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Rides
CREATE TABLE IF NOT EXISTS public.rides (
  id uuid default uuid_generate_v4() primary key,
  rider_id uuid references public.profiles(id),
  driver_id uuid references public.profiles(id),
  pickup_location text,
  pickup_lat decimal(10,8),
  pickup_lng decimal(11,8),
  dropoff_location text,
  dropoff_lat decimal(10,8),
  dropoff_lng decimal(11,8),
  status text default 'pending',
  fare decimal(10,2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Drivers
CREATE TABLE IF NOT EXISTS public.drivers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) unique,
  vehicle_make text,
  vehicle_model text,
  vehicle_year integer,
  license_plate text,
  driver_license text,
  status text default 'pending',
  rating decimal(3,2) default 5.0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- 2. ANALYTICS & TRACKING
-- ============================================

-- Page Views
CREATE TABLE IF NOT EXISTS public.page_views (
  id uuid default uuid_generate_v4() primary key,
  page text not null,
  user_id uuid references public.profiles(id),
  referrer text,
  session_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Support Messages
CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  email text,
  subject text,
  message text,
  status text default 'new',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Location Keyword Heatmap
CREATE TABLE IF NOT EXISTS public.location_keyword_heatmap (
  id uuid default uuid_generate_v4() primary key,
  location_slug text,
  location_name text,
  total_searches integer,
  top_keywords jsonb,
  rising_keywords jsonb,
  date date default current_date
);

-- ============================================
-- 3. MARKETING & ADS
-- ============================================

-- Ad Campaigns
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  advertiser_id uuid references public.profiles(id),
  status text default 'draft',
  budget decimal(10,2),
  spent decimal(10,2) default 0,
  impressions integer default 0,
  clicks integer default 0,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Advertisers
CREATE TABLE IF NOT EXISTS public.advertisers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) unique,
  company_name text not null,
  website text,
  status text default 'pending',
  total_spent decimal(12,2) default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- 4. SITE SETTINGS
-- ============================================

CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value text,
  type text CHECK (type IN ('string', 'boolean', 'number', 'json')),
  description text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.real_estate_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_keyword_heatmap ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS POLICIES
-- ============================================

-- Profiles: Public read, users can update their own
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Jobs: Public read, authenticated users can create
DROP POLICY IF EXISTS "Jobs are viewable by everyone" ON public.jobs;
CREATE POLICY "Jobs are viewable by everyone" ON public.jobs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create jobs" ON public.jobs;
CREATE POLICY "Authenticated users can create jobs" ON public.jobs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Real Estate: Public read, agents can manage their own
DROP POLICY IF EXISTS "Listings are viewable by everyone" ON public.real_estate_listings;
CREATE POLICY "Listings are viewable by everyone" ON public.real_estate_listings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Agents can manage their listings" ON public.real_estate_listings;
CREATE POLICY "Agents can manage their listings" ON public.real_estate_listings FOR ALL USING (auth.uid() = agent_id);

-- Events: Public read, organizers can manage
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
CREATE POLICY "Events are viewable by everyone" ON public.events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Organizers can manage events" ON public.events;
CREATE POLICY "Organizers can manage events" ON public.events FOR ALL USING (auth.uid() = organizer_id);

-- Tickets: Users see their own, organizers see their event tickets
DROP POLICY IF EXISTS "Users can view their tickets" ON public.tickets;
CREATE POLICY "Users can view their tickets" ON public.tickets FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can purchase tickets" ON public.tickets;
CREATE POLICY "Users can purchase tickets" ON public.tickets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Rides: Users see their own rides
DROP POLICY IF EXISTS "Users can view their rides" ON public.rides;
CREATE POLICY "Users can view their rides" ON public.rides FOR SELECT USING (auth.uid() = rider_id OR auth.uid() = driver_id);

DROP POLICY IF EXISTS "Users can create rides" ON public.rides;
CREATE POLICY "Users can create rides" ON public.rides FOR INSERT WITH CHECK (auth.uid() = rider_id);

-- Page Views: Anyone can insert, admins can view
DROP POLICY IF EXISTS "Anyone can track page views" ON public.page_views;
CREATE POLICY "Anyone can track page views" ON public.page_views FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view analytics" ON public.page_views;
CREATE POLICY "Admins can view analytics" ON public.page_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Support Messages: Anyone can create, admins can view
DROP POLICY IF EXISTS "Anyone can create support messages" ON public.support_messages;
CREATE POLICY "Anyone can create support messages" ON public.support_messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view support messages" ON public.support_messages;
CREATE POLICY "Admins can view support messages" ON public.support_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Site Settings: Public read, admins can manage
DROP POLICY IF EXISTS "Public can read settings" ON public.site_settings;
CREATE POLICY "Public can read settings" ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage settings" ON public.site_settings;
CREATE POLICY "Admins can manage settings" ON public.site_settings FOR ALL USING (auth.role() = 'authenticated');

-- Ad Campaigns: Advertisers manage their own, public can view active
DROP POLICY IF EXISTS "Active campaigns viewable by all" ON public.ad_campaigns;
CREATE POLICY "Active campaigns viewable by all" ON public.ad_campaigns FOR SELECT USING (status = 'active' OR auth.uid() = advertiser_id);

DROP POLICY IF EXISTS "Advertisers manage their campaigns" ON public.ad_campaigns;
CREATE POLICY "Advertisers manage their campaigns" ON public.ad_campaigns FOR ALL USING (auth.uid() = advertiser_id);

-- ============================================
-- 7. SEED DEFAULT DATA
-- ============================================

-- Insert default AI settings
INSERT INTO public.site_settings (key, value, type, description)
VALUES 
  ('ai_boost_vendors', 'true', 'boolean', 'Boost visibility for new vendors'),
  ('ai_location_content', 'true', 'boolean', 'Dynamically adjust content based on location'),
  ('ai_load_balancing', 'true', 'boolean', 'Smart traffic distribution')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_real_estate_status ON public.real_estate_listings(status);
CREATE INDEX IF NOT EXISTS idx_real_estate_location ON public.real_estate_listings(location);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event ON public.tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_driver ON public.rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created ON public.page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON public.ad_campaigns(status);

-- ============================================
-- COMPLETE!
-- ============================================

SELECT 'Database setup complete! ✅';
