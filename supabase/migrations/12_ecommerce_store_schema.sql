-- 12_ecommerce_store_schema.sql
-- Implements the full TriniBuild Ecommerce Store Builder schema

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. STORES TABLE
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT, -- Simple URL fallback
    banner_url TEXT, -- Simple URL fallback
    whatsapp TEXT,
    location TEXT,
    category TEXT DEFAULT 'General',
    status TEXT DEFAULT 'draft', -- 'draft', 'active', 'suspended'
    theme_config JSONB DEFAULT '{}'::jsonb, -- Store simple theme settings here or link to themes table
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for stores
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public stores are viewable by everyone" 
ON public.stores FOR SELECT 
USING (status = 'active');

CREATE POLICY "Users can create their own store" 
ON public.stores FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own store" 
ON public.stores FOR UPDATE 
USING (auth.uid() = owner_id);

-- 2. LOGOS TABLE (AI Generated)
CREATE TABLE IF NOT EXISTS public.logos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    image_png_url TEXT,
    image_svg_url TEXT,
    favicon_url TEXT,
    color_palette JSONB,
    font_suggestions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.logos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can view their logos" 
ON public.logos FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = logos.store_id AND stores.owner_id = auth.uid()));

-- 3. THEMES TABLE
CREATE TABLE IF NOT EXISTS public.themes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT,
    tokens JSONB, -- Colors, typography, layout settings
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;

-- 4. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active', -- 'draft', 'active', 'archived'
    base_price DECIMAL(10, 2) NOT NULL,
    compare_at_price DECIMAL(10, 2),
    cost DECIMAL(10, 2),
    image_url TEXT,
    images TEXT[], -- Array of additional image URLs
    tags TEXT[],
    category TEXT,
    stock INTEGER DEFAULT 0, -- Simple stock tracking if variants not used
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public products are viewable by everyone" 
ON public.products FOR SELECT 
USING (status = 'active');

CREATE POLICY "Store owners can manage their products" 
ON public.products FOR ALL 
USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = products.store_id AND stores.owner_id = auth.uid()));

-- 5. PRODUCT VARIANTS TABLE
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    sku TEXT,
    title TEXT, -- e.g. "Small / Red"
    options JSONB, -- { "Size": "Small", "Color": "Red" }
    price DECIMAL(10, 2) NOT NULL,
    compare_at_price DECIMAL(10, 2),
    inventory_quantity INTEGER DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- 6. COLLECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    hero_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- 7. COLLECTION_PRODUCTS (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.collection_products (
    collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    PRIMARY KEY (collection_id, product_id)
);

ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;

-- 8. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_user_id UUID REFERENCES auth.users(id), -- Nullable for guest checkout
    order_number TEXT, -- Friendly ID like #1001
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'shipped', 'delivered', 'cancelled'
    payment_method TEXT, -- 'cod', 'card', 'paypal'
    subtotal DECIMAL(10, 2),
    shipping_fee DECIMAL(10, 2),
    tax DECIMAL(10, 2),
    total DECIMAL(10, 2),
    currency TEXT DEFAULT 'TTD',
    shipping_address JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can view their orders" 
ON public.orders FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid()));

CREATE POLICY "Customers can view their own orders" 
ON public.orders FOR SELECT 
USING (auth.uid() = customer_user_id);

CREATE POLICY "Anyone can create an order" 
ON public.orders FOR INSERT 
WITH CHECK (true);

-- 9. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    variant_id UUID REFERENCES public.product_variants(id),
    title TEXT,
    quantity INTEGER,
    unit_price DECIMAL(10, 2),
    total_price DECIMAL(10, 2)
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 10. STOREFRONT PAGES TABLE
CREATE TABLE IF NOT EXISTS public.storefront_pages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    type TEXT, -- 'home', 'about', 'contact', 'faq'
    slug TEXT,
    title TEXT,
    content_json JSONB,
    seo_meta JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.storefront_pages ENABLE ROW LEVEL SECURITY;

-- 11. ANALYTICS EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id BIGSERIAL PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    session_id TEXT,
    event_type TEXT,
    event_payload JSONB,
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert analytics" 
ON public.analytics_events FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Store owners can view analytics" 
ON public.analytics_events FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = analytics_events.store_id AND stores.owner_id = auth.uid()));
