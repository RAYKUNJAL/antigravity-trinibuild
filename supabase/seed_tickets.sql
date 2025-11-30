-- Seed Data for TriniBuild E-Tick Platform
-- This creates sample events, tiers, and tickets for testing

-- Note: Replace 'YOUR_USER_ID_HERE' with an actual user ID from your auth.users table
-- You can get this by running: SELECT id FROM auth.users LIMIT 1;

-- Sample Events
INSERT INTO events (id, organizer_id, title, description, date, time, location, venue_name, image_url, category, status, is_verified) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM auth.users LIMIT 1),
    'Soca Monarch Finals 2026',
    'The biggest soca competition in Trinidad! Experience the power, the passion, and the performances that define our carnival culture. Featuring all the top contenders battling for the crown.',
    '2026-02-14',
    '20:00:00',
    'Queen''s Park Savannah, Port of Spain',
    'North Stand',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1000',
    'Concert',
    'published',
    true
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    (SELECT id FROM auth.users LIMIT 1),
    'Beach House Premium All-Inclusive',
    'The ultimate Carnival Monday beach fete! Unlimited premium drinks, gourmet food stations, and non-stop vibes from the hottest DJs in the Caribbean.',
    '2026-02-16',
    '10:00:00',
    'Maracas Bay',
    'Beach House Events',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=1000',
    'All Inclusive',
    'published',
    true
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    (SELECT id FROM auth.users LIMIT 1),
    'Jouvert Morning Madness',
    'Paint, powder, and pure vibes! The original Jouvert experience starts at 2AM. Get ready to get dutty!',
    '2026-02-17',
    '02:00:00',
    'Downtown Port of Spain',
    'Starting at Adam Smith Square',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1000',
    'J''Ouvert',
    'published',
    false
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    (SELECT id FROM auth.users LIMIT 1),
    'Yacht Lime Caribbean Vibes',
    'Exclusive yacht party cruising the Western Peninsula. Limited capacity for an intimate experience.',
    '2026-02-15',
    '16:00:00',
    'Crews Inn Marina, Chaguaramas',
    'Caribbean Yacht Club',
    'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?q=80&w=1000',
    'Boat Ride',
    'published',
    true
  );

-- Ticket Tiers for Soca Monarch
INSERT INTO ticket_tiers (event_id, name, price, currency, quantity_total, quantity_sold, perks, status) VALUES
  ('11111111-1111-1111-1111-111111111111', 'General Admission', 150.00, 'TTD', 5000, 2340, ARRAY['Standing access', 'Event merchandise'], 'active'),
  ('11111111-1111-1111-1111-111111111111', 'VIP Seating', 500.00, 'TTD', 500, 325, ARRAY['Reserved seating', 'Premium bar access', 'Meet & greet opportunity', 'Gift bag'], 'active'),
  ('11111111-1111-1111-1111-111111111111', 'All-Access Pass', 1200.00, 'TTD', 100, 87, ARRAY['Backstage access', 'VIP lounge', 'Complimentary drinks', 'Artist meet & greet', 'Exclusive merch'], 'active');

-- Ticket Tiers for Beach House
INSERT INTO ticket_tiers (event_id, name, price, currency, quantity_total, quantity_sold, perks, status) VALUES
  ('22222222-2222-2222-2222-222222222222', 'Early Bird', 400.00, 'TTD', 300, 300, ARRAY['Unlimited premium drinks', 'Gourmet food', 'Beach access'], 'sold_out'),
  ('22222222-2222-2222-2222-222222222222', 'Regular', 550.00, 'TTD', 800, 542, ARRAY['Unlimited premium drinks', 'Gourmet food', 'Beach access', 'Event T-shirt'], 'active'),
  ('22222222-2222-2222-2222-222222222222', 'VIP Cabana', 2500.00, 'TTD', 20, 15, ARRAY['Private cabana', 'Bottle service', 'Dedicated server', 'Premium food menu', 'Reserved beach chairs'], 'active');

-- Ticket Tiers for Jouvert
INSERT INTO ticket_tiers (event_id, name, price, currency, quantity_total, quantity_sold, perks, status) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Paint Package', 200.00, 'TTD', 2000, 856, ARRAY['Paint & powder', 'Event T-shirt', 'Drinks'], 'active'),
  ('33333333-3333-3333-3333-333333333333', 'Premium Band', 350.00, 'TTD', 500, 234, ARRAY['Premium paint', 'Costume pieces', 'Unlimited drinks', 'Breakfast'], 'active');

-- Ticket Tiers for Yacht
INSERT INTO ticket_tiers (event_id, name, price, currency, quantity_total, quantity_sold, perks, status) VALUES
  ('44444444-4444-4444-4444-444444444444', 'General Boarding', 800.00, 'TTD', 80, 62, ARRAY['Yacht access', 'Open bar', 'Buffet'], 'active'),
  ('44444444-4444-4444-4444-444444444444', 'VIP Deck', 1500.00, 'TTD', 30, 28, ARRAY['Upper deck access', 'Premium bar', 'Private seating', 'Gourmet menu'], 'active');

-- Sample Tickets (Purchases)
-- These will use the first user in the system as the ticket holder
-- Replace with actual user IDs for testing

INSERT INTO tickets (event_id, tier_id, user_id, status, qr_code_hash, holder_name, holder_email) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM ticket_tiers WHERE event_id = '11111111-1111-1111-1111-111111111111' AND name = 'VIP Seating' LIMIT 1),
    (SELECT id FROM auth.users LIMIT 1),
    'valid',
    'TICKET-VIP-SOCA-ABC123XYZ',
    'Test User',
    (SELECT email FROM auth.users LIMIT 1)
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    (SELECT id FROM ticket_tiers WHERE event_id = '22222222-2222-2222-2222-222222222222' AND name = 'Regular' LIMIT 1),
    (SELECT id FROM auth.users LIMIT 1),
    'valid',
    'TICKET-BCH-REG-DEF456ABC',
    'Test User',
    (SELECT email FROM auth.users LIMIT 1)
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    (SELECT id FROM ticket_tiers WHERE event_id = '33333333-3333-3333-3333-333333333333' AND name = 'Paint Package' LIMIT 1),
    (SELECT id FROM auth.users LIMIT 1),
    'valid',
    'TICKET-JVT-PAINT-GHI789DEF',
    'Test User',
    (SELECT email FROM auth.users LIMIT 1)
  );

-- Verify the data
SELECT 'Events Created:' as info, COUNT(*) as count FROM events;
SELECT 'Ticket Tiers Created:' as info, COUNT(*) as count FROM ticket_tiers;
SELECT 'Sample Tickets Created:' as info, COUNT(*) as count FROM tickets;
