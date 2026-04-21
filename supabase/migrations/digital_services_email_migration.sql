-- ═══════════════════════════════════════════════════════════════
-- TriniBuild Digital Services + Email Marketing Migration
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Digital Orders
CREATE TABLE IF NOT EXISTS digital_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    product_id TEXT NOT NULL,
    variant_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    amount_ttd DECIMAL(10,2) NOT NULL,
    amount_usd DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('paypal', 'bank_deposit')),
    payment_reference TEXT,
    payment_proof_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verifying', 'verified', 'fulfilled', 'failed', 'refunded', 'flagged')),
    digital_code TEXT,
    delivered_via TEXT CHECK (delivered_via IN ('whatsapp', 'email', 'in_app')),
    delivered_at TIMESTAMPTZ,
    fraud_score INTEGER DEFAULT 0,
    fraud_flags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ
);

-- 2. Digital Inventory (codes ready to sell)
CREATE TABLE IF NOT EXISTS digital_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id TEXT NOT NULL,
    variant_id TEXT NOT NULL,
    code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'expired')),
    supplier TEXT NOT NULL,
    cost_usd DECIMAL(10,2),
    order_id UUID REFERENCES digital_orders(id),
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    sold_at TIMESTAMPTZ
);

-- 3. Digital Deliveries (delivery tracking)
CREATE TABLE IF NOT EXISTS digital_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES digital_orders(id),
    user_id UUID REFERENCES auth.users(id),
    delivery_method TEXT NOT NULL CHECK (delivery_method IN ('whatsapp', 'email', 'in_app')),
    recipient TEXT NOT NULL,
    message_preview TEXT,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'failed')),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Digital Waitlist (bank payment interest)
CREATE TABLE IF NOT EXISTS digital_waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    phone TEXT,
    product_interest TEXT,
    notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Email Subscribers
CREATE TABLE IF NOT EXISTS email_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID,
    email TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced', 'complained')),
    lists JSONB DEFAULT '["default"]'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    last_engaged_at TIMESTAMPTZ,
    unsubscribed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, email)
);

-- 6. Email Campaigns
CREATE TABLE IF NOT EXISTS email_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    from_name TEXT,
    from_email TEXT,
    body_html TEXT,
    body_text TEXT,
    lists JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused')),
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    stats JSONB DEFAULT '{"total_sent":0,"delivered":0,"opened":0,"clicked":0,"bounced":0,"unsubscribed":0,"open_rate":0,"click_rate":0}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('welcome', 'promotion', 'newsletter', 'transactional', 'abandoned_cart', 'review_request')),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Email Queue
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_email TEXT NOT NULL,
    to_name TEXT,
    from_name TEXT DEFAULT 'TriniBuild',
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    store_id UUID,
    type TEXT DEFAULT 'transactional',
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'failed', 'bounced')),
    attempts INTEGER DEFAULT 0,
    sent_at TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Document Generations (AI Document tracking)
CREATE TABLE IF NOT EXISTS document_generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    document_type TEXT NOT NULL,
    input_data JSONB,
    output_preview TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Admin Notifications
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    action_url TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Directory auto-add support
ALTER TABLE directory_businesses ADD COLUMN IF NOT EXISTS store_id UUID;
ALTER TABLE directory_businesses ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE directory_businesses ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- ═══════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_digital_orders_user ON digital_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_orders_status ON digital_orders(status);
CREATE INDEX IF NOT EXISTS idx_digital_orders_created ON digital_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_digital_inventory_available ON digital_inventory(product_id, variant_id, status);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_store ON email_subscribers(store_id, status);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_unread ON admin_notifications(read, created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE digital_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_generations ENABLE ROW LEVEL SECURITY;

-- Users can see their own orders
CREATE POLICY "Users see own digital orders" ON digital_orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create own digital orders" ON digital_orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Anyone can join waitlist
CREATE POLICY "Anyone can join digital waitlist" ON digital_waitlist
    FOR INSERT WITH CHECK (true);

-- Users see own document generations
CREATE POLICY "Users see own documents" ON document_generations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create documents" ON document_generations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Email subscribers: store owners manage their subscribers
CREATE POLICY "Store owners manage subscribers" ON email_subscribers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM stores WHERE stores.id = email_subscribers.store_id AND stores.owner_id = auth.uid()
        )
    );

-- Email campaigns: store owners manage their campaigns
CREATE POLICY "Store owners manage campaigns" ON email_campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM stores WHERE stores.id = email_campaigns.store_id AND stores.owner_id = auth.uid()
        )
    );

-- ═══════════════════════════════════════════════════════════════
-- DONE! Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════
