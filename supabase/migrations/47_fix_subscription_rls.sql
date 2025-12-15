-- Migration: 47_fix_subscription_rls.sql
-- Description: Enable RLS updates for store owners on subscriptions

ALTER TABLE public.store_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow store owners to update their own subscription
-- This is needed so that after store creation, the client can call update() to upgrade the plan
-- from the default 'hustle' to 'storefront' or 'growth'.
CREATE POLICY "Store owners can update their subscription" ON public.store_subscriptions
    FOR UPDATE
    USING (
        store_id IN (
            SELECT id FROM public.stores 
            WHERE owner_id = auth.uid()
        )
    )
    WITH CHECK (
        store_id IN (
            SELECT id FROM public.stores 
            WHERE owner_id = auth.uid()
        )
    );
