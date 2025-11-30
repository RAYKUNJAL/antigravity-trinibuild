-- Real Estate Schema for TriniBuild (Zillow/Redfin Style)

-- Enable PostGIS if available (optional, but good for geo queries)
-- create extension if not exists postgis; 

-- 1. Listings Table
create table if not exists public.real_estate_listings (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    -- Core Details
    title text not null,
    description text,
    price numeric not null,
    currency text default 'TTD',
    listing_type text not null check (listing_type in ('sale', 'rent')),
    property_type text not null check (property_type in ('house', 'apartment', 'condo', 'land', 'commercial', 'townhouse')),
    status text default 'active' check (status in ('active', 'pending', 'sold', 'rented', 'off_market')),
    
    -- Specs
    bedrooms numeric, -- numeric to allow 0.5 for studios or weird configs, though usually int
    bathrooms numeric,
    sqft numeric,
    lot_size_sqft numeric,
    year_built integer,
    
    -- Location
    address text not null,
    city text not null,
    region text not null, -- e.g., "Port of Spain", "Chaguanas"
    zip_code text,
    country text default 'Trinidad & Tobago',
    latitude double precision,
    longitude double precision,
    
    -- Additional Features
    hoa_fee numeric default 0,
    parking_spaces integer default 0,
    stories integer default 1,
    is_featured boolean default false,
    
    -- Agent/Owner
    agent_id uuid references auth.users(id), -- If agents are users
    agent_info jsonb -- Snapshot of agent info if not linked to a user, or for display speed
);

-- 2. Property Images
create table if not exists public.property_images (
    id uuid default gen_random_uuid() primary key,
    listing_id uuid references public.real_estate_listings(id) on delete cascade not null,
    url text not null,
    caption text,
    display_order integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Property Amenities / Features
create table if not exists public.property_features (
    id uuid default gen_random_uuid() primary key,
    listing_id uuid references public.real_estate_listings(id) on delete cascade not null,
    feature_name text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. User Favorites (Saved Homes)
create table if not exists public.saved_homes (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    listing_id uuid references public.real_estate_listings(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, listing_id)
);

-- 5. Inquiries (Leads)
create table if not exists public.property_inquiries (
    id uuid default gen_random_uuid() primary key,
    listing_id uuid references public.real_estate_listings(id) on delete set null,
    user_id uuid references auth.users(id), -- Optional, if logged in
    name text not null,
    email text,
    phone text not null,
    message text,
    status text default 'new' check (status in ('new', 'contacted', 'closed')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies (Row Level Security)

-- Listings: Everyone can read active listings
alter table public.real_estate_listings enable row level security;
create policy "Public listings are viewable by everyone" 
    on public.real_estate_listings for select 
    using (status = 'active');

-- Agents can insert/update their own listings
create policy "Agents can manage their own listings" 
    on public.real_estate_listings for all 
    using (auth.uid() = agent_id);

-- Images: Viewable by everyone
alter table public.property_images enable row level security;
create policy "Images are viewable by everyone" 
    on public.property_images for select 
    using (true);
    
-- Features: Viewable by everyone
alter table public.property_features enable row level security;
create policy "Features are viewable by everyone" 
    on public.property_features for select 
    using (true);

-- Saved Homes: Users can only see/manage their own
alter table public.saved_homes enable row level security;
create policy "Users can manage their saved homes" 
    on public.saved_homes for all 
    using (auth.uid() = user_id);

-- Inquiries: Agents can see inquiries for their listings, Users can see their own
alter table public.property_inquiries enable row level security;
create policy "Agents view inquiries for their listings" 
    on public.property_inquiries for select 
    using (
        exists (
            select 1 from public.real_estate_listings
            where id = property_inquiries.listing_id
            and agent_id = auth.uid()
        )
    );
    
create policy "Users can create inquiries" 
    on public.property_inquiries for insert 
    with check (true);
