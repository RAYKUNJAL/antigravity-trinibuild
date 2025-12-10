-- Seed Data: 14_seed_demo_store.sql
-- Description: Creates a demo "Pro" store with extensive configuration to verify the new schema.

-- 1. Get a user ID (Using the specific admin email if available, otherwise fallback)
DO $$
DECLARE
    v_user_id UUID;
    v_store_id UUID;
    v_category_electronics UUID;
    v_category_clothing UUID;
BEGIN
    -- Attempt to find the admin user, or pick the first user available
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'raykunjal@gmail.com' LIMIT 1;
    
    -- Fallback if admin not found (just for safety in dev envs)
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    END IF;

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'No users found to attach store to. Skipping seed.';
        RETURN;
    END IF;

    -- 2. Create the Store
    INSERT INTO public.stores (
        owner_id,
        name,
        slug,
        description,
        status,
        settings,
        theme,
        customer_config
    ) VALUES (
        v_user_id,
        'TriniTech MegaStore',
        'trinitech',
        'The premier destination for electronics and lifestyle goods in T&T.',
        'active',
        '{
            "currency": "TTD",
            "taxInclusive": true, 
            "shippingZones": [
                {"id": "zone_1", "name": "Port of Spain", "countries": ["TT"], "rates": [{"name": "Express", "price": 30}]}
            ]
        }'::jsonb,
        '{
            "template": "modern",
            "colors": {"primary": "#0F172A", "secondary": "#3B82F6"}
        }'::jsonb,
        '{
            "allowGuestCheckout": true
        }'::jsonb
    )
    ON CONFLICT (slug) DO UPDATE SET 
        settings = EXCLUDED.settings -- just touch the row
    RETURNING id INTO v_store_id;

    -- 3. Create Categories
    INSERT INTO public.categories (store_id, name, slug)
    VALUES (v_store_id, 'Electronics', 'electronics')
    RETURNING id INTO v_category_electronics;

    INSERT INTO public.categories (store_id, name, slug)
    VALUES (v_store_id, 'Clothing', 'clothing')
    RETURNING id INTO v_category_clothing;

    -- 4. Create Complex Product (Smartphone)
    INSERT INTO public.products (
        store_id,
        name,
        sku,
        description,
        price,
        stock,
        category,
        category_ids,
        variants,
        specifications,
        status
    ) VALUES (
        v_store_id,
        'TriniPhone X Pro',
        'TP-XPRO-001',
        'The latest in local smartphone technology. Fast, reliable, and built for the heat.',
        4999.00,
        100, -- Total virtual stock
        'Electronics',
        ARRAY[v_category_electronics::text],
        '[
            {
                "id": "var_1",
                "title": "Midnight Black / 128GB",
                "price": 4999.00,
                "options": {"Color": "Black", "Storage": "128GB"},
                "inventory": {"qty": 50, "track": true}
            },
            {
                "id": "var_2",
                "title": "Ocean Blue / 256GB",
                "price": 5499.00,
                "options": {"Color": "Blue", "Storage": "256GB"},
                "inventory": {"qty": 30, "track": true}
            }
        ]'::jsonb,
        '{"Screen": "6.7 inch OLED", "Battery": "5000mAh", "Processor": "Octa-Core"}'::jsonb,
        'active'
    );

    -- 5. Create Simple Product (T-Shirt)
    INSERT INTO public.products (
        store_id,
        name,
        sku,
        description,
        price,
        stock,
        category,
        category_ids,
        variants,
        status
    ) VALUES (
        v_store_id,
        'Official TriniBuild Tee',
        'TB-TEE-001',
        'Cotton blend t-shirt with the official logo.',
        150.00,
        500,
        'Clothing',
        ARRAY[v_category_clothing::text],
        '[
            {
                "id": "var_t1", 
                "title": "Medium", 
                "price": 150.00, 
                "options": {"Size": "M"}, 
                "inventory": {"qty": 200, "track": true}
            }
        ]'::jsonb,
        'active'
    );

END $$;
