-- =====================================================
-- TRINIBUILD MICRO LANDING PAGES - DATABASE SCHEMA
-- Key: keyword_landing_engine
-- Auto-generated SEO landing pages
-- =====================================================

-- 1. LANDING PAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.landing_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Classification
    vertical TEXT NOT NULL CHECK (vertical IN (
        'jobs', 'real_estate', 'services', 'events', 'marketplace', 'rideshare'
    )),
    location_slug TEXT NOT NULL,
    location_name TEXT NOT NULL,
    keyword TEXT NOT NULL,
    url_slug TEXT UNIQUE NOT NULL,
    
    -- SEO Content
    title TEXT NOT NULL,
    meta_description TEXT NOT NULL,
    h1 TEXT NOT NULL,
    
    -- Page Sections
    intro_paragraph TEXT,
    benefits_section JSONB DEFAULT '[]',
    faq_section JSONB DEFAULT '[]',
    local_context TEXT,
    cta_text TEXT,
    
    -- Related content
    related_listings UUID[] DEFAULT '{}',
    related_blogs UUID[] DEFAULT '{}',
    
    -- Schema.org data
    schema_type TEXT DEFAULT 'WebPage',
    schema_data JSONB DEFAULT '{}',
    
    -- Publishing
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    auto_generated BOOLEAN DEFAULT TRUE,
    manually_edited BOOLEAN DEFAULT FALSE,
    
    -- Analytics
    views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,4) DEFAULT 0,
    avg_time_on_page INTEGER DEFAULT 0, -- seconds
    
    -- SEO Performance
    google_indexed BOOLEAN DEFAULT FALSE,
    google_position INTEGER,
    last_crawled_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    
    -- Indexes
    CONSTRAINT unique_vertical_location_keyword UNIQUE (vertical, location_slug, keyword)
);

-- 2. LANDING PAGE TEMPLATES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.landing_page_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    vertical TEXT NOT NULL,
    template_name TEXT NOT NULL,
    
    -- Templates with placeholders
    title_template TEXT NOT NULL,
    h1_template TEXT NOT NULL,
    meta_template TEXT NOT NULL,
    intro_template TEXT,
    cta_template TEXT,
    
    -- Default benefits
    default_benefits JSONB DEFAULT '[]',
    
    -- Default FAQ questions
    default_faq_questions TEXT[] DEFAULT '{}',
    
    -- Schema type
    schema_type TEXT DEFAULT 'WebPage',
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. LANDING PAGE PERFORMANCE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.landing_page_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL REFERENCES public.landing_pages(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Traffic
    views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    
    -- Engagement
    clicks INTEGER DEFAULT 0,
    ctr DECIMAL(5,4) DEFAULT 0,
    bounce_rate DECIMAL(5,4) DEFAULT 0,
    avg_time_on_page INTEGER DEFAULT 0,
    
    -- Conversions
    conversions INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,4) DEFAULT 0,
    
    -- Sources
    traffic_sources JSONB DEFAULT '{}',
    -- Example: {"organic": 50, "direct": 30, "referral": 20}
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_page_date UNIQUE (page_id, date)
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_landing_pages_vertical ON public.landing_pages(vertical);
CREATE INDEX IF NOT EXISTS idx_landing_pages_location ON public.landing_pages(location_slug);
CREATE INDEX IF NOT EXISTS idx_landing_pages_status ON public.landing_pages(status);
CREATE INDEX IF NOT EXISTS idx_landing_pages_url ON public.landing_pages(url_slug);
CREATE INDEX IF NOT EXISTS idx_landing_pages_views ON public.landing_pages(views DESC);
CREATE INDEX IF NOT EXISTS idx_landing_analytics_page ON public.landing_page_analytics(page_id, date DESC);

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_page_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_page_analytics ENABLE ROW LEVEL SECURITY;

-- Public can view published pages
CREATE POLICY "Published landing pages are public"
    ON public.landing_pages FOR SELECT
    USING (status = 'published');

-- Admin full access
CREATE POLICY "Admin full access to landing pages"
    ON public.landing_pages FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admin access to templates"
    ON public.landing_page_templates FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admin access to analytics"
    ON public.landing_page_analytics FOR ALL
    USING (auth.role() = 'authenticated');

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Increment page views
CREATE OR REPLACE FUNCTION increment_landing_page_views(page_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.landing_pages
    SET views = views + 1,
        updated_at = NOW()
    WHERE id = page_id;
    
    -- Also update daily analytics
    INSERT INTO public.landing_page_analytics (page_id, date, views)
    VALUES (page_id, CURRENT_DATE, 1)
    ON CONFLICT (page_id, date)
    DO UPDATE SET views = landing_page_analytics.views + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment conversions
CREATE OR REPLACE FUNCTION increment_landing_page_conversions(page_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.landing_pages
    SET conversions = conversions + 1,
        updated_at = NOW()
    WHERE id = page_id;
    
    -- Also update daily analytics
    INSERT INTO public.landing_page_analytics (page_id, date, conversions)
    VALUES (page_id, CURRENT_DATE, 1)
    ON CONFLICT (page_id, date)
    DO UPDATE SET conversions = landing_page_analytics.conversions + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get top performing pages
CREATE OR REPLACE FUNCTION get_top_landing_pages(
    p_vertical TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    url_slug TEXT,
    title TEXT,
    keyword TEXT,
    location_name TEXT,
    views INTEGER,
    conversions INTEGER,
    conversion_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lp.id,
        lp.url_slug,
        lp.title,
        lp.keyword,
        lp.location_name,
        lp.views,
        lp.conversions,
        CASE WHEN lp.views > 0 
            THEN lp.conversions::DECIMAL / lp.views 
            ELSE 0 
        END as conversion_rate
    FROM public.landing_pages lp
    WHERE lp.status = 'published'
      AND (p_vertical IS NULL OR lp.vertical = p_vertical)
    ORDER BY lp.views DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SEED DEFAULT TEMPLATES
-- =====================================================
INSERT INTO public.landing_page_templates (vertical, template_name, title_template, h1_template, meta_template, cta_template, default_benefits, schema_type)
VALUES 
    ('jobs', 'Job Listing', '{keyword} in {location} | Find Jobs on TriniBuild', 'Find {keyword} Jobs in {location}', 'Looking for {keyword} jobs in {location}? Browse verified job listings on TriniBuild.', 'Browse {keyword} Jobs', '["Verified employers", "Apply directly", "Instant notifications", "Free resume builder"]', 'JobPosting'),
    ('real_estate', 'Property Listing', '{keyword} in {location} | Rentals | TriniBuild', '{keyword} for Rent in {location}', 'Find {keyword} in {location}, Trinidad. Verified listings with photos and direct landlord contact.', 'View Listings', '["Direct landlord contact", "Verified properties", "Secure deposits", "Virtual tours"]', 'RealEstateListing'),
    ('services', 'Service Provider', '{keyword} in {location} | TriniBuild', 'Best {keyword} in {location}', 'Find verified {keyword} in {location}. Compare prices, read reviews, book instantly.', 'Find a Provider', '["ID-verified providers", "Real reviews", "Compare quotes", "Payment protection"]', 'LocalBusiness'),
    ('events', 'Event Tickets', '{keyword} in {location} | Tickets | TriniBuild', '{keyword} Events in {location}', 'Get tickets for {keyword} in {location}. Secure, verified tickets with QR codes.', 'Get Tickets', '["Authentic tickets", "Instant delivery", "No scalper prices", "Easy refunds"]', 'Event'),
    ('marketplace', 'Marketplace', '{keyword} for Sale in {location} | TriniBuild', 'Buy {keyword} in {location}', 'Shop {keyword} in {location}. Verified sellers with safe transactions.', 'Shop Now', '["Verified sellers", "Secure payments", "Local pickup", "Buyer protection"]', 'Product'),
    ('rideshare', 'Rideshare', '{keyword} | QuickRides | TriniBuild', '{keyword} Rides in Trinidad', 'Book {keyword} with TriniBuild QuickRides. Trusted drivers, fixed prices.', 'Book a Ride', '["Fixed prices", "Verified drivers", "GPS tracking", "24/7 available"]', 'TaxiService')
ON CONFLICT DO NOTHING;
