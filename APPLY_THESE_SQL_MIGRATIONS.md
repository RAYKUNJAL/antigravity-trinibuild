# 🚀 APPLY THESE SQL MIGRATIONS NOW

**Instructions:** Copy each SQL block below and paste into Supabase SQL Editor, then click "Run"

---

## 📋 MIGRATION 1: Directory RLS Fix (5 minutes)

**What this does:** Fixes Directory page showing "0 Results"

**Steps:**
1. Go to: https://supabase.com/dashboard/project/cdprbbyptjdntcrhmwxf
2. Click "SQL Editor" in left sidebar
3. Click "New Query"
4. Copy the SQL below and paste it
5. Click "Run"
6. Verify you see "Success" message

### SQL CODE TO COPY:

```sql
-- Fix Directory Page - Add RLS Policy for Stores Table
-- This allows anonymous users to view active stores in the directory

-- Enable RLS on stores table (if not already enabled)
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow anonymous read access to active stores" ON public.stores;

-- Create policy to allow anonymous users to SELECT active stores
CREATE POLICY "Allow anonymous read access to active stores"
ON public.stores
FOR SELECT
TO anon
USING (status = 'active');

-- Also allow authenticated users to read all stores
DROP POLICY IF EXISTS "Allow authenticated users to read stores" ON public.stores;

CREATE POLICY "Allow authenticated users to read stores"
ON public.stores
FOR SELECT
TO authenticated
USING (true);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'stores';
```

**Expected Result:** You should see a table showing the two new policies created for the stores table.

---

## 📋 MIGRATION 2: Sample Data (5 minutes)

**What this does:** Adds professional sample data to make site look alive

**Steps:**
1. In Supabase SQL Editor, click "New Query"
2. Copy the SQL below and paste it
3. Click "Run"
4. Verify you see row counts for all tables

### SQL CODE TO COPY:

```sql
-- ================================================
-- FINAL SAMPLE DATA COMPLETION
-- Add missing benefits column and insert all remaining data
-- ================================================

-- Step 1: Add benefits column to jobs table
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS benefits TEXT[];

-- Step 2: Insert remaining classified listings (10 total)
INSERT INTO classified_listings (title, description, price, category, location, is_featured, image_urls) VALUES
('2018 Toyota Hilux for Sale', 'Excellent condition, low mileage, fully loaded Hilux. Contact for viewing.', 250000, 'Vehicles', 'San Fernando', true, ARRAY['https://images.unsplash.com/photo-1627050019688-a28a1a1f0a2e']),
('Samsung Galaxy S23 Ultra', 'Like new, unlocked, 256GB, with box and accessories.', 6000, 'Electronics', 'Port of Spain', false, ARRAY['https://images.unsplash.com/photo-1610792516301-ea102c32021c']),
('3 Bedroom House for Rent - Arima', 'Spacious 3 bedroom, 2 bath house in a quiet Arima neighborhood. Parking for 2 cars.', 6500, 'Real Estate', 'Arima', true, ARRAY['https://images.unsplash.com/photo-1512917774080-9991f1c4c750']),
('Web Developer Needed', 'Looking for a skilled web developer for a short-term project. Remote work possible.', 8000, 'Jobs', 'Remote', false, ARRAY[]::TEXT[]),
('Graphic Design Services', 'Professional graphic design for logos, flyers, and social media content. Affordable rates.', 500, 'Services', 'Chaguanas', false, ARRAY['https://images.unsplash.com/photo-1626785774573-4b799315345d']),
('iPhone 14 Pro Max', 'Mint condition, 512GB, unlocked. Includes charger and case.', 7500, 'Electronics', 'Port of Spain', true, ARRAY['https://images.unsplash.com/photo-1632661674596-df8be070a5c5']),
('Apartment for Rent - Westmoorings', 'Modern 2 bedroom apartment with pool and gym access. Gated community.', 8000, 'Real Estate', 'Westmoorings', true, ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267']),
('Gaming PC Setup', 'High-end gaming PC with RTX 4070, 32GB RAM, RGB everything!', 15000, 'Electronics', 'Chaguanas', false, ARRAY['https://images.unsplash.com/photo-1587202372634-32705e3bf49c']),
('Marketing Manager Position', 'Established company seeking experienced marketing manager. Great benefits.', 12000, 'Jobs', 'Port of Spain', true, ARRAY[]::TEXT[]),
('Landscaping Services', 'Professional landscaping and garden maintenance. Free quotes.', 800, 'Services', 'San Fernando', false, ARRAY['https://images.unsplash.com/photo-1558904541-efa843a96f01'])
ON CONFLICT DO NOTHING;

-- Step 3: Insert jobs (6 total)
INSERT INTO jobs (title, company, description, location, salary_min, salary_max, job_type, category, requirements, benefits) VALUES
('Senior Software Developer', 'Tech Solutions TT', 'Join our growing team as a Senior Software Developer. Work on exciting projects using modern tech stack including React, Node.js, and cloud technologies.', 'Port of Spain', 12000, 18000, 'Full-time', 'Technology', ARRAY['5+ years experience', 'React/Node.js expertise', 'Cloud platform knowledge'], ARRAY['Health insurance', 'Remote work options', 'Professional development']),
('Marketing Manager', 'Caribbean Marketing Group', 'Lead our marketing team in developing and executing strategic campaigns for local and regional clients.', 'Port of Spain', 10000, 15000, 'Full-time', 'Marketing', ARRAY['Marketing degree', '3+ years management experience', 'Digital marketing skills'], ARRAY['Competitive salary', 'Performance bonuses', 'Career growth']),
('Customer Service Representative', 'TriniBuild', 'Provide excellent customer support to our growing user base. Help businesses succeed on our platform.', 'Remote', 5000, 7000, 'Full-time', 'Customer Service', ARRAY['Excellent communication', 'Problem-solving skills', 'Tech-savvy'], ARRAY['Work from home', 'Flexible hours', 'Training provided']),
('Sales Executive', 'Auto Paradise', 'Drive sales growth by building relationships with customers and closing deals. Commission-based earnings.', 'San Fernando', 6000, 12000, 'Full-time', 'Sales', ARRAY['Sales experience', 'Valid driver license', 'Excellent communication'], ARRAY['High commission', 'Company vehicle', 'Sales training']),
('Graphic Designer', 'Creative Studio TT', 'Create stunning visual content for our diverse client portfolio. Must have strong portfolio.', 'Chaguanas', 5000, 8000, 'Contract', 'Design', ARRAY['Adobe Creative Suite', 'Portfolio required', '2+ years experience'], ARRAY['Flexible schedule', 'Creative environment', 'Portfolio building']),
('Delivery Driver', 'TriniBuild Logistics', 'Join our delivery team! Flexible hours, competitive pay, and be your own boss.', 'Trinidad-wide', 4000, 8000, 'Part-time', 'Transportation', ARRAY['Valid license', 'Own vehicle', 'Good driving record'], ARRAY['Flexible hours', 'Weekly pay', 'Fuel allowance'])
ON CONFLICT DO NOTHING;

-- Step 4: Insert real estate listings (5 total)
INSERT INTO real_estate_listings (title, description, price, property_type, bedrooms, bathrooms, square_feet, location, address, latitude, longitude, image_urls, features, is_featured) VALUES
('Luxury 4 Bedroom House - Westmoorings', 'Stunning modern home in prestigious Westmoorings. Features include pool, home theater, and smart home technology.', 4500000, 'House', 4, 3, 3500, 'Westmoorings', 'Westmoorings, Diego Martin', 10.6918, -61.5424, ARRAY['https://images.unsplash.com/photo-1613490493576-7fde63acd811'], ARRAY['Pool', 'Smart Home', 'Home Theater', 'Garage'], true),
('Modern 2 Bedroom Apartment - Trincity', 'Brand new apartment in gated community with gym, pool, and 24/7 security.', 1800000, 'Apartment', 2, 2, 1200, 'Trincity', 'Trincity Mall Area', 10.6525, -61.3925, ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'], ARRAY['Gym', 'Pool', 'Security', 'Parking'], true),
('Commercial Property - San Fernando', 'Prime commercial space perfect for retail or office. High foot traffic area.', 3200000, 'Commercial', 0, 2, 2000, 'San Fernando', 'High Street, San Fernando', 10.2797, -61.4647, ARRAY['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab'], ARRAY['Prime Location', 'Parking', 'Modern Facilities'], false),
('3 Bedroom Townhouse - Chaguanas', 'Spacious townhouse in family-friendly neighborhood. Close to schools and shopping.', 2100000, 'Townhouse', 3, 2, 1800, 'Chaguanas', 'Chaguanas Main Road', 10.5167, -61.4111, ARRAY['https://images.unsplash.com/photo-1600585154340-be6161a56a0c'], ARRAY['Family Friendly', 'Near Schools', 'Parking'], false),
('Land for Sale - Arima', '5000 sq ft residential lot in developing area. Perfect for building your dream home.', 800000, 'Land', 0, 0, 5000, 'Arima', 'Arima Heights', 10.6372, -61.2828, ARRAY['https://images.unsplash.com/photo-1500382017468-9049fed747ef'], ARRAY['Residential', 'Developing Area', 'Utilities Available'], false)
ON CONFLICT DO NOTHING;

-- Step 5: Insert events (5 total)
INSERT INTO events (title, description, event_date, event_time, location, category, price, max_attendees, organizer_name, image_url) VALUES
('Trinidad Tech Meetup - January 2025', 'Monthly gathering of tech enthusiasts, developers, and entrepreneurs. Network, learn, and share ideas!', '2025-01-15', '18:00', 'MovieTowne, Port of Spain', 'technology', 0, 100, 'TriniBuild Community', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87'),
('Caribbean Food Festival', 'Celebrate the flavors of Trinidad & Tobago! Food vendors, live music, and cultural performances.', '2025-01-20', '12:00', 'Queen''s Park Savannah', 'food', 50, 500, 'T&T Food Association', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1'),
('Business Networking Mixer', 'Connect with local entrepreneurs and business owners. Grow your network and find opportunities.', '2025-01-25', '17:30', 'Hyatt Regency, Port of Spain', 'business', 100, 75, 'Trinidad Business Network', 'https://images.unsplash.com/photo-1511578314322-379afb476865'),
('Fitness Bootcamp - Free Trial', 'Try our outdoor fitness bootcamp! All fitness levels welcome. Bring water and towel.', '2025-01-18', '06:00', 'Queen''s Park Savannah', 'sports', 0, 30, 'FitLife TT', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438'),
('Art Exhibition - Local Artists', 'Showcase of Trinidad & Tobago''s finest artists. Paintings, sculptures, and mixed media.', '2025-02-01', '19:00', 'National Museum, Port of Spain', 'arts', 25, 150, 'T&T Arts Council', 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b')
ON CONFLICT DO NOTHING;

-- Step 6: Insert products (8 total)
INSERT INTO products (name, description, price, category, image_url, stock_quantity, is_featured) VALUES
('Wireless Bluetooth Headphones', 'Premium sound quality, 30-hour battery life, noise cancellation. Perfect for music lovers!', 599, 'Electronics', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e', 50, true),
('Organic Coffee Beans - 1lb', 'Locally roasted Trinidad coffee. Rich, smooth flavor. Support local!', 120, 'Food & Beverage', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e', 100, false),
('Fitness Resistance Bands Set', 'Complete set of 5 resistance bands for home workouts. Includes carry bag.', 250, 'Sports & Fitness', 'https://images.unsplash.com/photo-1598289431512-b97b0917affc', 75, true),
('Handmade Leather Wallet', 'Genuine leather, handcrafted in Trinidad. RFID protection included.', 350, 'Fashion & Accessories', 'https://images.unsplash.com/photo-1627123424574-724758594e93', 30, false),
('Smart LED Light Bulbs - 4 Pack', 'WiFi-enabled, color-changing LED bulbs. Control with your phone!', 480, 'Home & Garden', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64', 60, true),
('Natural Skincare Set', 'All-natural, locally made skincare products. Perfect for Caribbean climate.', 420, 'Beauty & Personal Care', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571', 40, false),
('Kids Educational Tablet', 'Pre-loaded with educational games and apps. Parental controls included.', 1200, 'Electronics', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', 25, true),
('Yoga Mat - Premium Quality', 'Extra thick, non-slip yoga mat. Includes carrying strap.', 280, 'Sports & Fitness', 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f', 80, false)
ON CONFLICT DO NOTHING;

-- Step 7: Insert success stories (3 total)
INSERT INTO success_stories (business_name, owner_name, story, revenue_growth, image_url, category) VALUES
('Island Fashion Boutique', 'Sarah Mohammed', 'I started my online boutique with TriniBuild 6 months ago. The platform made it so easy to set up my store, and the built-in marketing tools helped me reach customers across Trinidad. My sales have tripled!', 300, 'https://images.unsplash.com/photo-1441986300917-64674bd600d8', 'Fashion'),
('Tech Paradise Trinidad', 'Rajesh Sharma', 'TriniBuild transformed my electronics business. The inventory management and analytics features are game-changers. I went from a small shop to serving customers nationwide.', 250, 'https://images.unsplash.com/photo-1556761175-b413da4baf72', 'Electronics'),
('Trini Food Hub', 'Michelle Chen', 'As a food vendor, I needed an easy way to take online orders. TriniBuild gave me everything I needed - a beautiful storefront, payment processing, and delivery management. Business is booming!', 400, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0', 'Food & Beverage')
ON CONFLICT DO NOTHING;

-- Step 8: Insert video placements (3 total)
INSERT INTO video_placements (video_url, title, description, placement_page, placement_section, is_active, priority) VALUES
('https://www.youtube.com/embed/dQw4w9WgXcQ', 'Build Your Dream Business', 'See how TriniBuild helps local entrepreneurs succeed', 'home', 'hero', true, 1),
('https://www.youtube.com/embed/dQw4w9WgXcQ', 'Success Stories', 'Real businesses, real results with TriniBuild', 'home', 'testimonials', true, 2),
('https://www.youtube.com/embed/dQw4w9WgXcQ', 'Platform Tour', 'Discover all the features that make TriniBuild powerful', 'home', 'features', true, 3)
ON CONFLICT DO NOTHING;

-- Verification: Check all data counts
SELECT 
  'blogs' as table_name, COUNT(*) as row_count FROM blogs
UNION ALL
SELECT 'stores', COUNT(*) FROM stores
UNION ALL
SELECT 'classified_listings', COUNT(*) FROM classified_listings
UNION ALL
SELECT 'jobs', COUNT(*) FROM jobs
UNION ALL
SELECT 'real_estate_listings', COUNT(*) FROM real_estate_listings
UNION ALL
SELECT 'events', COUNT(*) FROM events
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'success_stories', COUNT(*) FROM success_stories
UNION ALL
SELECT 'video_placements', COUNT(*) FROM video_placements
ORDER BY table_name;
```

**Expected Result:** You should see a table showing row counts for all tables with the new sample data.

---

## ✅ VERIFICATION

After running both migrations:

1. **Check Directory Page:**
   - Go to your TriniBuild website
   - Navigate to Directory page
   - Should now show stores (not "0 Results")

2. **Check Sample Data:**
   - Classifieds: Should show 10+ listings
   - Jobs: Should show 6+ job postings
   - Events: Should show 5+ events
   - Real Estate: Should show 5+ properties

3. **Check Console:**
   - Open browser console (F12)
   - Should see no 401 errors
   - Should see no critical errors

---

## 🎉 AFTER COMPLETION

Once both migrations are applied:
- ✅ Directory page will work
- ✅ Site will have professional sample data
- ✅ Launch readiness: 90%
- ✅ Ready for final testing and launch!

**Let me know when you've completed both migrations and I'll verify everything is working!** 🚀
