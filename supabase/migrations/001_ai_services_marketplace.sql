-- TriniBuild AI Services Marketplace — Week 1 Migration
-- Run this against your Supabase project

-- AI Tools registry
CREATE TABLE IF NOT EXISTS ai_tools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  short_benefit TEXT,
  best_for TEXT[],
  price_monthly DECIMAL(10,2) DEFAULT 0,
  price_setup DECIMAL(10,2) DEFAULT 0,
  icon TEXT,
  status TEXT DEFAULT 'active',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business tool activations
CREATE TABLE IF NOT EXISTS business_tool_activations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  tool_id UUID REFERENCES ai_tools(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active',
  plan TEXT DEFAULT 'free_trial',
  settings JSONB DEFAULT '{}',
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, tool_id)
);

-- AI generations log
CREATE TABLE IF NOT EXISTS ai_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  tool_slug TEXT NOT NULL,
  prompt_type TEXT NOT NULL,
  input_json JSONB,
  output_text TEXT,
  output_json JSONB,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI prompt templates
CREATE TABLE IF NOT EXISTS ai_prompt_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_slug TEXT NOT NULL,
  prompt_type TEXT NOT NULL,
  title TEXT,
  system_prompt TEXT,
  user_prompt_template TEXT,
  output_format TEXT DEFAULT 'text',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Digital products
CREATE TABLE IF NOT EXISTS digital_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  file_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Digital product orders
CREATE TABLE IF NOT EXISTS digital_product_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  product_id UUID REFERENCES digital_products(id),
  payment_status TEXT DEFAULT 'pending',
  delivery_status TEXT DEFAULT 'pending',
  amount DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ai_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_tool_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_product_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "ai_tools_public_read" ON ai_tools FOR SELECT USING (true);

CREATE POLICY "activations_owner_read" ON business_tool_activations FOR SELECT USING (
  EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
);
CREATE POLICY "activations_owner_insert" ON business_tool_activations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
);
CREATE POLICY "activations_owner_update" ON business_tool_activations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
);

CREATE POLICY "generations_owner_all" ON ai_generations FOR ALL USING (
  EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
);

CREATE POLICY "templates_public_read" ON ai_prompt_templates FOR SELECT USING (true);

CREATE POLICY "products_public_read" ON digital_products FOR SELECT USING (true);

CREATE POLICY "orders_owner_read" ON digital_product_orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "orders_owner_insert" ON digital_product_orders FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "subs_owner_read" ON subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
);

CREATE POLICY "logs_owner_read" ON activity_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
);

-- Seed ai_tools data
INSERT INTO ai_tools (name, slug, category, description, short_benefit, best_for, price_monthly, status, sort_order) VALUES
('AI Business Website Builder', 'website-builder', 'Get Customers', 'Generate a professional business page with AI-written descriptions, SEO, and WhatsApp button.', 'Get your business online in 10 minutes', ARRAY['Salons', 'Barbers', 'Shops', 'Restaurants'], 10.00, 'active', 1),
('AI Social Media Generator', 'content-generator', 'Get Customers', 'Create 30 days of captions, reels, and WhatsApp status content in minutes.', '30 days of content in 5 minutes', ARRAY['Food Vendors', 'Beauty', 'Real Estate', 'Artists'], 9.00, 'active', 2),
('Invoice + Cash/COD Tracker', 'invoice-tracker', 'Get Paid', 'Track cash payments, bank transfers, and COD with professional invoices and receipts.', 'Professional invoices without needing online payments', ARRAY['Tradesmen', 'Vendors', 'Caterers', 'Mechanics'], 10.00, 'active', 3),
('AI WhatsApp Receptionist', 'whatsapp-receptionist', 'Manage Customers', 'Never miss another customer. Auto-reply scripts, booking intake, and lead capture.', 'Never miss another customer again', ARRAY['Salons', 'Barbers', 'Tattoo Artists', 'Mechanics', 'Clinics'], 19.00, 'active', 4),
('Food Vendor Menu + Ordering', 'food-ordering', 'Sell Online', 'Digital menu with WhatsApp ordering, pickup/delivery options, and daily specials.', 'Turn WhatsApp into your food ordering system', ARRAY['Food Vendors', 'Caterers', 'Roti Shops', 'Doubles Vendors'], 15.00, 'coming_soon', 5),
('Review Booster + QR Cards', 'review-booster', 'Get Customers', 'Collect reviews and testimonials with QR cards and automated request messages.', 'Turn happy customers into more customers', ARRAY['Restaurants', 'Salons', 'Hotels', 'Airbnb'], 10.00, 'coming_soon', 6),
('Grant Proposal Builder', 'grant-builder', 'Grow', 'Generate business plans, grant proposals, and financial projections with AI.', 'Turn your business idea into a fundable proposal', ARRAY['Farmers', 'Women-Owned', 'Startups', 'NGOs'], 19.00, 'coming_soon', 7),
('Real Estate Listing Builder', 'real-estate', 'TriniBuild Living', 'Create professional rental/sale listings with AI descriptions and lead capture.', 'List properties faster and get better leads', ARRAY['Landlords', 'Real Estate Agents', 'Property Managers'], 19.00, 'coming_soon', 8),
('Event Ticketing + QR Check-In', 'event-ticketing', 'TriniBuild Events', 'Sell tickets, generate QR codes, and check in attendees at the door.', 'Sell tickets and check people in with QR codes', ARRAY['Promoters', 'Churches', 'Schools', 'Boat Rides'], 29.00, 'coming_soon', 9),
('Tourism Booking Kit', 'tourism-booking', 'Get Customers', 'Booking system for tour operators, guest houses, and local experiences.', 'Turn tourists into booked customers', ARRAY['Tour Guides', 'Boat Tours', 'Guest Houses', 'Taxi Drivers'], 19.00, 'coming_soon', 10),
('Inventory + Price List Builder', 'inventory-builder', 'Manage Operations', 'Track stock, generate price lists, and get low-stock alerts.', 'Know what you have, what you sold, and what to restock', ARRAY['Mini Marts', 'Boutiques', 'Hardware', 'Beauty Supply'], 15.00, 'coming_soon', 11),
('AI Flyer + QR Generator', 'flyer-generator', 'Get Customers', 'Create promo flyers, QR codes, and WhatsApp captions in minutes.', 'Create a full promo campaign in minutes', ARRAY['Every Small Business'], 9.00, 'coming_soon', 12)
ON CONFLICT (slug) DO NOTHING;
