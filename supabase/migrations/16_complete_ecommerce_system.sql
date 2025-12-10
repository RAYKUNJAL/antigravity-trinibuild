-- Migration: 16_complete_ecommerce_system.sql
-- Description: Complete e-commerce system with variants, reviews, wishlists, promos, TriniBuild Go delivery, notifications

-- ============================================
-- PRODUCT VARIANTS & OPTIONS
-- ============================================

-- Product Options (e.g., Color, Size, Material)
CREATE TABLE IF NOT EXISTS public.product_options (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL, -- 'Color', 'Size', 'Material'
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Product Option Values (e.g., Red, Blue, Small, Large)
CREATE TABLE IF NOT EXISTS public.product_option_values (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    option_id UUID REFERENCES public.product_options(id) ON DELETE CASCADE NOT NULL,
    value TEXT NOT NULL, -- 'Red', 'Small', 'Cotton'
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Product Variants (Combinations of options)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    sku TEXT UNIQUE,
    title TEXT, -- 'Red / Small'
    price DECIMAL(10, 2) NOT NULL,
    compare_at_price DECIMAL(10, 2),
    cost_price DECIMAL(10, 2), -- For profit calculation
    
    -- Inventory
    inventory_quantity INTEGER DEFAULT 0,
    inventory_policy TEXT DEFAULT 'deny', -- 'deny' or 'continue' (allow backorders)
    track_inventory BOOLEAN DEFAULT true,
    
    -- Physical attributes
    weight DECIMAL(10, 2), -- in kg
    weight_unit TEXT DEFAULT 'kg',
    
    -- Images
    image_url TEXT,
    
    -- Option values (JSONB for flexibility)
    option_values JSONB DEFAULT '{}'::jsonb, -- {"Color": "Red", "Size": "Small"}
    
    -- Status
    available BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- PRODUCT REVIEWS & RATINGS
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    order_id TEXT, -- Link to verified purchase
    
    -- Review content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    content TEXT NOT NULL,
    
    -- Media
    images TEXT[] DEFAULT '{}',
    
    -- Verification
    verified_purchase BOOLEAN DEFAULT false,
    
    -- Moderation
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    
    -- Helpfulness
    helpful_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Review Helpfulness Votes
CREATE TABLE IF NOT EXISTS public.review_votes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    review_id UUID REFERENCES public.product_reviews(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    helpful BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(review_id, user_id)
);

-- ============================================
-- WISHLISTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT DEFAULT 'My Wishlist',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.wishlist_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wishlist_id UUID REFERENCES public.wishlists(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(wishlist_id, product_id, variant_id)
);

-- ============================================
-- PROMO CODES & DISCOUNTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.promo_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    
    -- Discount type
    discount_type TEXT NOT NULL, -- 'percentage', 'fixed_amount', 'free_shipping'
    discount_value DECIMAL(10, 2) NOT NULL,
    
    -- Conditions
    minimum_purchase DECIMAL(10, 2) DEFAULT 0,
    maximum_discount DECIMAL(10, 2), -- Cap for percentage discounts
    
    -- Usage limits
    usage_limit INTEGER, -- Total uses allowed
    usage_count INTEGER DEFAULT 0,
    per_customer_limit INTEGER DEFAULT 1,
    
    -- Validity
    starts_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Promo Code Usage Tracking
CREATE TABLE IF NOT EXISTS public.promo_code_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    order_id TEXT NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- TRINIBUILD GO DELIVERY INTEGRATION
-- ============================================

CREATE TABLE IF NOT EXISTS public.delivery_options (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    
    -- Delivery type
    type TEXT NOT NULL, -- 'trinibuild_go', 'store_delivery', 'pickup', 'courier'
    name TEXT NOT NULL,
    description TEXT,
    
    -- Pricing
    base_price DECIMAL(10, 2) DEFAULT 0,
    price_per_km DECIMAL(10, 2) DEFAULT 0,
    free_over_amount DECIMAL(10, 2), -- Free delivery over this amount
    
    -- Delivery zones (for store delivery)
    zones JSONB DEFAULT '[]'::jsonb, -- [{"name": "Port of Spain", "price": 30}]
    
    -- TriniBuild Go specific
    trinibuild_go_enabled BOOLEAN DEFAULT false,
    auto_assign_driver BOOLEAN DEFAULT true,
    
    -- Timing
    estimated_delivery_time TEXT, -- '1-2 hours', '1-3 days'
    
    -- Status
    enabled BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Delivery Requests (Links orders to TriniBuild Go drivers)
CREATE TABLE IF NOT EXISTS public.delivery_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id TEXT NOT NULL,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    
    -- Driver assignment
    driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Pickup details
    pickup_address TEXT NOT NULL,
    pickup_lat DECIMAL(10, 8),
    pickup_lng DECIMAL(11, 8),
    pickup_phone TEXT,
    pickup_instructions TEXT,
    
    -- Delivery details
    delivery_address TEXT NOT NULL,
    delivery_lat DECIMAL(10, 8),
    delivery_lng DECIMAL(11, 8),
    delivery_phone TEXT NOT NULL,
    delivery_instructions TEXT,
    
    -- Package details
    package_description TEXT,
    package_value DECIMAL(10, 2),
    requires_signature BOOLEAN DEFAULT false,
    
    -- Pricing
    delivery_fee DECIMAL(10, 2) NOT NULL,
    driver_earnings DECIMAL(10, 2), -- Driver's cut
    
    -- Status tracking
    status TEXT DEFAULT 'pending', -- 'pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed'
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE,
    picked_up_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Proof of delivery
    signature_url TEXT,
    photo_url TEXT,
    delivery_notes TEXT
);

-- ============================================
-- NOTIFICATIONS SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Notification type
    type TEXT NOT NULL, -- 'order_placed', 'order_shipped', 'delivery_assigned', 'price_drop', 'back_in_stock'
    
    -- Content
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Links
    link_url TEXT,
    link_text TEXT,
    
    -- Channels
    sent_via_app BOOLEAN DEFAULT true,
    sent_via_email BOOLEAN DEFAULT false,
    sent_via_sms BOOLEAN DEFAULT false,
    sent_via_whatsapp BOOLEAN DEFAULT false,
    
    -- Status
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Email Queue
CREATE TABLE IF NOT EXISTS public.email_queue (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Recipient
    to_email TEXT NOT NULL,
    to_name TEXT,
    
    -- Email content
    subject TEXT NOT NULL,
    html_body TEXT NOT NULL,
    text_body TEXT,
    
    -- Template
    template_name TEXT,
    template_data JSONB,
    
    -- Status
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE
);

-- WhatsApp Message Queue
CREATE TABLE IF NOT EXISTS public.whatsapp_queue (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Recipient
    phone_number TEXT NOT NULL,
    
    -- Message content
    message TEXT NOT NULL,
    
    -- Template (for WhatsApp Business API)
    template_name TEXT,
    template_params JSONB,
    
    -- Media
    media_url TEXT,
    
    -- Status
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'read', 'failed'
    whatsapp_message_id TEXT,
    
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE
);

-- SMS Queue
CREATE TABLE IF NOT EXISTS public.sms_queue (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Recipient
    phone_number TEXT NOT NULL,
    
    -- Message
    message TEXT NOT NULL,
    
    -- Status
    status TEXT DEFAULT 'pending',
    sms_id TEXT,
    
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- IN-APP MESSAGING
-- ============================================

CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Participants
    customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    
    -- Related to
    order_id TEXT,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    
    -- Status
    status TEXT DEFAULT 'open', -- 'open', 'closed', 'archived'
    
    -- Last message
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_message_preview TEXT,
    
    -- Unread counts
    customer_unread_count INTEGER DEFAULT 0,
    store_unread_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    
    -- Sender
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    sender_type TEXT NOT NULL, -- 'customer', 'store'
    
    -- Content
    message TEXT NOT NULL,
    
    -- Media
    attachments TEXT[] DEFAULT '{}',
    
    -- Status
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- ENHANCED ORDERS TABLE
-- ============================================

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES public.promo_codes(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_option_id UUID REFERENCES public.delivery_options(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_request_id UUID REFERENCES public.delivery_requests(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS product_variants_product_id_idx ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS product_variants_sku_idx ON public.product_variants(sku);
CREATE INDEX IF NOT EXISTS product_reviews_product_id_idx ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS product_reviews_user_id_idx ON public.product_reviews(user_id);
CREATE INDEX IF NOT EXISTS product_reviews_status_idx ON public.product_reviews(status);
CREATE INDEX IF NOT EXISTS wishlist_items_user_id_idx ON public.wishlist_items(wishlist_id);
CREATE INDEX IF NOT EXISTS promo_codes_code_idx ON public.promo_codes(code);
CREATE INDEX IF NOT EXISTS promo_codes_store_id_idx ON public.promo_codes(store_id);
CREATE INDEX IF NOT EXISTS delivery_requests_status_idx ON public.delivery_requests(status);
CREATE INDEX IF NOT EXISTS delivery_requests_driver_id_idx ON public.delivery_requests(driver_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications(read);
CREATE INDEX IF NOT EXISTS conversations_customer_id_idx ON public.conversations(customer_id);
CREATE INDEX IF NOT EXISTS conversations_store_id_idx ON public.conversations(store_id);
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON public.messages(conversation_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Product Variants
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Product variants are viewable by everyone" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Store owners can manage variants" ON public.product_variants FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.products p JOIN public.stores s ON p.store_id = s.id WHERE p.id = product_variants.product_id AND s.owner_id = auth.uid()));

-- Reviews
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved reviews are viewable by everyone" ON public.product_reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can create reviews" ON public.product_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.product_reviews FOR UPDATE USING (auth.uid() = user_id);

-- Wishlists
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wishlists" ON public.wishlists FOR SELECT USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "Users can manage own wishlists" ON public.wishlists FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wishlist items" ON public.wishlist_items FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.wishlists WHERE id = wishlist_items.wishlist_id AND (user_id = auth.uid() OR is_public = true)));
CREATE POLICY "Users can manage own wishlist items" ON public.wishlist_items FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.wishlists WHERE id = wishlist_items.wishlist_id AND user_id = auth.uid()));

-- Promo Codes
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active promo codes are viewable by everyone" ON public.promo_codes FOR SELECT USING (active = true);
CREATE POLICY "Store owners can manage promo codes" ON public.promo_codes FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.stores WHERE id = promo_codes.store_id AND owner_id = auth.uid()));

-- Delivery Options
ALTER TABLE public.delivery_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enabled delivery options are viewable" ON public.delivery_options FOR SELECT USING (enabled = true);
CREATE POLICY "Store owners can manage delivery options" ON public.delivery_options FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.stores WHERE id = delivery_options.store_id AND owner_id = auth.uid()));

-- Delivery Requests
ALTER TABLE public.delivery_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Drivers can view assigned deliveries" ON public.delivery_requests FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY "Store owners can view their deliveries" ON public.delivery_requests FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.stores WHERE id = delivery_requests.store_id AND owner_id = auth.uid()));

-- Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers can view own conversations" ON public.conversations FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Store owners can view store conversations" ON public.conversations FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.stores WHERE id = conversations.store_id AND owner_id = auth.uid()));

-- Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Conversation participants can view messages" ON public.messages FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.conversations c 
        WHERE c.id = messages.conversation_id 
        AND (c.customer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.stores WHERE id = c.store_id AND owner_id = auth.uid()))
    ));
CREATE POLICY "Conversation participants can send messages" ON public.messages FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.conversations c 
        WHERE c.id = messages.conversation_id 
        AND (c.customer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.stores WHERE id = c.store_id AND owner_id = auth.uid()))
    ));

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

COMMENT ON TABLE public.product_variants IS 'Product variants with different options (size, color, etc.)';
COMMENT ON TABLE public.product_reviews IS 'Customer reviews and ratings for products';
COMMENT ON TABLE public.wishlists IS 'Customer wishlists for saving favorite products';
COMMENT ON TABLE public.promo_codes IS 'Promotional discount codes';
COMMENT ON TABLE public.delivery_options IS 'Delivery methods including TriniBuild Go integration';
COMMENT ON TABLE public.delivery_requests IS 'Delivery requests assigned to TriniBuild Go drivers';
COMMENT ON TABLE public.notifications IS 'Multi-channel notification system';
COMMENT ON TABLE public.conversations IS 'Customer-Store messaging conversations';
COMMENT ON TABLE public.messages IS 'Messages within conversations';
