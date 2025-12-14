-- Classifieds System Migration
-- 1. Create classified_listings table
-- 2. Create RLS policies
-- 3. Create Storage bucket for classified-images

CREATE TABLE IF NOT EXISTS classified_listings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'TTD',
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  contact_info JSONB, -- { phone, whatsapp, email }
  status TEXT DEFAULT 'active', -- active, sold, archived
  promoted BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE classified_listings ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public can view active listings" ON classified_listings;
CREATE POLICY "Public can view active listings" ON classified_listings
  FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Users can create listings" ON classified_listings;
CREATE POLICY "Users can create listings" ON classified_listings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own listings" ON classified_listings;
CREATE POLICY "Users can update own listings" ON classified_listings
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own listings" ON classified_listings;
CREATE POLICY "Users can delete own listings" ON classified_listings
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_classifieds_category ON classified_listings(category);
CREATE INDEX IF NOT EXISTS idx_classifieds_location ON classified_listings(location);
CREATE INDEX IF NOT EXISTS idx_classifieds_status ON classified_listings(status);

-- Storage Bucket (Idempotent)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('classified-images', 'classified-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access Classified Images" ON storage.objects;
CREATE POLICY "Public Access Classified Images" ON storage.objects
  FOR SELECT USING (bucket_id = 'classified-images');

DROP POLICY IF EXISTS "Users Upload Classified Images" ON storage.objects;
CREATE POLICY "Users Upload Classified Images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'classified-images' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users Update Classified Images" ON storage.objects;
CREATE POLICY "Users Update Classified Images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'classified-images' AND auth.uid() = owner);
