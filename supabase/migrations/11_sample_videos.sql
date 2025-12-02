-- Add more sample video placements across different pages

INSERT INTO video_placements (page, section, video_url, title, description, autoplay, loop, muted, controls, position, active) VALUES
-- Stores/Marketplace Videos
('stores', 'hero', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Shop Local Trinidad', 'Discover amazing local businesses and products', true, false, true, true, 1, true),
('stores', 'featured', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Featured Vendors Showcase', 'Meet our top-rated vendors', false, false, false, true, 2, true),

-- Drive With Us Videos
('drive', 'hero', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Become a TriniBuild Driver', 'Earn money on your schedule', true, false, true, true, 1, true),
('drive', 'benefits', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Driver Benefits Overview', 'See what makes driving with us great', false, false, false, true, 2, true),

-- Jobs Board Videos
('jobs', 'hero', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Find Your Dream Job in Trinidad', 'Connect with top employers', true, false, true, true, 1, true),
('jobs', 'featured-jobs', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Hot Jobs This Week', 'Trending opportunities', false, false, false, true, 2, true),

-- Real Estate Videos
('real-estate', 'hero', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Your Dream Home Awaits', 'Browse premium properties across Trinidad & Tobago', true, false, true, true, 1, true),
('real-estate', 'featured-properties', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Featured Properties Tour', 'Virtual tours of our best listings', false, false, false, true, 2, true),

-- Events & Tickets Videos
('tickets', 'hero', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Trinidad Events & Entertainment', 'Never miss the hottest events', true, false, true, true, 1, true),
('tickets', 'upcoming-events', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'This Month''s Top Events', 'See what''s happening', false, false, false, true, 2, true),

-- Legal Services Videos
('legal', 'hero', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Professional Legal Services', 'Expert legal help when you need it', true, false, true, true, 1, true),
('legal', 'services', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Our Legal Services', 'Comprehensive legal solutions', false, false, false, true, 2, true),

-- About Us Videos
('about', 'hero', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'The TriniBuild Story', 'Building Trinidad''s digital future', true, false, true, true, 1, true),
('about', 'team', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Meet Our Team', 'The people behind TriniBuild', false, false, false, true, 2, true),
('about', 'mission', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Our Mission & Vision', 'Why we do what we do', false, false, false, true, 3, true)

ON CONFLICT DO NOTHING;

-- Verify the data
SELECT page, COUNT(*) as video_count 
FROM video_placements 
WHERE active = true 
GROUP BY page 
ORDER BY page;
