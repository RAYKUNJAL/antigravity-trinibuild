-- 1. Ensure Profiles table has all necessary columns
-- We use 'if not exists' to avoid errors if they are already there
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists marketing_opt_in boolean default false;
alter table public.profiles add column if not exists vault_data jsonb default '{}'::jsonb;

-- 2. Update the User Creation Trigger
-- This ensures that when a user signs up, their profile is created correctly without errors
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  );
  return new;
end;
$$ language plpgsql security definer;

-- 3. Create the Admin Role Assignment Function
-- This is the critical function that was missing or broken
create or replace function public.assign_admin_role(target_role text, secret_key text)
returns jsonb as $$
declare
  user_id uuid;
  user_email text;
begin
  -- Get the ID of the user calling this function
  user_id := auth.uid();
  
  if user_id is null then
    return '{"success": false, "message": "Not authenticated"}'::jsonb;
  end if;

  -- Verify the Secret Key
  if (target_role = 'admin' and secret_key = 'Island4Life12$') or
     (target_role = 'store_admin' and secret_key = 'STORE_ADMIN_KEY_2025') then
     
     -- Update the user's role in the profiles table
     update public.profiles
     set role = target_role
     where id = user_id;
     
     -- If the profile didn't exist (rare), create it now
     if not found then
       select email into user_email from auth.users where id = user_id;
       insert into public.profiles (id, email, full_name, role)
       values (
         user_id, 
         user_email, 
         (select raw_user_meta_data->>'full_name' from auth.users where id = user_id), 
         target_role
       );
     end if;
     
     return '{"success": true}'::jsonb;
     
  else
    return '{"success": false, "message": "Invalid secret key"}'::jsonb;
  end if;

exception when others then
  -- Catch any other errors (like database permission issues)
  return jsonb_build_object('success', false, 'message', SQLERRM);
end;
$$ language plpgsql security definer;

-- 4. Grant execute permission to everyone (authenticated users)
grant execute on function public.assign_admin_role(text, text) to authenticated;
grant execute on function public.assign_admin_role(text, text) to service_role;
