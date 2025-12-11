-- Migration: 28_fix_store_creation_flow.sql
-- Description: Ensures all tables and columns required for Store Creation flow are present.

-- 1. Fix signed_agreements (Critical for Sign & Launch freeze)
CREATE TABLE IF NOT EXISTS public.signed_agreements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    document_type TEXT NOT NULL,
    document_version TEXT NOT NULL,
    signature_data TEXT NOT NULL,
    ip_address TEXT,
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure service_type column exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'signed_agreements' AND column_name = 'service_type') THEN
        ALTER TABLE public.signed_agreements ADD COLUMN service_type VARCHAR(50);
    END IF;
END $$;

-- Enable RLS for signed_agreements
ALTER TABLE public.signed_agreements ENABLE ROW LEVEL SECURITY;

-- Ensure RLS policy for signatures
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'signed_agreements' AND policyname = 'Users can insert their own agreements') THEN
        CREATE POLICY "Users can insert their own agreements" 
        ON public.signed_agreements FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;


-- 2. Ensure Stores table has theme_config (for "New Improvements")
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'theme_config') THEN
        ALTER TABLE public.stores ADD COLUMN theme_config JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 3. Ensure Products table exists (for store generation)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    base_price DECIMAL(10, 2) NOT NULL,
    compare_at_price DECIMAL(10, 2),
    cost DECIMAL(10, 2),
    image_url TEXT,
    images TEXT[],
    tags TEXT[],
    category TEXT,
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Products Policies
DO $$
BEGIN
     -- Store owners can insert products
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Store owners can insert products') THEN
        CREATE POLICY "Store owners can insert products" 
        ON public.products FOR INSERT 
        WITH CHECK (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = products.store_id AND stores.owner_id = auth.uid()));
    END IF;
    
    -- Store owners can view their products
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Store owners can view their products') THEN
        CREATE POLICY "Store owners can view their products" 
        ON public.products FOR SELECT 
        USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = products.store_id AND stores.owner_id = auth.uid()));
    END IF;
    
    -- Public can view active products
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Public products are viewable by everyone') THEN
        CREATE POLICY "Public products are viewable by everyone" 
        ON public.products FOR SELECT 
        USING (status = 'active');
    END IF;
END $$;


-- 4. Ensure Themes table exists (for theme saving)
CREATE TABLE IF NOT EXISTS public.themes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT,
    tokens JSONB,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'themes' AND policyname = 'Store owners can manage themes') THEN
        CREATE POLICY "Store owners can manage themes" 
        ON public.themes FOR ALL
        USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = themes.store_id AND stores.owner_id = auth.uid()));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'themes' AND policyname = 'Public themes are viewable') THEN
        CREATE POLICY "Public themes are viewable" 
        ON public.themes FOR SELECT 
        USING (true);
    END IF;
END $$;
