-- Migration: 24_sync_profile_tier.sql
-- Description: Syncs store plan tier changes to the owner's profile subscription tier

-- Enable RLS on stores (Ensure it is enabled)
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Create or Replace Function to sync profile tier
CREATE OR REPLACE FUNCTION public.sync_profile_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.profiles
  SET subscription_tier = NEW.plan_tier
  WHERE id = NEW.owner_id;
  RETURN NEW;
END;
$$;

-- Secure the function
REVOKE ALL ON FUNCTION public.sync_profile_tier() FROM PUBLIC;

-- Create Trigger on stores table
DROP TRIGGER IF EXISTS on_store_plan_tier_change ON public.stores;
CREATE TRIGGER on_store_plan_tier_change
AFTER UPDATE OF plan_tier ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_tier();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stores_owner ON public.stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_store_subscriptions_store ON public.store_subscriptions(store_id);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
