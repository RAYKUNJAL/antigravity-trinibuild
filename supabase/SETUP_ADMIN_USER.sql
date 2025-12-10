-- ============================================================================
-- COMPLETE ADMIN USER SETUP FOR TRINIBUILD
-- ============================================================================
-- Run this entire script in your Supabase SQL Editor
-- This will create an admin user that can login immediately
-- ============================================================================

-- STEP 1: Ensure the trigger is removed (prevents signup errors)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- STEP 2: Create the admin user directly in auth.users
-- Note: Supabase doesn't allow direct INSERT into auth.users via SQL
-- So we'll use a different approach - we'll create a function that uses auth.admin

-- First, let's check if the user already exists
DO $$
DECLARE
    user_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM auth.users WHERE email = 'raykunjal@gmail.com'
    ) INTO user_exists;
    
    IF user_exists THEN
        RAISE NOTICE 'User already exists. Updating metadata...';
        
        -- Update existing user's metadata to add admin role
        UPDATE auth.users
        SET 
            raw_user_meta_data = jsonb_set(
                COALESCE(raw_user_meta_data, '{}'::jsonb),
                '{role}',
                '"admin"'
            ),
            raw_user_meta_data = jsonb_set(
                raw_user_meta_data,
                '{full_name}',
                '"Ray Kunjal"'
            ),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW())
        WHERE email = 'raykunjal@gmail.com';
        
        RAISE NOTICE 'User metadata updated successfully!';
    ELSE
        RAISE NOTICE 'User does not exist yet.';
        RAISE NOTICE 'Please create the user via Supabase Dashboard:';
        RAISE NOTICE '1. Go to Authentication → Users';
        RAISE NOTICE '2. Click "Add User" → "Create new user"';
        RAISE NOTICE '3. Email: raykunjal@gmail.com';
        RAISE NOTICE '4. Password: Island4Life12$';
        RAISE NOTICE '5. Check "Auto Confirm User"';
        RAISE NOTICE '6. Then run this script again to add admin role';
    END IF;
END $$;

-- STEP 3: Verify the setup
SELECT 
    email,
    email_confirmed_at IS NOT NULL as email_confirmed,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'full_name' as full_name,
    created_at
FROM auth.users
WHERE email = 'raykunjal@gmail.com';

-- ============================================================================
-- EXPECTED OUTPUT:
-- ============================================================================
-- If user exists: You should see one row with:
--   - email: raykunjal@gmail.com
--   - email_confirmed: true
--   - role: admin
--   - full_name: Ray Kunjal
--
-- If user doesn't exist: You'll see "0 rows" - follow the instructions above
-- ============================================================================

-- STEP 4: Test query to verify admin can be identified
SELECT 
    'Admin user ready!' as status,
    email,
    raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'raykunjal@gmail.com'
  AND raw_user_meta_data->>'role' = 'admin';

-- ============================================================================
-- AFTER RUNNING THIS SCRIPT:
-- ============================================================================
-- 1. If you see "Admin user ready!" with the email, you're done!
-- 2. Go to http://localhost:3000/#/admin
-- 3. Click "Login" (NOT "New Admin")
-- 4. Email: raykunjal@gmail.com
-- 5. Password: Island4Life12$
-- 6. You should be redirected to the admin dashboard
-- ============================================================================
