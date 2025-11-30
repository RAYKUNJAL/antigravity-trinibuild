-- Create Events Table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organizer_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT NOT NULL,
  venue_name TEXT,
  image_url TEXT,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Ticket Tiers Table
CREATE TABLE IF NOT EXISTS ticket_tiers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'TTD',
  quantity_total INTEGER NOT NULL,
  quantity_sold INTEGER DEFAULT 0,
  perks TEXT[],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold_out', 'hidden'))
);

-- Create Tickets (Orders) Table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) NOT NULL,
  tier_id UUID REFERENCES ticket_tiers(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  status TEXT DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'refunded', 'cancelled')),
  qr_code_hash TEXT NOT NULL, -- Unique secure code
  scanned_at TIMESTAMP WITH TIME ZONE,
  scanned_by UUID REFERENCES auth.users(id),
  holder_name TEXT,
  holder_email TEXT
);

-- Create Promoter Profiles (Optional, for extra info)
CREATE TABLE IF NOT EXISTS promoter_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  company_name TEXT,
  contact_email TEXT,
  is_verified BOOLEAN DEFAULT false,
  total_sales DECIMAL(12, 2) DEFAULT 0
);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for Events
CREATE POLICY "Events are viewable by everyone" 
ON events FOR SELECT 
USING (status = 'published' OR auth.uid() = organizer_id);

CREATE POLICY "Organizers can insert events" 
ON events FOR INSERT 
WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update their events" 
ON events FOR UPDATE 
USING (auth.uid() = organizer_id);

-- Policies for Ticket Tiers
CREATE POLICY "Tiers are viewable by everyone" 
ON ticket_tiers FOR SELECT 
USING (true);

CREATE POLICY "Organizers can manage tiers" 
ON ticket_tiers FOR ALL 
USING (EXISTS (SELECT 1 FROM events WHERE events.id = ticket_tiers.event_id AND events.organizer_id = auth.uid()));

-- Policies for Tickets
CREATE POLICY "Users can view their own tickets" 
ON tickets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Organizers can view tickets for their events" 
ON tickets FOR SELECT 
USING (EXISTS (SELECT 1 FROM events WHERE events.id = tickets.event_id AND events.organizer_id = auth.uid()));

CREATE POLICY "Users can purchase tickets (insert)" 
ON tickets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Organizers/Scanners can update tickets (scan)" 
ON tickets FOR UPDATE 
USING (EXISTS (SELECT 1 FROM events WHERE events.id = tickets.event_id AND events.organizer_id = auth.uid()));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_tiers;
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
