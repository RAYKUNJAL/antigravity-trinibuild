
-- RIDES TABLE
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

-- Enable RLS
alter table public.rides enable row level security;

-- Policies
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
