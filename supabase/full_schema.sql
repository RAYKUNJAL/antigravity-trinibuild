
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES TABLE (Public user data)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  role text default 'user', -- 'user', 'vendor', 'driver', 'admin'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- STORES TABLE
create table public.stores (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) not null,
  name text not null,
  description text,
  logo_url text,
  banner_url text,
  category text,
  location text,
  whatsapp text,
  bot_name text default 'TriniBuild Support Bot',
  bot_persona text default 'support_bot',
  bot_system_prompt text,
  status text default 'pending', -- 'pending', 'active', 'suspended'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for stores
alter table public.stores enable row level security;

-- Stores Policies
create policy "Stores are viewable by everyone."
  on public.stores for select
  using ( true );

create policy "Vendors can insert their own store."
  on public.stores for insert
  with check ( auth.uid() = owner_id );

create policy "Vendors can update their own store."
  on public.stores for update
  using ( auth.uid() = owner_id );

-- PRODUCTS TABLE
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references public.stores(id) not null,
  name text not null,
  description text,
  price decimal(10,2) not null,
  stock integer default 0,
  image_url text,
  category text,
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for products
alter table public.products enable row level security;

-- Products Policies
create policy "Products are viewable by everyone."
  on public.products for select
  using ( true );

create policy "Vendors can insert products for their store."
  on public.products for insert
  with check ( exists ( select 1 from public.stores where id = store_id and owner_id = auth.uid() ) );

create policy "Vendors can update their own products."
  on public.products for update
  using ( exists ( select 1 from public.stores where id = store_id and owner_id = auth.uid() ) );

create policy "Vendors can delete their own products."
  on public.products for delete
  using ( exists ( select 1 from public.stores where id = store_id and owner_id = auth.uid() ) );

-- ORDERS TABLE
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  customer_id uuid references public.profiles(id) not null,
  store_id uuid references public.stores(id) not null,
  total decimal(10,2) not null,
  status text default 'pending', -- 'pending', 'processing', 'completed', 'cancelled'
  items jsonb not null, -- Store order items as JSON for simplicity
  delivery_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for orders
alter table public.orders enable row level security;

-- Orders Policies
create policy "Users can view their own orders."
  on public.orders for select
  using ( auth.uid() = customer_id );

create policy "Vendors can view orders for their store."
  on public.orders for select
  using ( exists ( select 1 from public.stores where id = store_id and owner_id = auth.uid() ) );

create policy "Users can create orders."
  on public.orders for insert
  with check ( auth.uid() = customer_id );

-- TRIGGER: Create Profile on Signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- DRIVER APPLICATIONS TABLE
create table public.driver_applications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  full_name text not null,
  phone text,
  vehicle_type text,
  license_number text,
  status text default 'pending', -- 'pending', 'approved', 'rejected'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.driver_applications enable row level security;

create policy "Users can view their own driver applications."
  on public.driver_applications for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own driver applications."
  on public.driver_applications for insert
  with check ( auth.uid() = user_id );

-- PROMOTER APPLICATIONS TABLE
create table public.promoter_applications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  organization_name text,
  event_types text[],
  experience_years text,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.promoter_applications enable row level security;

create policy "Users can view their own promoter applications."
  on public.promoter_applications for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own promoter applications."
  on public.promoter_applications for insert
  with check ( auth.uid() = user_id );

-- SIGNED AGREEMENTS TABLE
create table public.signed_agreements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  document_type text not null, -- 'contractor_agreement', 'liability_waiver', etc.
  document_version text,
  signature_data text, -- Base64 or text signature
  ip_address text,
  signed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.signed_agreements enable row level security;

create policy "Users can view their own signed agreements."
  on public.signed_agreements for select
  using ( auth.uid() = user_id );

create policy "Users can sign agreements."
  on public.signed_agreements for insert
  with check ( auth.uid() = user_id );

-- RIDES TABLE (NEW)
create table if not exists public.rides (
  id uuid default uuid_generate_v4() primary key,
  passenger_id uuid references public.profiles(id) not null,
  driver_id uuid references public.profiles(id), -- Nullable until matched
  pickup_location text not null,
  dropoff_location text not null,
  pickup_lat float,
  pickup_lng float,
  dropoff_lat float,
  dropoff_lng float,
  status text default 'searching', -- 'searching', 'accepted', 'arrived', 'in_progress', 'completed', 'cancelled'
  price decimal(10,2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for rides
alter table public.rides enable row level security;

-- Rides Policies
create policy "Users can view their own rides"
  on public.rides for select
  using ( auth.uid() = passenger_id );

create policy "Drivers can view available rides"
  on public.rides for select
  using ( exists ( select 1 from public.profiles where id = auth.uid() and role = 'driver' ) );

create policy "Users can create rides"
  on public.rides for insert
  with check ( auth.uid() = passenger_id );

create policy "Drivers can update rides (accept/complete)"
  on public.rides for update
  using ( exists ( select 1 from public.profiles where id = auth.uid() and role = 'driver' ) );
