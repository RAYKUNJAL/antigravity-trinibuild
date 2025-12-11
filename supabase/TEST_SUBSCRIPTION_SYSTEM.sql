-- TEST SCRIPT: Verify Subscription System
-- Run this in your Supabase SQL Editor.
-- It will perform checks and then ROLLBACK so no data is permanently changed.

BEGIN;

-- 1. Verify Tables Exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans') THEN
        RAISE EXCEPTION 'Table subscription_plans missing!';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'store_subscriptions') THEN
        RAISE EXCEPTION 'Table store_subscriptions missing!';
    END IF;
    RAISE NOTICE '✅ Tables exist.';
END $$;

-- 2. Verify Plans Seeded
DO $$
DECLARE
    plan_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO plan_count FROM public.subscription_plans 
    WHERE id IN ('hustle', 'storefront', 'growth', 'empire');
    
    IF plan_count < 4 THEN
        RAISE EXCEPTION 'Missing subscription plans! Found only %', plan_count;
    END IF;
    RAISE NOTICE '✅ All 4 plans seeded.';
END $$;

-- 3. Test Auto-Subscription Trigger
DO $$
DECLARE
    new_store_id UUID;
    sub_plan TEXT;
    store_plan TEXT;
BEGIN
    -- Create a fake store (mocking auth.uid() might be hard here without specific user, so we insert directly if RLS allows or we are superadmin)
    -- We assume this script runs as postgres/admin
    INSERT INTO public.stores (owner_id, name, slug, category)
    VALUES (auth.uid(), 'Test Store AutoSub', 'test-store-autosub', 'Retail')
    RETURNING id INTO new_store_id;

    -- Check store_subscriptions
    SELECT plan_id INTO sub_plan FROM public.store_subscriptions WHERE store_id = new_store_id;
    
    IF sub_plan IS NULL THEN
        RAISE EXCEPTION 'Trigger failed: No subscription created for new store.';
    END IF;
    
    IF sub_plan != 'hustle' THEN
        RAISE EXCEPTION 'Trigger failed: Expected hustle, got %', sub_plan;
    END IF;
    
    RAISE NOTICE '✅ Auto-subscription trigger working (Created hustle plan).';
    
    -- 4. Test Sync Trigger (Update Subscription -> Update Store)
    UPDATE public.store_subscriptions SET plan_id = 'growth' WHERE store_id = new_store_id;
    
    -- Check stores table
    SELECT plan_tier INTO store_plan FROM public.stores WHERE id = new_store_id;
    
    IF store_plan != 'growth' THEN
        RAISE EXCEPTION 'Sync Trigger failed: Store tier is %, expected growth', store_plan;
    END IF;
    
    RAISE NOTICE '✅ Sync trigger working (Store tier updated to growth).';
    
END $$;

RAISE NOTICE '🎉 ALL SYSTEM TESTS PASSED!';

ROLLBACK; -- Clean up test data
