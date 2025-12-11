-- Migration: 26_sync_profiles_and_set_admin.sql
-- Description: Syncs missing profiles from auth.users and sets admin role for raykunjal@gmail.com

-- 1. Sync profiles from auth.users
-- This inserts a profile for any user in auth.users that doesn't have one in public.profiles
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
    u.id, 
    u.email, 
    COALESCE(u.raw_user_meta_data->>'full_name', 'User'),
    'user' -- Default role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- 2. Set Admin Role
-- Explicitly set raykunjal@gmail.com to admin
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'raykunjal@gmail.com';

-- 3. Verify result (for log output)
SELECT id, email, role FROM public.profiles WHERE email = 'raykunjal@gmail.com';
