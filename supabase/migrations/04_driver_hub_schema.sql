-- TriniBuild Driver Hub Database Schema
-- Supports: Rideshare, Delivery, and Courier services with monetization

-- DRIVERS TABLE
create table if not exists public.drivers (
  id uuid primary key references public.profiles(id) on delete cascade,
  
  -- Service activation (drivers can enable multiple)
  rideshare_enabled boolean default false,
  delivery_enabled boolean default false,
  courier_enabled boolean default false,
  
  -- Real-time status
  status text default 'offline' check (status in ('offline', 'online', 'busy', 'on_break')),
  current_location_lat decimal(10, 8),
  current_location_lng decimal(11, 8),
  last_location_update timestamp with time zone,
  
  -- Vehicle information
  vehicle_type text check (vehicle_type in ('car', 'motorcycle', 'van', 'truck', 'bicycle')),
  vehicle_make text,
  vehicle_model text,
  vehicle_year integer,
  vehicle_plate text unique,
  vehicle_color text,
  
  -- Trinidad-specific verification
  license_number text,
  license_expiry date,
  insurance_expiry date,
  is_h_car boolean default false, -- Trinidad H-Car (taxi) registration
  h_car_number text,
  background_check_status text default 'pending' check (background_check_status in ('pending', 'approved', 'rejected')),
  
  -- Subscription tier (for monetization)
  subscription_tier text default 'free' check (subscription_tier in ('free', 'pro', 'elite')),
  subscription_started_at timestamp with time zone,
  subscription_expires_at timestamp with time zone,
  
  -- Performance stats
  total_rides integer default 0,
  total_deliveries integer default 0,
  total_courier_jobs integer default 0,
  total_jobs integer generated always as (total_rides + total_deliveries + total_courier_jobs) stored,
  
  rating decimal(3, 2) default 5.0 check (rating >= 0 and rating <= 5),
  total_ratings integer default 0,
  acceptance_rate decimal(5, 2) default 100.0,
  cancellation_rate decimal(5, 2) default 0.0,
  
  -- Earnings
  total_earnings decimal(12, 2) default 0,
  weekly_earnings decimal(10, 2) default 0,
  monthly_earnings decimal(10, 2) default 0,
  
  -- Payout preferences
  bank_name text,
  bank_account_number text,
  bank_routing_number text,
  payout_method text default 'weekly' check (payout_method in ('instant', 'weekly', 'monthly')),
  payout_email text,
  
  -- Metadata
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_active_at timestamp with time zone
);

-- GIG JOBS TABLE (Unified for all job types)
create table if not exists public.gig_jobs (
  id uuid primary key default uuid_generate_v4(),
  
  -- Job classification
  job_type text not null check (job_type in ('rideshare', 'delivery', 'courier')),
  
  -- Participants
  customer_id uuid references public.profiles(id) not null,
  driver_id uuid references public.drivers(id),
  store_id uuid references public.stores(id), -- For delivery orders
  
  -- Status workflow
  status text default 'searching' check (status in (
    'searching', 'accepted', 'arriving', 'picked_up', 
    'in_transit', 'near_destination', 'delivered', 'completed', 'cancelled'
  )),
  
  -- Locations
  pickup_location text not null,
  pickup_lat decimal(10, 8),
  pickup_lng decimal(11, 8),
  pickup_address_details text,
  
  dropoff_location text not null,
  dropoff_lat decimal(10, 8),
  dropoff_lng decimal(11, 8),
  dropoff_address_details text,
  
  -- Real-time driver tracking
  driver_lat decimal(10, 8),
  driver_lng decimal(11, 8),
  driver_heading decimal(5, 2), -- Direction in degrees
  driver_speed decimal(5, 2), -- km/h
  last_location_update timestamp with time zone,
  estimated_arrival timestamp with time zone,
  
  -- Pricing structure
  base_price decimal(10, 2) not null,
  distance_km decimal(6, 2),
  duration_minutes integer,
  surge_multiplier decimal(3, 2) default 1.0,
  booking_fee decimal(6, 2) default 2.00, -- Customer pays
  service_fee decimal(6, 2) default 0,
  total_price decimal(10, 2) not null,
  
  -- Monetization (TriniBuild's cut)
  commission_rate decimal(5, 2) not null, -- e.g., 15.00 for 15%
  trinibuild_commission decimal(10, 2) not null,
  driver_earnings decimal(10, 2) not null,
  
  -- Payment details
  payment_method text default 'cash' check (payment_method in ('cash', 'card', 'bank_transfer', 'mobile_money')),
  payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'refunded', 'failed')),
  tip_amount decimal(8, 2) default 0,
  promo_code text,
  discount_amount decimal(8, 2) default 0,
  
  -- Delivery-specific fields
  order_details jsonb, -- {items: [...], restaurant_name: "", order_number: ""}
  delivery_instructions text,
  contact_on_arrival boolean default false,
  leave_at_door boolean default false,
  
  -- Courier-specific fields
  package_type text check (package_type in ('document', 'small_package', 'medium_package', 'large_package', 'fragile')),
  package_weight_kg decimal(6, 2),
  declared_value decimal(10, 2),
  is_fragile boolean default false,
  requires_signature boolean default false,
  recipient_name text,
  recipient_phone text,
  tracking_code text unique,
  
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  accepted_at timestamp with time zone,
  pickup_started_at timestamp with time zone,
  picked_up_at timestamp with time zone,
  completed_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  
  -- Ratings & feedback
  customer_rating integer check (customer_rating >= 1 and customer_rating <= 5),
  customer_feedback text,
  driver_rating integer check (driver_rating >= 1 and driver_rating <= 5),
  driver_feedback text,
  
  -- Cancellation
  cancelled_by text check (cancelled_by in ('customer', 'driver', 'system')),
  cancellation_reason text,
  cancellation_fee decimal(8, 2) default 0,
  
  -- Admin notes
  notes text,
  flagged boolean default false,
  flag_reason text
);

-- DRIVER EARNINGS TABLE (for payout tracking)
create table if not exists public.driver_earnings (
  id uuid primary key default uuid_generate_v4(),
  driver_id uuid references public.drivers(id) not null,
  
  -- Earnings period
  period_type text not null check (period_type in ('daily', 'weekly', 'monthly')),
  period_start date not null,
  period_end date not null,
  
  -- Job breakdown
  rideshare_jobs integer default 0,
  rideshare_earnings decimal(10, 2) default 0,
  
  delivery_jobs integer default 0,
  delivery_earnings decimal(10, 2) default 0,
  
  courier_jobs integer default 0,
  courier_earnings decimal(10, 2) default 0,
  
  -- Additional income
  tips decimal(10, 2) default 0,
  bonuses decimal(10, 2) default 0,
  surge_earnings decimal(10, 2) default 0,
  
  -- Deductions
  trinibuild_commission decimal(10, 2) default 0,
  subscription_fee decimal(10, 2) default 0,
  instant_payout_fees decimal(10, 2) default 0,
  other_deductions decimal(10, 2) default 0,
  
  -- Totals
  gross_earnings decimal(12, 2) not null,
  net_earnings decimal(12, 2) not null,
  
  -- Payout tracking
  payout_status text default 'pending' check (payout_status in ('pending', 'processing', 'paid', 'failed')),
  payout_method text,
  payout_date timestamp with time zone,
  payout_reference text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- DRIVER DOCUMENTS TABLE (for verification)
create table if not exists public.driver_documents (
  id uuid primary key default uuid_generate_v4(),
  driver_id uuid references public.drivers(id) not null,
  
  document_type text not null check (document_type in (
    'drivers_license', 'vehicle_registration', 'insurance', 
    'h_car_permit', 'police_certificate', 'utility_bill'
  )),
  document_url text not null,
  verification_status text default 'pending' check (verification_status in ('pending', 'approved', 'rejected')),
  verified_by uuid references public.profiles(id),
  verified_at timestamp with time zone,
  rejection_reason text,
  expires_at date,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Realtime for live tracking
alter publication supabase_realtime add table public.gig_jobs;
alter publication supabase_realtime add table public.drivers;

-- Row Level Security
alter table public.drivers enable row level security;
alter table public.gig_jobs enable row level security;
alter table public.driver_earnings enable row level security;
alter table public.driver_documents enable row level security;

-- Drivers policies
create policy "Drivers can view their own profile"
  on public.drivers for select
  using (auth.uid() = id);

create policy "Drivers can update their own profile"
  on public.drivers for update
  using (auth.uid() = id);

-- Gig jobs policies
create policy "Customers can view their own jobs"
  on public.gig_jobs for select
  using (auth.uid() = customer_id);

create policy "Drivers can view their assigned jobs"
  on public.gig_jobs for select
  using (auth.uid() = driver_id);

create policy "Anyone can create jobs"
  on public.gig_jobs for insert
  with check (auth.uid() = customer_id);

create policy "Drivers can update their assigned jobs"
  on public.gig_jobs for update
  using (auth.uid() = driver_id);

create policy "System can update any job"
  on public.gig_jobs for update
  using (true);

-- Earnings policies
create policy "Drivers can view their own earnings"
  on public.driver_earnings for select
  using (auth.uid() = driver_id);

-- Indexes for performance
create index if not exists idx_drivers_status on public.drivers(status) where status = 'online';
create index if not exists idx_drivers_location on public.drivers(current_location_lat, current_location_lng) where status = 'online';
create index if not exists idx_drivers_services on public.drivers(rideshare_enabled, delivery_enabled, courier_enabled);

create index if not exists idx_gig_jobs_status on public.gig_jobs(status);
create index if not exists idx_gig_jobs_driver on public.gig_jobs(driver_id, status);
create index if not exists idx_gig_jobs_customer on public.gig_jobs(customer_id, created_at desc);
create index if not exists idx_gig_jobs_type on public.gig_jobs(job_type, status);
create index if not exists idx_gig_jobs_location on public.gig_jobs(pickup_lat, pickup_lng) where status = 'searching';

create index if not exists idx_earnings_driver_period on public.driver_earnings(driver_id, period_start, period_end);
create index if not exists idx_earnings_payout_status on public.driver_earnings(payout_status) where payout_status = 'pending';
