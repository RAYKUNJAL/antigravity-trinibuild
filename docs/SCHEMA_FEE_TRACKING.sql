/**
 * TRINIBUILD FEE & REVENUE TRACKING SCHEMA
 * 
 * Tables needed:
 * 1. order_revenue - Track fees per order
 * 2. merchant_monthly_revenue - Monthly summaries
 * 3. trinibuild_monthly_revenue - Platform revenue
 * 4. fee_configurations - Configurable fee rates
 * 5. merchant_payouts - Payout requests and history
 */

-- Create fee configurations table
CREATE TABLE IF NOT EXISTS fee_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_type varchar NOT NULL UNIQUE, -- 'platform', 'delivery', 'card', 'bank'
  fee_percentage numeric(5, 4),    -- e.g., 0.0500 = 5%
  fee_fixed numeric(10, 2),         -- Fixed amount (e.g., 10 TTD)
  currency varchar DEFAULT 'TTD',
  effective_date timestamp DEFAULT now(),
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create order revenue tracking table
CREATE TABLE IF NOT EXISTS order_revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  store_id uuid REFERENCES stores(id),
  merchant_id uuid REFERENCES auth.users(id),
  
  -- Order details
  order_total numeric(10, 2) NOT NULL,
  payment_method varchar,  -- 'cod', 'card', 'bank_transfer', 'paypal'
  
  -- Fee breakdown
  trinibuild_fee numeric(10, 2),     -- 5% platform fee
  delivery_fee numeric(10, 2),       -- TriniRides fee
  payment_fee numeric(10, 2),        -- Payment processor fee
  
  -- Merchant earnings
  merchant_earnings numeric(10, 2),  -- total - all fees
  
  currency varchar DEFAULT 'TTD',
  status varchar DEFAULT 'completed',  -- completed, failed, refunded
  
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create merchant monthly revenue table
CREATE TABLE IF NOT EXISTS merchant_monthly_revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid UNIQUE REFERENCES stores(id),
  merchant_id uuid REFERENCES auth.users(id),
  period varchar NOT NULL,  -- YYYY-MM format
  
  -- Aggregates
  total_order_value numeric(10, 2),
  order_count integer,
  
  -- Fees
  trinibuild_fees numeric(10, 2),
  delivery_fees numeric(10, 2),
  payment_fees numeric(10, 2),
  
  -- Earnings
  merchant_earnings numeric(10, 2),
  vat_amount numeric(10, 2),         -- 12.5%
  green_fund_levy numeric(10, 2),    -- 0.3%
  business_levy numeric(10, 2),      -- 0.2%
  total_tax numeric(10, 2),
  
  -- Payout
  net_payout numeric(10, 2),         -- earnings - tax
  
  status varchar DEFAULT 'pending',  -- pending, approved, paid
  
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  
  UNIQUE(store_id, period)
);

-- Create platform revenue table
CREATE TABLE IF NOT EXISTS trinibuild_monthly_revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period varchar UNIQUE NOT NULL,  -- YYYY-MM
  
  -- Platform revenue streams
  platform_fees numeric(10, 2),        -- 5% from orders
  delivery_commission numeric(10, 2),  -- Cut from TriniRides
  payment_processing numeric(10, 2),   -- Stripe/PayPal fees
  subscription_revenue numeric(10, 2), -- Pro plans
  
  total_revenue numeric(10, 2),
  
  -- Costs
  operating_costs numeric(10, 2),
  net_profit numeric(10, 2),
  
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create merchant payouts table
CREATE TABLE IF NOT EXISTS merchant_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id),
  merchant_id uuid REFERENCES auth.users(id),
  period varchar NOT NULL,  -- Which period this payout covers
  
  -- Payout details
  gross_earnings numeric(10, 2),
  tax_amount numeric(10, 2),
  payout_amount numeric(10, 2),      -- After tax
  
  -- Bank details
  bank_account jsonb,  -- {accountNumber, bankName, accountName}
  
  -- Status & tracking
  status varchar DEFAULT 'pending',  -- pending, approved, processing, completed, rejected
  requested_at timestamp DEFAULT now(),
  approved_at timestamp,
  processed_at timestamp,
  completed_at timestamp,
  
  -- Proof
  payment_reference varchar,
  payment_date date,
  notes text,
  
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create tax records for compliance
CREATE TABLE IF NOT EXISTS tax_compliance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid REFERENCES auth.users(id),
  store_id uuid REFERENCES stores(id),
  period varchar NOT NULL,  -- YYYY-MM
  
  -- Tax breakdown
  gross_earnings numeric(10, 2),
  vat_12_5 numeric(10, 2),
  green_fund_levy_0_3 numeric(10, 2),
  business_levy_0_2 numeric(10, 2),
  total_tax_payable numeric(10, 2),
  
  -- Submission status
  bir_submitted boolean DEFAULT false,
  bir_submission_date date,
  bir_reference varchar,
  
  -- Documents
  csv_export_url text,
  
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  
  UNIQUE(store_id, period)
);

-- Indexes for performance
CREATE INDEX idx_order_revenue_store ON order_revenue(store_id);
CREATE INDEX idx_order_revenue_merchant ON order_revenue(merchant_id);
CREATE INDEX idx_order_revenue_created ON order_revenue(created_at);
CREATE INDEX idx_merchant_monthly_store ON merchant_monthly_revenue(store_id);
CREATE INDEX idx_merchant_monthly_period ON merchant_monthly_revenue(period);
CREATE INDEX idx_merchant_payouts_store ON merchant_payouts(store_id);
CREATE INDEX idx_merchant_payouts_status ON merchant_payouts(status);
CREATE INDEX idx_tax_records_merchant ON tax_compliance_records(merchant_id);
CREATE INDEX idx_tax_records_period ON tax_compliance_records(period);

-- Default fee configurations
INSERT INTO fee_configurations (fee_type, fee_percentage, fee_fixed, notes) VALUES
  ('platform', 0.0500, NULL, 'TriniBuild 5% platform fee on all orders'),
  ('card', 0.0290, 10.00, 'Stripe: 2.9% + TT$10 per transaction'),
  ('paypal', 0.0490, 20.00, 'PayPal: 4.9% + TT$20 per transaction'),
  ('bank', 0.0000, 50.00, 'Bank transfer: TT$50 daily batch fee')
ON CONFLICT (fee_type) DO NOTHING;

-- Row-level security policies
ALTER TABLE order_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_monthly_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_compliance_records ENABLE ROW LEVEL SECURITY;

-- Policy: Merchants can only see their own revenue
CREATE POLICY "Merchants view own revenue" ON order_revenue
  FOR SELECT USING (merchant_id = auth.uid());

CREATE POLICY "Merchants view own monthly revenue" ON merchant_monthly_revenue
  FOR SELECT USING (merchant_id = auth.uid());

CREATE POLICY "Merchants view own payouts" ON merchant_payouts
  FOR SELECT USING (merchant_id = auth.uid());

CREATE POLICY "Merchants view own tax records" ON tax_compliance_records
  FOR SELECT USING (merchant_id = auth.uid());

-- Policy: Admins can see all revenue
CREATE POLICY "Admins view all revenue" ON order_revenue
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));
