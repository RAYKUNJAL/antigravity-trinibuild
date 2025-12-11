-- Migration: 27_admin_rls_policies.sql
-- Description: Adds helper function for admin check and universally grants admins access to key tables.

-- 1. Create is_admin() helper function
-- This function checks if the current user has the 'admin' role in the profiles table.
-- It is stable (cached per statement) and security definer to read the profiles table even if RLS would block it.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- 2. Profiles Policies
-- Admin can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_admin());

-- Admin can update all profiles
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.is_admin());

-- Admin can delete profiles (if needed, use with caution)
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (public.is_admin());


-- 3. Stores Policies
-- Admin can view all stores
CREATE POLICY "Admins can view all stores"
ON public.stores
FOR SELECT
USING (public.is_admin());

-- Admin can update all stores
CREATE POLICY "Admins can update all stores"
ON public.stores
FOR UPDATE
USING (public.is_admin());

-- Admin can delete stores
CREATE POLICY "Admins can delete stores"
ON public.stores
FOR DELETE
USING (public.is_admin());


-- 4. Store Subscriptions Policies
-- Admin can view all subscriptions
CREATE POLICY "Admins can view all list subscription"
ON public.store_subscriptions
FOR SELECT
USING (public.is_admin());

-- Admin can manage subscriptions
CREATE POLICY "Admins can manage all subscriptions"
ON public.store_subscriptions
FOR ALL
USING (public.is_admin());


-- 5. Subscription Plans Policies
-- Admin can manage plans (Create/Update/Delete)
CREATE POLICY "Admins can manage subscription plans"
ON public.subscription_plans
FOR ALL
USING (public.is_admin());
