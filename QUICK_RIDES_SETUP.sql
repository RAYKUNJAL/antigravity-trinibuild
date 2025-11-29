-- Quick Setup: Run this in Supabase SQL Editor
-- This creates the rides table with GPS tracking

create table if not exists public.rides (
  id uuid default uuid_generate_v4() primary key,
  passenger_id uuid references public.profiles(id) not null,
  driver_id uuid references public.profiles(id),
  
  pickup_location text not null,
  dropoff_location text not null,
  pickup_lat decimal(10, 8),
  pickup_lng decimal(11, 8),
  dropoff_lat decimal(10, 8),
  dropoff_lng decimal(11, 8),
  
  -- Real-time driver location
  driver_lat decimal(10, 8),
  driver_lng decimal(11, 8),
  
  status text default 'searching',
  price decimal(10, 2) not null,
  payment_method text default 'cash',
  
  driver_name text,
  driver_car text,
  driver_plate text,
  driver_rating decimal(3, 2),
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  accepted_at timestamp with time zone,
  started_at timestamp with time zone,
  completed_at timestamp with time zone
);

-- Enable Realtime (CRITICAL for live tracking!)
alter publication supabase_realtime add table public.rides;

alter table public.rides enable row level security;

create policy "Anyone can do anything with rides for testing"
  on public.rides for all
  using ( true )
  with check ( true );

-- Index for performance
create index if not exists rides_status_idx on public.rides(status);
create index if not exists rides_created_at_idx on public.rides(created_at desc);
