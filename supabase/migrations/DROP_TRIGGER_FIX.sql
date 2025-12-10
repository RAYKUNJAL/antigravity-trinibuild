-- EMERGENCY FIX: Drop the trigger that's blocking signups
-- This allows users to sign up without needing the profiles table

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Verify the trigger is gone
SELECT 
  'Trigger removed successfully' as status,
  count(*) as remaining_triggers
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
