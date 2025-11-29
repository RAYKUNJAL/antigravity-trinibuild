-- Add phone and marketing columns to profiles
alter table public.profiles 
add column if not exists phone text,
add column if not exists marketing_opt_in boolean default false;

-- Update the handle_new_user function to include phone
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$ language plpgsql security definer;
