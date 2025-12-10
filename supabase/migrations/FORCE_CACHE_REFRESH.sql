-- 1. Force a physical schema change to trigger cache reload
-- This is the most reliable way to wake up the API if NOTIFY didn't work
alter table public.profiles add column if not exists _refresh_cache text;
alter table public.profiles drop column if exists _refresh_cache;

-- 2. Explicitly expose the table to the API
comment on table public.profiles is 'User profiles data';

-- 3. Toggle RLS to reset policies cache
alter table public.profiles disable row level security;
alter table public.profiles enable row level security;

-- 4. Re-Grant permissions explicitly
grant usage on schema public to anon, authenticated, service_role;
grant all on public.profiles to anon, authenticated, service_role;
grant all on public.profiles to postgres;

-- 5. Verify the table exists (Output should be 1 row)
select count(*) as table_exists from information_schema.tables 
where table_schema = 'public' and table_name = 'profiles';
