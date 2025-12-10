-- Migration: 17_advanced_store_features.sql
-- Description: All advanced e-commerce features for world-class store builder

-- ============================================
-- PRODUCT BUNDLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_bundles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    bundle_type TEXT NOT NULL, -- 'fixed', 'mix_match', 'bogo'
    
    -- Pricing
    price DECIMAL(10, 2),
    compare_at_price DECIMAL(10, 2),
    discount_type TEXT, -- 'percentage', 'fixed'
    discount_value DECIMAL(10, 2),
    
    -- Products in bundle
    product_ids TEXT[] DEFAULT '{}',
    min_quantity INTEGER DEFAULT 1,
    max_quantity INTEGER,
    
    -- Display
    image_url TEXT,
    
    -- Status
    active BOOLEAN DEFAULT true,
    starts_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- LOYALTY PROGRAM
-- ============================================

CREATE TABLE IF NOT EXISTS public.loyalty_programs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    
    name TEXT NOT NULL,
    description TEXT,
    
    -- Points configuration
    points_per_dollar DECIMAL(10, 2) DEFAULT 1, -- Earn 1 point per $1 spent
    points_for_review INTEGER DEFAULT 10,
    points_for_referral INTEGER DEFAULT 50,
    points_for_signup INTEGER DEFAULT 25,
    
    -- Redemption
    points_value DECIMAL(10, 4) DEFAULT 0.01, -- 1 point = $0.01
    min_points_redeem INTEGER DEFAULT 100,
    
    -- Tiers
    tiers JSONB DEFAULT '[]'::jsonb, -- [{"name": "Bronze", "min_points": 0, "multiplier": 1}]
    
    -- Status
    active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.customer_loyalty_points (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    
    -- Points
    total_points INTEGER DEFAULT 0,
    available_points INTEGER DEFAULT 0,
    lifetime_points INTEGER DEFAULT 0,
    
    -- Tier
    current_tier TEXT DEFAULT 'Bronze',
    
    -- Metadata
    last_earned_at TIMESTAMP WITH TIME ZONE,
    last_redeemed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(user_id, store_id)
);

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    
    type TEXT NOT NULL, -- 'earned', 'redeemed', 'expired'
    points INTEGER NOT NULL,
    reason TEXT NOT NULL, -- 'purchase', 'review', 'referral', 'redemption'
    
    -- Related entities
    order_id TEXT,
    review_id UUID,
    referral_id UUID,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- FLASH SALES
-- ============================================

CREATE TABLE IF NOT EXISTS public.flash_sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    
    name TEXT NOT NULL,
    description TEXT,
    
    -- Timing
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Discount
    discount_type TEXT NOT NULL, -- 'percentage', 'fixed'
    discount_value DECIMAL(10, 2) NOT NULL,
    
    -- Products
    product_ids TEXT[] DEFAULT '{}',
    category_ids TEXT[] DEFAULT '{}',
    apply_to_all BOOLEAN DEFAULT false,
    
    -- Limits
    max_uses INTEGER,
    uses_count INTEGER DEFAULT 0,
    max_per_customer INTEGER DEFAULT 1,
    
    -- Display
    banner_url TEXT,
    show_countdown BOOLEAN DEFAULT true,
    
    -- Status
    active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- GIFT CARDS
-- ============================================

CREATE TABLE IF NOT EXISTS public.gift_cards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    
    code TEXT NOT NULL UNIQUE,
    
    -- Value
    initial_value DECIMAL(10, 2) NOT NULL,
    current_balance DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'TTD',
    
    -- Recipient
    recipient_email TEXT,
    recipient_name TEXT,
    message TEXT,
    
    -- Purchaser
    purchaser_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    order_id TEXT,
    
    -- Status
    status TEXT DEFAULT 'active', -- 'active', 'redeemed', 'expired', 'cancelled'
    
    -- Validity
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    redeemed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.gift_card_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gift_card_id UUID REFERENCES public.gift_cards(id) ON DELETE CASCADE NOT NULL,
    
    type TEXT NOT NULL, -- 'purchase', 'redemption', 'refund'
    amount DECIMAL(10, 2) NOT NULL,
    order_id TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- PRODUCT ALERTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    
    alert_type TEXT NOT NULL, -- 'back_in_stock', 'price_drop', 'new_arrival'
    
    -- For price drop alerts
    target_price DECIMAL(10, 2),
    
    -- Status
    triggered BOOLEAN DEFAULT false,
    triggered_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- CUSTOMER SEGMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.customer_segments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    
    name TEXT NOT NULL,
    description TEXT,
    
    -- Segment rules (JSONB for flexibility)
    rules JSONB DEFAULT '{}'::jsonb,
    -- Example: {"total_spent": {"min": 500}, "orders_count": {"min": 5}}
    
    -- Auto-update
    auto_update BOOLEAN DEFAULT true,
    last_updated TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.segment_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    segment_id UUID REFERENCES public.customer_segments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    
    added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(segment_id, user_id)
);

-- ============================================
-- EMAIL CAMPAIGNS
-- ============================================

CREATE TABLE IF NOT EXISTS public.email_campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    
    -- Content
    html_body TEXT NOT NULL,
    text_body TEXT,
    
    -- Targeting
    segment_ids TEXT[] DEFAULT '{}',
    send_to_all BOOLEAN DEFAULT false,
    
    -- Scheduling
    status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'sent'
    scheduled_at TIMESTAMP WITH TIME ZONE,
    
    -- Stats
    recipients_count INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- ABANDONED CARTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.abandoned_carts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    
    -- Cart data
    items JSONB NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    
    -- Contact info (for guest users)
    email TEXT,
    phone TEXT,
    
    -- Recovery
    recovery_email_sent BOOLEAN DEFAULT false,
    recovery_email_sent_at TIMESTAMP WITH TIME ZONE,
    recovered BOOLEAN DEFAULT false,
    recovered_order_id TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- STORE BLOG
-- ============================================

CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    
    -- Media
    featured_image TEXT,
    
    -- SEO
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT[],
    
    -- Categories/Tags
    tags TEXT[] DEFAULT '{}',
    
    -- Status
    status TEXT DEFAULT 'draft', -- 'draft', 'published'
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Stats
    views_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(store_id, slug)
);

-- ============================================
-- PRODUCT COLLECTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_collections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    
    -- Display
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    
    -- Rules (auto-collections)
    collection_type TEXT DEFAULT 'manual', -- 'manual', 'auto'
    rules JSONB DEFAULT '{}'::jsonb,
    
    -- SEO
    meta_title TEXT,
    meta_description TEXT,
    
    -- Status
    published BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(store_id, slug)
);

CREATE TABLE IF NOT EXISTS public.collection_products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    collection_id UUID REFERENCES public.product_collections(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    position INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(collection_id, product_id)
);

-- ============================================
-- STORE PAGES (Custom Pages)
-- ============================================

CREATE TABLE IF NOT EXISTS public.store_pages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content TEXT NOT NULL,
    
    -- Page type
    page_type TEXT DEFAULT 'custom', -- 'custom', 'about', 'contact', 'faq', 'terms', 'privacy'
    
    -- SEO
    meta_title TEXT,
    meta_description TEXT,
    
    -- Display
    show_in_menu BOOLEAN DEFAULT true,
    menu_position INTEGER DEFAULT 0,
    
    -- Status
    published BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(store_id, slug)
);

-- ============================================
-- STORE NAVIGATION MENUS
-- ============================================

CREATE TABLE IF NOT EXISTS public.store_menus (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    
    name TEXT NOT NULL,
    location TEXT NOT NULL, -- 'header', 'footer', 'sidebar'
    
    items JSONB DEFAULT '[]'::jsonb,
    -- Example: [{"label": "Shop", "url": "/shop", "children": [...]}]
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- ANALYTICS & TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_views (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Session tracking
    session_id TEXT,
    
    -- Referrer
    referrer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    
    -- Device info
    user_agent TEXT,
    ip_address TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.add_to_cart_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    quantity INTEGER NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- SOCIAL MEDIA INTEGRATION
-- ============================================

CREATE TABLE IF NOT EXISTS public.social_media_accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    
    platform TEXT NOT NULL, -- 'instagram', 'facebook', 'tiktok', 'twitter'
    username TEXT NOT NULL,
    access_token TEXT, -- Encrypted
    
    -- Settings
    auto_post_products BOOLEAN DEFAULT false,
    sync_enabled BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(store_id, platform)
);

-- ============================================
-- STAFF & PERMISSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.store_staff (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    
    role TEXT NOT NULL, -- 'admin', 'manager', 'staff'
    
    -- Permissions
    permissions JSONB DEFAULT '{}'::jsonb,
    -- Example: {"products": {"view": true, "edit": true}, "orders": {"view": true}}
    
    -- Status
    active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(store_id, user_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS product_bundles_store_id_idx ON public.product_bundles(store_id);
CREATE INDEX IF NOT EXISTS loyalty_programs_store_id_idx ON public.loyalty_programs(store_id);
CREATE INDEX IF NOT EXISTS customer_loyalty_points_user_store_idx ON public.customer_loyalty_points(user_id, store_id);
CREATE INDEX IF NOT EXISTS flash_sales_store_id_idx ON public.flash_sales(store_id);
CREATE INDEX IF NOT EXISTS flash_sales_dates_idx ON public.flash_sales(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS gift_cards_code_idx ON public.gift_cards(code);
CREATE INDEX IF NOT EXISTS product_alerts_user_product_idx ON public.product_alerts(user_id, product_id);
CREATE INDEX IF NOT EXISTS abandoned_carts_store_id_idx ON public.abandoned_carts(store_id);
CREATE INDEX IF NOT EXISTS blog_posts_store_slug_idx ON public.blog_posts(store_id, slug);
CREATE INDEX IF NOT EXISTS product_collections_store_slug_idx ON public.product_collections(store_id, slug);
CREATE INDEX IF NOT EXISTS product_views_product_id_idx ON public.product_views(product_id);
CREATE INDEX IF NOT EXISTS add_to_cart_events_product_id_idx ON public.add_to_cart_events(product_id);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Product Bundles
ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active bundles viewable by everyone" ON public.product_bundles FOR SELECT USING (active = true);
CREATE POLICY "Store owners manage bundles" ON public.product_bundles FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.stores WHERE id = product_bundles.store_id AND owner_id = auth.uid()));

-- Loyalty Programs
ALTER TABLE public.loyalty_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active loyalty programs viewable" ON public.loyalty_programs FOR SELECT USING (active = true);
CREATE POLICY "Store owners manage loyalty" ON public.loyalty_programs FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.stores WHERE id = loyalty_programs.store_id AND owner_id = auth.uid()));

-- Customer Loyalty Points
ALTER TABLE public.customer_loyalty_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own points" ON public.customer_loyalty_points FOR SELECT USING (auth.uid() = user_id);

-- Flash Sales
ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active flash sales viewable" ON public.flash_sales FOR SELECT USING (active = true);
CREATE POLICY "Store owners manage flash sales" ON public.flash_sales FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.stores WHERE id = flash_sales.store_id AND owner_id = auth.uid()));

-- Gift Cards
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own gift cards" ON public.gift_cards FOR SELECT 
    USING (auth.uid() = purchaser_id OR recipient_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

-- Blog Posts
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published blog posts viewable" ON public.blog_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Store owners manage blog" ON public.blog_posts FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.stores WHERE id = blog_posts.store_id AND owner_id = auth.uid()));

-- Collections
ALTER TABLE public.product_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published collections viewable" ON public.product_collections FOR SELECT USING (published = true);
CREATE POLICY "Store owners manage collections" ON public.product_collections FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.stores WHERE id = product_collections.store_id AND owner_id = auth.uid()));

-- Store Pages
ALTER TABLE public.store_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published pages viewable" ON public.store_pages FOR SELECT USING (published = true);
CREATE POLICY "Store owners manage pages" ON public.store_pages FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.stores WHERE id = store_pages.store_id AND owner_id = auth.uid()));

-- Staff
ALTER TABLE public.store_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff view own store access" ON public.store_staff FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Store owners manage staff" ON public.store_staff FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.stores WHERE id = store_staff.store_id AND owner_id = auth.uid()));

COMMENT ON TABLE public.product_bundles IS 'Product bundles and BOGO deals';
COMMENT ON TABLE public.loyalty_programs IS 'Store loyalty and rewards programs';
COMMENT ON TABLE public.flash_sales IS 'Time-limited flash sales';
COMMENT ON TABLE public.gift_cards IS 'Digital gift cards';
COMMENT ON TABLE public.product_alerts IS 'Price drop and back-in-stock alerts';
COMMENT ON TABLE public.customer_segments IS 'Customer segmentation for targeted marketing';
COMMENT ON TABLE public.email_campaigns IS 'Email marketing campaigns';
COMMENT ON TABLE public.abandoned_carts IS 'Abandoned cart tracking and recovery';
COMMENT ON TABLE public.blog_posts IS 'Store blog posts';
COMMENT ON TABLE public.product_collections IS 'Product collections and categories';
COMMENT ON TABLE public.store_pages IS 'Custom store pages';
COMMENT ON TABLE public.store_staff IS 'Store staff and permissions';
