-- 1. Reload the Schema Cache (Critical Step)
-- This forces PostgREST to refresh its knowledge of the database schema
NOTIFY pgrst, 'reload config';

-- 2. Verify Profiles Table Exists
select count(*) from public.profiles;

-- 3. Re-Grant Permissions (Just in case)
grant usage on schema public to anon, authenticated, service_role;
grant all on public.profiles to anon, authenticated, service_role;
grant all on public.profiles to postgres;

-- 4. Ensure RLS is enabled but policies exist
alter table public.profiles enable row level security;

-- 5. Re-create the policy that allows users to update their own profile
drop policy if exists "Users can update own profile." on public.profiles;
create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- 6. Re-create the policy that allows users to insert their own profile (for upsert)
drop policy if exists "Users can insert their own profile." on public.profiles;
create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

-- 7. Allow users to read their own profile
drop policy if exists "Users can view own profile." on public.profiles;
create policy "Users can view own profile."
  on public.profiles for select
  using ( auth.uid() = id );
