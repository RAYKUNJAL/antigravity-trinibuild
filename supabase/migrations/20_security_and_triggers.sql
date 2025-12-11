-- Migration: 20_security_and_triggers.sql

-- 1. store_subscriptions RLS (Update/Insert)
-- Allow store owners to update their own subscription (e.g. upgrading plan)
CREATE POLICY "Store owners can update their subscription" ON public.store_subscriptions
FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.stores WHERE id = store_subscriptions.store_id AND owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.stores WHERE id = store_subscriptions.store_id AND owner_id = auth.uid()));

-- Allow store owners to insert a subscription (if auto-trigger fails or for manual creates)
CREATE POLICY "Store owners can create subscription" ON public.store_subscriptions
FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid()));

-- 2. stores RLS (Ensure it exists and is correct)
-- (Re-applying these is safe, they will just error if exist or we can use DO blocks, but simple policies usually OK to restate if we drop first, 
--  but better to just ensure coverage for 'plan_tier' updates which are handled by trigger technically, 
--  but if we want manual updates we might need it. The trigger uses SECURITY DEFINER so it bypasses RLS for the actual update on stores).

-- However, we should ensure 'stores' is readable/writable by owner.
DROP POLICY IF EXISTS "Store owners can update their own store" ON public.stores;
CREATE POLICY "Store owners can update their own store" ON public.stores
FOR UPDATE
USING (auth.uid() = owner_id);

-- 3. Sync Profile (Optional but good for fallback)
-- Sync store plan back to profile for legacy compatibility
CREATE OR REPLACE FUNCTION public.sync_profile_tier() RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles 
    SET subscription_tier = (SELECT name FROM public.subscription_plans WHERE id = NEW.plan_id)
    WHERE id = (SELECT owner_id FROM public.stores WHERE id = NEW.store_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_sub_change_profile
AFTER UPDATE OF plan_id ON public.store_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_tier();
