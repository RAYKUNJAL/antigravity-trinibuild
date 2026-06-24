-- ============================================================
-- TriniBuild DEMO SEED — Directory (stores) + Market (classifieds)
-- ------------------------------------------------------------
-- Makes /directory and /classifieds look alive instead of empty.
-- SAFE + REVERSIBLE: every seeded row is tagged so you can wipe it:
--   stores:               slug LIKE 'demo-%'
--   classified_listings:  title LIKE '[DEMO]%'
--
-- HOW TO RUN: Supabase Dashboard → SQL Editor → paste → Run.
-- Requires at least ONE existing auth.users row (your own account);
-- the demo rows are owned by that user so RLS/foreign keys are satisfied.
-- ============================================================

DO $$
DECLARE
  demo_owner UUID;
BEGIN
  -- Use the first existing auth user as the demo owner
  SELECT id INTO demo_owner FROM auth.users ORDER BY created_at ASC LIMIT 1;

  IF demo_owner IS NULL THEN
    RAISE EXCEPTION 'No auth.users found — sign up at least one account first, then re-run.';
  END IF;

  -- ---------------------------------------------------------
  -- DIRECTORY: demo active stores (slug LIKE 'demo-%')
  -- ---------------------------------------------------------
  INSERT INTO public.stores (owner_id, name, slug, description, category, location, whatsapp, status, banner_url)
  VALUES
    (demo_owner, 'Maria''s Boutique', 'demo-marias-boutique', 'Trendy island fashion, dresses & accessories. COD island-wide.', 'Fashion', 'San Fernando', '18681234567', 'active', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'),
    (demo_owner, 'Kevin''s Auto Parts', 'demo-kevins-auto-parts', 'OEM & aftermarket parts for all makes. Fast delivery.', 'Automotive', 'Chaguanas', '18682345678', 'active', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80'),
    (demo_owner, 'Glow Beauty', 'demo-glow-beauty', 'Skincare, cosmetics & shade-matched makeup. Subscribe & save.', 'Beauty', 'Port of Spain', '18683456789', 'active', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80'),
    (demo_owner, 'Raj''s Doubles', 'demo-rajs-doubles', 'Best doubles in T&T. Order ahead on WhatsApp. Open 5am–2pm.', 'Food & Beverage', 'Arima', '18684567890', 'active', 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80'),
    (demo_owner, 'TechHub TT', 'demo-techhub-tt', 'Phones, laptops & accessories at island prices. Warranty included.', 'Electronics', 'Port of Spain', '18685678901', 'active', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80'),
    (demo_owner, 'Island Home Furniture', 'demo-island-home-furniture', 'Modern furniture & decor for the Caribbean home. Free delivery $1500+.', 'Retail', 'Chaguanas', '18686789012', 'active', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80'),
    (demo_owner, 'Fade Kings Barbershop', 'demo-fade-kings', 'Precision cuts & hot towel shaves. Book online. Walk-ins welcome.', 'Services', 'San Fernando', '18687890123', 'active', 'https://images.unsplash.com/photo-1560066984-138daaa0fda4?w=800&q=80'),
    (demo_owner, 'Sweet Trini Bakes', 'demo-sweet-trini-bakes', 'Custom cakes, pastries & event catering. Made with love.', 'Food & Beverage', 'Tunapuna', '18688901234', 'active', 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80'),
    (demo_owner, 'Isle Mode Fashion', 'demo-isle-mode', 'Streetwear & sneakers. Limited drops. Size pills + COD.', 'Fashion', 'Port of Spain', '18689012345', 'active', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80'),
    (demo_owner, 'CarePlus Pharmacy', 'demo-careplus-pharmacy', 'Prescriptions, OTC & wellness. Upload your Rx, we deliver.', 'Retail', 'Arima', '18681112233', 'active', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80'),
    (demo_owner, 'Iron Trini Gym', 'demo-iron-trini-gym', '24/7 access, 50+ classes & expert coaches. Free trial.', 'Services', 'Chaguanas', '18682223344', 'active', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80'),
    (demo_owner, 'Aurum Jewellery', 'demo-aurum-jewellery', 'Fine jewellery & watches. Custom design & appraisals.', 'Retail', 'Port of Spain', '18683334455', 'active', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80')
  ON CONFLICT (slug) DO NOTHING;

  -- ---------------------------------------------------------
  -- MARKET: demo classified listings (title LIKE '[DEMO]%')
  -- ---------------------------------------------------------
  INSERT INTO classified_listings (user_id, title, description, price, category, location, images, contact_info, status, promoted)
  VALUES
    (demo_owner, '[DEMO] 2017 Nissan AD Wagon', 'Excellent condition, low mileage, AC ice cold. Serious buyers only.', 68000, 'Vehicles', 'Chaguanas', ARRAY['https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80'], '{"phone":"18681234567"}'::jsonb, 'active', true),
    (demo_owner, '[DEMO] iPhone 14 Pro 256GB', 'Like new, box & charger included. No scratches. Unlocked.', 6499, 'Electronics', 'Port of Spain', ARRAY['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80'], '{"phone":"18682345678"}'::jsonb, 'active', true),
    (demo_owner, '[DEMO] 3-Seater Fabric Sofa', 'Grey, barely used, smoke-free home. Pickup San Fernando.', 2800, 'Furniture', 'San Fernando', ARRAY['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80'], '{"phone":"18683456789"}'::jsonb, 'active', false),
    (demo_owner, '[DEMO] MacBook Air M2', '8GB/256GB, perfect for work & school. AppleCare till 2026.', 8499, 'Electronics', 'Port of Spain', ARRAY['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80'], '{"phone":"18684567890"}'::jsonb, 'active', false),
    (demo_owner, '[DEMO] 2BR Apartment for Rent', 'Furnished, secure, parking. Arima central. $4500/mo.', 4500, 'Real Estate', 'Arima', ARRAY['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80'], '{"phone":"18685678901"}'::jsonb, 'active', true),
    (demo_owner, '[DEMO] Nike Air Force 1 — Size 10', 'Brand new, deadstock, 100% authentic. White/white.', 850, 'Clothing', 'Port of Spain', ARRAY['https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=80'], '{"phone":"18686789012"}'::jsonb, 'active', false),
    (demo_owner, '[DEMO] Power Drill + Bit Set', 'Cordless 20V, 2 batteries, hardly used. Great for DIY.', 650, 'Tools', 'Chaguanas', ARRAY['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80'], '{"phone":"18687890123"}'::jsonb, 'active', false),
    (demo_owner, '[DEMO] Event Decor & Catering', 'Weddings, birthdays & corporate. Book your date now.', 1500, 'Services', 'Tunapuna', ARRAY['https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'], '{"phone":"18688901234"}'::jsonb, 'active', false),
    (demo_owner, '[DEMO] Samsung 55" 4K Smart TV', 'Crisp picture, all apps, wall mount included.', 4200, 'Electronics', 'San Fernando', ARRAY['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80'], '{"phone":"18689012345"}'::jsonb, 'active', false),
    (demo_owner, '[DEMO] Queen Bed + Mattress', 'Solid wood frame, orthopedic mattress. Excellent condition.', 3200, 'Furniture', 'Port of Spain', ARRAY['https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&q=80'], '{"phone":"18681112233"}'::jsonb, 'active', false),
    (demo_owner, '[DEMO] Used Toyota Hilux 2015', '4x4, diesel, well maintained, full service history.', 165000, 'Vehicles', 'Arima', ARRAY['https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800&q=80'], '{"phone":"18682223344"}'::jsonb, 'active', true),
    (demo_owner, '[DEMO] Wireless Headphones', 'Noise cancelling, 30hr battery, sealed box.', 950, 'Electronics', 'Chaguanas', ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'], '{"phone":"18683334455"}'::jsonb, 'active', false);

  RAISE NOTICE 'Seed complete. Demo owner = %', demo_owner;
END $$;

-- ============================================================
-- TO REMOVE ALL DEMO DATA LATER:
--   DELETE FROM classified_listings WHERE title LIKE '[DEMO]%';
--   DELETE FROM public.stores WHERE slug LIKE 'demo-%';
-- ============================================================
