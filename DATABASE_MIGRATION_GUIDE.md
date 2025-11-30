# 🚀 DATABASE MIGRATION GUIDE - STEP BY STEP

## **✅ Your Supabase Dashboard is OPEN!**

### **📋 STEP 1: Open SQL Editor**

1. In your Supabase Dashboard (currently open in browser)
2. Click on your **"trinibuild"** project
3. In the left sidebar, click **"SQL Editor"**
4. Click **"New query"** button

---

## **📝 STEP 2: Run Migration SQL**

### **Copy this COMPLETE SQL:**

```sql
-- TriniBuild Driver Hub Database Schema
-- Run this entire script in Supabase SQL Editor

-- DRIVERS TABLE
CREATE TABLE IF NOT EXISTS public.drivers (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Service activation
  rideshare_enabled boolean DEFAULT false,
  delivery_enabled boolean DEFAULT false,
  courier_enabled boolean DEFAULT false,
  
  -- Real-time status
  status text DEFAULT 'offline' CHECK (status IN ('offline', 'online', 'busy', 'on_break')),
  current_location_lat decimal(10, 8),
  current_location_lng decimal(11, 8),
  last_location_update timestamp with time zone,
  
  -- Vehicle information
  vehicle_type text CHECK (vehicle_type IN ('car', 'motorcycle', 'van', 'truck', 'bicycle')),
  vehicle_make text,
  vehicle_model text,
  vehicle_year integer,
  vehicle_plate text UNIQUE,
  vehicle_color text,
  
  -- Trinidad-specific verification
  license_number text,
  license_expiry date,
  insurance_expiry date,
  is_h_car boolean DEFAULT false,
  h_car_number text,
  background_check_status text DEFAULT 'pending' CHECK (background_check_status IN ('pending', 'approved', 'rejected')),
  
  -- Subscription tier
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'elite')),
  subscription_started_at timestamp with time zone,
  subscription_expires_at timestamp with time zone,
  
  -- Performance stats
  total_rides integer DEFAULT 0,
  total_deliveries integer DEFAULT 0,
  total_courier_jobs integer DEFAULT 0,
  total_jobs integer GENERATED ALWAYS AS (total_rides + total_deliveries + total_courier_jobs) STORED,
  
  rating decimal(3, 2) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  total_ratings integer DEFAULT 0,
  acceptance_rate decimal(5, 2) DEFAULT 100.0,
  cancellation_rate decimal(5, 2) DEFAULT 0.0,
  
  -- Earnings
  total_earnings decimal(12, 2) DEFAULT 0,
  weekly_earnings decimal(10, 2) DEFAULT 0,
  monthly_earnings decimal(10, 2) DEFAULT 0,
  
  -- Payout preferences
  bank_name text,
  bank_account_number text,
  bank_routing_number text,
  payout_method text DEFAULT 'weekly' CHECK (payout_method IN ('instant', 'weekly', 'monthly')),
  payout_email text,
  
  -- Metadata
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_active_at timestamp with time zone
);

-- GIG JOBS TABLE
CREATE TABLE IF NOT EXISTS public.gig_jobs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Job classification
  job_type text NOT NULL CHECK (job_type IN ('rideshare', 'delivery', 'courier')),
  
  -- Participants
  customer_id uuid REFERENCES public.profiles(id) NOT NULL,
  driver_id uuid REFERENCES public.drivers(id),
  store_id uuid REFERENCES public.stores(id),
  
  -- Status workflow
  status text DEFAULT 'searching' CHECK (status IN (
    'searching', 'accepted', 'arriving', 'picked_up', 
    'in_transit', 'near_destination', 'delivered', 'completed', 'cancelled'
  )),
  
  -- Locations
  pickup_location text NOT NULL,
  pickup_lat decimal(10, 8),
  pickup_lng decimal(11, 8),
  pickup_address_details text,
  
  dropoff_location text NOT NULL,
  dropoff_lat decimal(10, 8),
  dropoff_lng decimal(11, 8),
  dropoff_address_details text,
  
  -- Real-time driver tracking
  driver_lat decimal(10, 8),
  driver_lng decimal(11, 8),
  driver_heading decimal(5, 2),
  driver_speed decimal(5, 2),
  last_location_update timestamp with time zone,
  estimated_arrival timestamp with time zone,
  
  -- Pricing structure
  base_price decimal(10, 2) NOT NULL,
  distance_km decimal(6, 2),
  duration_minutes integer,
  surge_multiplier decimal(3, 2) DEFAULT 1.0,
  booking_fee decimal(6, 2) DEFAULT 2.00,
  service_fee decimal(6, 2) DEFAULT 0,
  total_price decimal(10, 2) NOT NULL,
  
  -- Monetization
  commission_rate decimal(5, 2) NOT NULL,
  trinibuild_commission decimal(10, 2) NOT NULL,
  driver_earnings decimal(10, 2) NOT NULL,
  
  -- Payment details
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'mobile_money')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  tip_amount decimal(8, 2) DEFAULT 0,
  promo_code text,
  discount_amount decimal(8, 2) DEFAULT 0,
  
  -- Delivery-specific fields
  order_details jsonb,
  delivery_instructions text,
  contact_on_arrival boolean DEFAULT false,
  leave_at_door boolean DEFAULT false,
  
  -- Courier-specific fields
  package_type text CHECK (package_type IN ('document', 'small_package', 'medium_package', 'large_package', 'fragile')),
  package_weight_kg decimal(6, 2),
  declared_value decimal(10, 2),
  is_fragile boolean DEFAULT false,
  requires_signature boolean DEFAULT false,
  recipient_name text,
  recipient_phone text,
  tracking_code text UNIQUE,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  accepted_at timestamp with time zone,
  pickup_started_at timestamp with time zone,
  picked_up_at timestamp with time zone,
  completed_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  
  -- Ratings & feedback
  customer_rating integer CHECK (customer_rating >= 1 AND customer_rating <= 5),
  customer_feedback text,
  driver_rating integer CHECK (driver_rating >= 1 AND driver_rating <= 5),
  driver_feedback text,
  
  -- Cancellation
  cancelled_by text CHECK (cancelled_by IN ('customer', 'driver', 'system')),
  cancellation_reason text,
  cancellation_fee decimal(8, 2) DEFAULT 0,
  
  -- Admin notes
  notes text,
  flagged boolean DEFAULT false,
  flag_reason text
);

-- DRIVER EARNINGS TABLE
CREATE TABLE IF NOT EXISTS public.driver_earnings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id uuid REFERENCES public.drivers(id) NOT NULL,
  
  -- Earnings period
  period_type text NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  
  -- Job breakdown
  rideshare_jobs integer DEFAULT 0,
  rideshare_earnings decimal(10, 2) DEFAULT 0,
  delivery_jobs integer DEFAULT 0,
  delivery_earnings decimal(10, 2) DEFAULT 0,
  courier_jobs integer DEFAULT 0,
  courier_earnings decimal(10, 2) DEFAULT 0,
  
  -- Additional income
  tips decimal(10, 2) DEFAULT 0,
  bonuses decimal(10, 2) DEFAULT 0,
  surge_earnings decimal(10, 2) DEFAULT 0,
  
  -- Deductions
  trinibuild_commission decimal(10, 2) DEFAULT 0,
  subscription_fee decimal(10, 2) DEFAULT 0,
  instant_payout_fees decimal(10, 2) DEFAULT 0,
  other_deductions decimal(10, 2) DEFAULT 0,
  
  -- Totals
  gross_earnings decimal(12, 2) NOT NULL,
  net_earnings decimal(12, 2) NOT NULL,
  
  -- Payout tracking
  payout_status text DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'paid', 'failed')),
  payout_method text,
  payout_date timestamp with time zone,
  payout_reference text,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- DRIVER DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.driver_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id uuid REFERENCES public.drivers(id) NOT NULL,
  
  document_type text NOT NULL CHECK (document_type IN (
    'drivers_license', 'vehicle_registration', 'insurance', 
    'h_car_permit', 'police_certificate', 'utility_bill'
  )),
  document_url text NOT NULL,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  verified_by uuid REFERENCES public.profiles(id),
  verified_at timestamp with time zone,
  rejection_reason text,
  expires_at date,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gig_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;

-- Drivers policies
DROP POLICY IF EXISTS "Drivers can view their own profile" ON public.drivers;
CREATE POLICY "Drivers can view their own profile"
  ON public.drivers FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Drivers can update their own profile" ON public.drivers;
CREATE POLICY "Drivers can update their own profile"
  ON public.drivers FOR UPDATE
  USING (auth.uid() = id);

-- Gig jobs policies
DROP POLICY IF EXISTS "Customers can view their own jobs" ON public.gig_jobs;
CREATE POLICY "Customers can view their own jobs"
  ON public.gig_jobs FOR SELECT
  USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Drivers can view their assigned jobs" ON public.gig_jobs;
CREATE POLICY "Drivers can view their assigned jobs"
  ON public.gig_jobs FOR SELECT
  USING (auth.uid() = driver_id);

DROP POLICY IF EXISTS "Anyone can create jobs" ON public.gig_jobs;
CREATE POLICY "Anyone can create jobs"
  ON public.gig_jobs FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Drivers can update their assigned jobs" ON public.gig_jobs;
CREATE POLICY "Drivers can update their assigned jobs"
  ON public.gig_jobs FOR UPDATE
  USING (auth.uid() = driver_id);

DROP POLICY IF EXISTS "System can update any job" ON public.gig_jobs;
CREATE POLICY "System can update any job"
  ON public.gig_jobs FOR UPDATE
  USING (true);

-- Earnings policies
DROP POLICY IF EXISTS "Drivers can view their own earnings" ON public.driver_earnings;
CREATE POLICY "Drivers can view their own earnings"
  ON public.driver_earnings FOR SELECT
  USING (auth.uid() = driver_id);

-- Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers(status) WHERE status = 'online';
CREATE INDEX IF NOT EXISTS idx_drivers_location ON public.drivers(current_location_lat, current_location_lng) WHERE status = 'online';
CREATE INDEX IF NOT EXISTS idx_drivers_services ON public.drivers(rideshare_enabled, delivery_enabled, courier_enabled);

CREATE INDEX IF NOT EXISTS idx_gig_jobs_status ON public.gig_jobs(status);
CREATE INDEX IF NOT EXISTS idx_gig_jobs_driver ON public.gig_jobs(driver_id, status);
CREATE INDEX IF NOT EXISTS idx_gig_jobs_customer ON public.gig_jobs(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gig_jobs_type ON public.gig_jobs(job_type, status);
CREATE INDEX IF NOT EXISTS idx_gig_jobs_location ON public.gig_jobs(pickup_lat, pickup_lng) WHERE status = 'searching';

CREATE INDEX IF NOT EXISTS idx_earnings_driver_period ON public.driver_earnings(driver_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_earnings_payout_status ON public.driver_earnings(payout_status) WHERE payout_status = 'pending';
```

---

## **▶️ STEP 3: Execute the SQL**

1. **Paste** the entire SQL above into the SQL Editor
2. **Click "Run"** button (or press Ctrl+Enter)
3. **Wait** for completion (should take 5-10 seconds)

### **Expected Result:**
```
Success. No rows returned
```

---

## **📡 STEP 4: Enable Realtime**

### **Option A: Via SQL** (Recommended)
In the same SQL Editor, run this:

```sql
-- Enable Realtime for live GPS tracking
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.drivers;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.gig_jobs;
```

### **Option B: Via Dashboard**
1. Go to **Database** → **Replication**
2. Find **"drivers"** table → Toggle **ON**
3. Find **"gig_jobs"** table → Toggle **ON**

---

## **✅ STEP 5: Verify Migration**

Run this SQL to check if tables were created:

```sql
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('drivers', 'gig_jobs', 'driver_earnings', 'driver_documents')
ORDER BY table_name;
```

### **Expected Output:**
```
drivers             | 30+
driver_documents    | 9
driver_earnings     | 19
gig_jobs           | 50+
```

---

## **🎉 MIGRATION COMPLETE!**

Your database is now ready for:
- ✅ Driver registration
- ✅ Multi-service job matching
- ✅ Real-time GPS tracking
- ✅ Earnings calculations
- ✅ Payment processing

---

## **🐛 Troubleshooting**

### **Error: "relation profiles does not exist"**
**Solution**: The `drivers` table references `profiles`. Make sure your base schema is set up first.

### **Error: "relation stores does not exist"**
**Solution**: The `gig_jobs` table references `stores` for delivery orders. This is optional - the foreign key will allow NULL values.

### **Error: "permission denied"**
**Solution**: Make sure you're running the SQL as a project owner/admin.

---

## **📊 Next: Test Your Setup**

```sql
-- Test 1: Insert a test driver
INSERT INTO drivers (
  id,
  vehicle_type,
  vehicle_make,
  vehicle_model,
  vehicle_plate,
  rideshare_enabled
)
SELECT 
  id,
  'car',
  'Toyota',
  'Corolla',
  'TEST123',
  true
FROM profiles
LIMIT 1;

-- Test 2: Check if driver was created
SELECT * FROM drivers WHERE vehicle_plate = 'TEST123';

-- Test 3: Delete test data
DELETE FROM drivers WHERE vehicle_plate = 'TEST123';
```

---

**Migration Status: READY TO RUN!** 🚀

Just copy the SQL from STEP 2 into your Supabase SQL Editor and click RUN!
