-- COMPREHENSIVE FIX FOR ADMIN LOGIN
-- This script will completely rebuild the profiles table and all related functions

-- Step 1: Drop and recreate the profiles table
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  role text default 'user',
  phone text,
  marketing_opt_in boolean default false,
  vault_data jsonb default '{}'::jsonb,
  subscription_tier text default 'Community Plan',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Step 2: Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Step 4: Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.profiles TO anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres;

-- Step 5: Create trigger function for new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'phone', '')
  );
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- If insert fails, just return new anyway to not block signup
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Create the admin role assignment function
CREATE OR REPLACE FUNCTION public.assign_admin_role(target_role text, secret_key text)
RETURNS jsonb AS $$
DECLARE
  user_id uuid;
  user_email text;
BEGIN
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN '{"success": false, "message": "Not authenticated"}'::jsonb;
  END IF;

  -- Validate Secret Key
  IF (target_role = 'admin' AND secret_key = 'Island4Life12$') OR
     (target_role = 'store_admin' AND secret_key = 'STORE_ADMIN_KEY_2025') THEN
     
    -- Try to update existing profile
    UPDATE public.profiles
    SET role = target_role
    WHERE id = user_id;
    
    -- If no row was updated (profile missing), insert a new one
    IF NOT FOUND THEN
      SELECT email INTO user_email FROM auth.users WHERE id = user_id;
      
      INSERT INTO public.profiles (id, email, full_name, role)
      VALUES (
        user_id,
        user_email,
        (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = user_id),
        target_role
      );
    END IF;
    
    RETURN '{"success": true}'::jsonb;
  ELSE
    RETURN '{"success": false, "message": "Invalid secret key"}'::jsonb;
  END IF;
  
EXCEPTION WHEN others THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION public.assign_admin_role(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_admin_role(text, text) TO service_role;

-- Step 9: Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);

-- Step 10: Verify everything was created
SELECT 
  'Profiles table created' as status,
  count(*) as row_count 
FROM public.profiles;
