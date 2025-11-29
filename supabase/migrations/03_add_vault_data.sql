-- Add vault_data column to profiles for secure storage of form data
alter table public.profiles 
add column if not exists vault_data jsonb default '{}'::jsonb;

-- Create a secure function to update vault data (ensuring only the user can do it)
create or replace function public.update_vault_data(new_data jsonb)
returns void as $$
begin
  update public.profiles
  set vault_data = new_data
  where id = auth.uid();
end;
$$ language plpgsql security definer;
