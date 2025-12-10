-- Migration: 15_payment_system.sql
-- Description: Add payment transaction tracking for all Trinidad & Tobago payment methods

-- Payment Transactions Table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id TEXT NOT NULL,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    
    -- Payment Details
    method TEXT NOT NULL, -- 'cod', 'cash', 'wipay', 'google_pay', 'bank_transfer', 'linx'
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'TTD',
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'refunded'
    
    -- Customer Info
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT NOT NULL,
    
    -- Transaction Details
    transaction_id TEXT, -- External transaction ID from payment gateway
    reference_number TEXT, -- Bank reference or receipt number
    bank_details JSONB, -- For bank transfers
    
    -- Metadata
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Store owners can view their payment transactions"
    ON public.payment_transactions FOR SELECT
    USING ( EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = payment_transactions.store_id
        AND stores.owner_id = auth.uid()
    ));

CREATE POLICY "System can insert payment transactions"
    ON public.payment_transactions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "System can update payment transactions"
    ON public.payment_transactions FOR UPDATE
    USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS payment_transactions_order_id_idx ON public.payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS payment_transactions_store_id_idx ON public.payment_transactions(store_id);
CREATE INDEX IF NOT EXISTS payment_transactions_status_idx ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS payment_transactions_method_idx ON public.payment_transactions(method);
CREATE INDEX IF NOT EXISTS payment_transactions_created_at_idx ON public.payment_transactions(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_transaction_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = timezone('utc'::text, now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER payment_transaction_updated_at
    BEFORE UPDATE ON public.payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_transaction_timestamp();

-- Payment Methods Configuration Table
CREATE TABLE IF NOT EXISTS public.store_payment_methods (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    
    method TEXT NOT NULL, -- 'cod', 'wipay', 'google_pay', 'bank_transfer'
    enabled BOOLEAN DEFAULT true,
    
    -- Method-specific configuration
    config JSONB DEFAULT '{}'::jsonb,
    
    -- For WiPay
    wipay_merchant_id TEXT,
    wipay_api_key TEXT, -- Encrypted
    
    -- For Bank Transfer
    bank_name TEXT,
    account_number TEXT,
    account_name TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(store_id, method)
);

-- Enable RLS
ALTER TABLE public.store_payment_methods ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Store owners can manage their payment methods"
    ON public.store_payment_methods FOR ALL
    USING ( EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = store_payment_methods.store_id
        AND stores.owner_id = auth.uid()
    ));

CREATE POLICY "Public can view enabled payment methods"
    ON public.store_payment_methods FOR SELECT
    USING (enabled = true);

-- Default payment methods for existing stores
INSERT INTO public.store_payment_methods (store_id, method, enabled)
SELECT id, 'cod', true FROM public.stores
ON CONFLICT (store_id, method) DO NOTHING;

-- Payment Analytics View
CREATE OR REPLACE VIEW public.store_payment_analytics AS
SELECT 
    store_id,
    method,
    COUNT(*) as transaction_count,
    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_transactions,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_transactions,
    AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as average_transaction,
    DATE_TRUNC('day', created_at) as transaction_date
FROM public.payment_transactions
GROUP BY store_id, method, DATE_TRUNC('day', created_at);

-- Grant access to view
GRANT SELECT ON public.store_payment_analytics TO authenticated;

COMMENT ON TABLE public.payment_transactions IS 'Tracks all payment transactions across all payment methods for Trinidad & Tobago stores';
COMMENT ON TABLE public.store_payment_methods IS 'Configuration for payment methods available per store';
