-- =====================================================
-- Payment Method Update - Trinidad & Tobago Support
-- =====================================================

-- Add payment_method column to payments table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE payments ADD COLUMN payment_method TEXT DEFAULT 'paypal';
    END IF;
END $$;

-- Update payment_method constraint to include all Trinidad payment methods
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check 
    CHECK (payment_method IN ('paypal', 'cod', 'wipay', 'ttbank', 'stripe'));

-- Create index on payment_method for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON payments(payment_method);

-- Add COD confirmation tracking
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'cod_confirmed_by'
    ) THEN
        ALTER TABLE payments ADD COLUMN cod_confirmed_by UUID REFERENCES auth.users(id);
        ALTER TABLE payments ADD COLUMN cod_confirmed_at TIMESTAMPTZ;
    END IF;
END $$;

-- Create view for payment method statistics
CREATE OR REPLACE VIEW payment_method_stats AS
SELECT 
    payment_method,
    COUNT(*) as total_transactions,
    SUM(amount) as total_amount,
    AVG(amount) as average_amount,
    COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as successful_transactions,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions
FROM payments
GROUP BY payment_method;

-- Grant access to the view
GRANT SELECT ON payment_method_stats TO authenticated;

-- Add comment
COMMENT ON TABLE payments IS 'Payment transactions supporting PayPal, COD, WiPay (coming soon), and Trinidad bank transfers (coming soon)';
