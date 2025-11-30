-- QUICK TEST SEED DATA FOR TICKETS
-- This script automatically uses the FIRST authenticated user in your system
-- Just run this after signing up through the app!

-- Sample Events (NOTE: These will use the first user as organizer)
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Get the first user (or create a test note if none exists)
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE 'No users found! Please sign up through the app first at http://localhost:3001';
  ELSE
    RAISE NOTICE 'Using user ID: %', test_user_id;
    
    -- Create Sample Events
    INSERT INTO events (id, organizer_id, title, description, date, time, location, image_url, category, status, is_verified) VALUES
      (
        '11111111-1111-1111-1111-111111111111',
        test_user_id,
        'Soca Monarch Finals 2026',
        'The biggest soca competition in Trinidad! Top contenders battling for the crown.',
        '2026-02-14',
        '20:00:00',
        'Queen''s Park Savannah, Port of Spain',
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1000',
        'Concert',
        'published',
        true
      ),
      (
        '22222222-2222-2222-2222-222222222222',
        test_user_id,
        'Beach House Premium All-Inclusive',
        'Ultimate Carnival Monday beach fete! Unlimited drinks, gourmet food, non-stop vibes.',
        '2026-02-16',
        '10:00:00',
        'Maracas Bay',
        'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=1000',
        'All Inclusive',
        'published',
        true
      ),
      (
        '33333333-3333-3333-3333-333333333333',
        test_user_id,
        'Jouvert Morning Madness',
        'Paint, powder, and pure vibes! The original Jouvert experience starts at 2AM.',
        '2026-02-17',
        '02:00:00',
        'Downtown Port of Spain',
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1000',
        'J''Ouvert',
        'published',
        false
      ),
      (
        '44444444-4444-4444-4444-444444444444',
        test_user_id,
        'Yacht Lime Caribbean Vibes',
        'Exclusive yacht party cruising the Western Peninsula. Limited capacity.',
        '2026-02-15',
        '16:00:00',
        'Crews Inn Marina, Chaguaramas',
        'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?q=80&w=1000',
        'Boat Ride',
        'published',
        true
      )
    ON CONFLICT (id) DO NOTHING;

    -- Ticket Tiers
    INSERT INTO ticket_tiers (event_id, name, price, currency, quantity_total, quantity_sold, perks, status) VALUES
      -- Soca Monarch
      ('11111111-1111-1111-1111-111111111111', 'General Admission', 150.00, 'TTD', 5000, 234, ARRAY['Standing access', 'Merch'], 'active'),
      ('11111111-1111-1111-1111-111111111111', 'VIP Seating', 500.00, 'TTD', 500, 125, ARRAY['Reserved seats', 'Premium bar', 'Meet & greet'], 'active'),
      ('11111111-1111-1111-1111-111111111111', 'All-Access Pass', 1200.00, 'TTD', 100, 47, ARRAY['Backstage', 'VIP lounge', 'Free drinks'], 'active'),
      
      -- Beach House
      ('22222222-2222-2222-2222-222222222222', 'Early Bird', 400.00, 'TTD', 300, 300, ARRAY['Unlimited drinks', 'Gourmet food'], 'sold_out'),
      ('22222222-2222-2222-2222-222222222222', 'Regular', 550.00, 'TTD', 800, 342, ARRAY['Unlimited drinks', 'Food', 'Event tee'], 'active'),
      ('22222222-2222-2222-2222-222222222222', 'VIP Cabana', 2500.00, 'TTD', 20, 8, ARRAY['Private cabana', 'Bottle service', 'Dedicated server'], 'active'),
      
      -- Jouvert
      ('33333333-3333-3333-3333-333333333333', 'Paint Package', 200.00, 'TTD', 2000, 456, ARRAY['Paint & powder', 'T-shirt', 'Drinks'], 'active'),
      ('33333333-3333-3333-3333-333333333333', 'Premium Band', 350.00, 'TTD', 500, 134, ARRAY['Premium paint', 'Costume', 'Unlimited drinks', 'Breakfast'], 'active'),
      
      -- Yacht
      ('44444444-4444-4444-4444-444444444444', 'General Boarding', 800.00, 'TTD', 80, 42, ARRAY['Yacht access', 'Open bar', 'Buffet'], 'active'),
      ('44444444-4444-4444-4444-444444444444', 'VIP Deck', 1500.00, 'TTD', 30, 18, ARRAY['Upper deck', 'Premium bar', 'Private seating', 'Gourmet menu'], 'active')
    ON CONFLICT DO NOTHING;

    -- Sample Tickets (3 purchases for the logged-in user)
    INSERT INTO tickets (event_id, tier_id, user_id, status, qr_code_hash, holder_name, holder_email) VALUES
      (
        '11111111-1111-1111-1111-111111111111',
        (SELECT id FROM ticket_tiers WHERE event_id = '11111111-1111-1111-1111-111111111111' AND name = 'VIP Seating' LIMIT 1),
        test_user_id,
        'valid',
        'TICKET-VIP-SOCA-' || substring(md5(random()::text) from 1 for 8),
        (SELECT COALESCE(raw_user_meta_data->>'full_name', email) FROM auth.users WHERE id = test_user_id),
        (SELECT email FROM auth.users WHERE id = test_user_id)
      ),
      (
        '22222222-2222-2222-2222-222222222222',
        (SELECT id FROM ticket_tiers WHERE event_id = '22222222-2222-2222-2222-222222222222' AND name = 'Regular' LIMIT 1),
        test_user_id,
        'valid',
        'TICKET-BCH-REG-' || substring(md5(random()::text) from 1 for 8),
        (SELECT COALESCE(raw_user_meta_data->>'full_name', email) FROM auth.users WHERE id = test_user_id),
        (SELECT email FROM auth.users WHERE id = test_user_id)
      ),
      (
        '33333333-3333-3333-3333-333333333333',
        (SELECT id FROM ticket_tiers WHERE event_id = '33333333-3333-3333-3333-333333333333' AND name = 'Paint Package' LIMIT 1),
        test_user_id,
        'valid',
        'TICKET-JVT-PAINT-' || substring(md5(random()::text) from 1 for 8),
        (SELECT COALESCE(raw_user_meta_data->>'full_name', email) FROM auth.users WHERE id = test_user_id),
        (SELECT email FROM auth.users WHERE id = test_user_id)
      );

    RAISE NOTICE '✅ Created 4 events, 10 ticket tiers, and 3 sample tickets for user %', test_user_id;
  END IF;
END $$;

-- Verify the data
SELECT 
  '🎪 Events' as type, 
  COUNT(*) as count, 
  string_agg(title, ', ') as items 
FROM events 
WHERE status = 'published'
GROUP BY 1

UNION ALL

SELECT 
  '🎫 Ticket Tiers' as type, 
  COUNT(*) as count,
  string_agg(name, ', ') as items
FROM ticket_tiers
GROUP BY 1

UNION ALL

SELECT 
  '🛒 Tickets Purchased' as type, 
  COUNT(*) as count,
  string_agg(DISTINCT holder_name, ', ') as items
FROM tickets
GROUP BY 1;
