-- Function to securely assign admin roles
-- This runs with "security definer" privileges, bypassing Row Level Security (RLS)
-- This ensures that even if a user cannot update their own role directly, this function can do it for them
-- provided they supply the correct secret key.

create or replace function public.assign_admin_role(target_role text, secret_key text)
returns jsonb as $$
declare
  user_id uuid;
  user_email text;
begin
  -- Get current user ID
  user_id := auth.uid();
  
  if user_id is null then
    return '{"success": false, "message": "Not authenticated"}'::jsonb;
  end if;

  -- Validate Secret Key (Server-side check)
  if (target_role = 'admin' and secret_key = 'Island4Life12$') or
     (target_role = 'store_admin' and secret_key = 'STORE_ADMIN_KEY_2025') then
     
     -- 1. Try to update existing profile
     update public.profiles
     set role = target_role
     where id = user_id;
     
     -- 2. If no row was updated (profile missing), insert a new one
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
  return jsonb_build_object('success', false, 'message', SQLERRM);
end;
$$ language plpgsql security definer;
