-- Create Video Placements Table
CREATE TABLE IF NOT EXISTS video_placements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page TEXT NOT NULL,
    section TEXT NOT NULL,
    video_url TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    autoplay BOOLEAN DEFAULT false,
    loop BOOLEAN DEFAULT false,
    muted BOOLEAN DEFAULT true,
    controls BOOLEAN DEFAULT true,
    position INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_video_placements_page ON video_placements(page);
CREATE INDEX IF NOT EXISTS idx_video_placements_active ON video_placements(active);

-- Enable RLS
ALTER TABLE video_placements ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active videos
CREATE POLICY "Public can view active videos" ON video_placements
    FOR SELECT
    USING (active = true);

-- Policy: Authenticated users can manage videos
CREATE POLICY "Authenticated users can insert videos" ON video_placements
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update videos" ON video_placements
    FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete videos" ON video_placements
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Seed some example video placements
INSERT INTO video_placements (page, section, video_url, title, description, autoplay, muted, position) VALUES
('home', 'hero', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Welcome to TriniBuild', 'Your all-in-one platform for Trinidad & Tobago', true, true, 1),
('rides', 'hero', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Safe Rides Across Trinidad', 'Book your ride today', false, false, 1)
ON CONFLICT DO NOTHING;
