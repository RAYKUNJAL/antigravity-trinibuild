-- Migration: 25_add_owner_select_policies.sql
-- Description: Adds SELECT policies for store owners to view their own stores and subscriptions

-- 1. Policy for stores: Allow owners to view their own stores regardless of status (e.g. draft)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'stores' 
        AND policyname = 'Store owners can view their own store'
    ) THEN
        CREATE POLICY "Store owners can view their own store" 
        ON public.stores 
        FOR SELECT 
        USING (auth.uid() = owner_id);
    END IF;
END $$;

-- 2. Policy for store_subscriptions: Allow owners to view their own subscriptions
-- Note: This might already exist from migration 19, but ensuring it here is safe.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'store_subscriptions' 
        AND policyname = 'Store owners can view their subscription'
    ) THEN
        CREATE POLICY "Store owners can view their subscription" 
        ON public.store_subscriptions 
        FOR SELECT 
        USING (
            EXISTS (
                SELECT 1 
                FROM public.stores 
                WHERE stores.id = store_subscriptions.store_id 
                AND stores.owner_id = auth.uid()
            )
        );
    END IF;
END $$;
