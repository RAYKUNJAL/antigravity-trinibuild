# 🚗 TriniBuild Driver Hub - Complete Spec

## **Overview**
Unified driver app for Trinidad and Tobago covering 3 gig types:
1. **Rideshare** - Passenger transport
2. **Delivery** - Food & goods delivery
3. **Courier** - Document & package courier services

---

## **💰 MONETIZATION STRUCTURE**

### **Commission Rates (TriniBuild Take)**
| Service Type | Commission | Driver Keeps | Notes |
|--------------|-----------|--------------|-------|
| **Rideshare** | 15% | 85% | Standard ride commission |
| **Delivery** | 20% | 80% | Food/goods delivery |
| **Courier** | 15% | 85% | Documents/packages |
| **Premium Services** | 10% | 90% | Verified drivers, H-Cars |

### **Driver Subscription Tiers**
| Tier | Monthly Fee | Commission Discount | Features |
|------|------------|---------------------|----------|
| **Free** | $0 | 0% | Standard rates, limited to 20 jobs/week |
| **Pro** | $50 TTD | -5% commission | Unlimited jobs, priority matching |
| **Elite** | $100 TTD | -8% commission | All Pro + featured listing, insurance |

### **Additional Revenue Streams**
1. **Booking Fees**: $2-5 TTD per ride (customer pays)
2. **Service Fees**: 8% on delivery orders
3. **Surge Pricing**: 1.5x-3x during peak hours (split 60/40 with driver)
4. **Cancellation Fees**: $10 TTD (80% to driver if they showed up)
5. **Premium Features**:
   - Featured driver listing: $20 TTD/month
   - Ad-free app: $5 TTD/month
   - Advanced analytics: $10 TTD/month

---

## **DRIVER APP FEATURES**

### **1. Service Selection (Multi-Gig)**
```
Drivers can toggle ON/OFF for each service:
□ Rideshare (Passenger Transport)
□ Delivery (Food & Goods)
□ Courier (Documents & Packages)

Can have multiple active simultaneously!
```

### **2. Job Matching System**
- **Smart Routing**: Match based on driver location & selected services
- **Priority Matching**: Pro/Elite drivers get first pick
- **Auto-Accept**: Option to auto-accept jobs matching criteria
- **Reject Tracking**: Too many rejects = lower priority

### **3. Earnings Dashboard**
```
Today:        $250 TTD
This Week:    $1,500 TTD
This Month:   $6,800 TTD

Breakdown:
- Rideshare:  $1,200 (12 rides)
- Delivery:   $800 (25 deliveries)
- Courier:    $500 (8 courier jobs)
- Tips:       $200
- Bonuses:    $100
```

### **4. Real-Time GPS Tracking**
- Live location updates every 5 seconds
- Route optimization
- Traffic alerts
- ETA updates to customers

### **5. In-App Navigation**
- Turn-by-turn directions
- Optimized routes
- Multiple stops (for delivery/courier)

### **6. Payment Management**
- Instant payout option ($5 fee)
- Weekly auto-payout (free)
- Payment history
- Tax documents (1099 equivalent for Trinidad)

---

## **DATABASE SCHEMA**

### **drivers table**
```sql
create table public.drivers (
  id uuid primary key references profiles(id),
  
  -- Service activation
  rideshare_enabled boolean default false,
  delivery_enabled boolean default false,
  courier_enabled boolean default false,
  
  -- Status
  status text default 'offline', -- 'offline', 'online', 'busy', 'on_break'
  current_location_lat decimal(10, 8),
  current_location_lng decimal(11, 8),
  
  -- Vehicle info
  vehicle_type text, -- 'car', 'motorcycle', 'van', 'truck'
  vehicle_make text,
  vehicle_model text,
  vehicle_year integer,
  vehicle_plate text unique,
  vehicle_color text,
  
  -- Verification
  license_number text,
  license_expiry date,
  insurance_expiry date,
  background_check_status text default 'pending',
  is_h_car boolean default false, -- Trinidad H-Car registration
  
  -- Subscription
  subscription_tier text default 'free', -- 'free', 'pro', 'elite'
  subscription_expires_at timestamp with time zone,
  
  -- Stats
  total_rides integer default 0,
  total_deliveries integer default 0,
  total_courier_jobs integer default 0,
  rating decimal(3, 2) default 5.0,
  total_earnings decimal(10, 2) default 0,
  
  -- Payout preferences
  bank_account_number text,
  bank_routing_number text,
  payout_method text default 'weekly', -- 'instant', 'weekly', 'monthly'
  
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### **gig_jobs table** (unified for all job types)
```sql
create table public.gig_jobs (
  id uuid primary key default uuid_generate_v4(),
  
  -- Job type
  job_type text not null, -- 'rideshare', 'delivery', 'courier'
  
  -- Participants
  customer_id uuid references profiles(id) not null,
  driver_id uuid references drivers(id),
  store_id uuid references stores(id), -- for delivery orders
  
  -- Status
  status text default 'searching', 
  -- 'searching', 'accepted', 'picked_up', 'in_transit', 'delivered', 'completed', 'cancelled'
  
  -- Locations
  pickup_location text not null,
  pickup_lat decimal(10, 8),
  pickup_lng decimal(11, 8),
  
  dropoff_location text not null,
  dropoff_lat decimal(10, 8),
  dropoff_lng decimal(11, 8),
  
  -- Real-time tracking
  driver_lat decimal(10, 8),
  driver_lng decimal(11, 8),
  last_location_update timestamp with time zone,
  
  -- Pricing
  base_price decimal(10, 2) not null,
  surge_multiplier decimal(3, 2) default 1.0,
  service_fee decimal(10, 2) default 0,
  total_price decimal(10, 2) not null,
  
  -- Monetization
  trinibuild_commission decimal(10, 2), -- Our cut
  driver_earnings decimal(10, 2), -- Driver's cut
  commission_rate decimal(5, 2), -- Percentage (15%, 20%, etc.)
  
  -- Payment
  payment_method text default 'cash',
  payment_status text default 'pending', -- 'pending', 'paid', 'refunded'
  tip_amount decimal(10, 2) default 0,
  
  -- Delivery specific
  order_details jsonb, -- For food/goods orders
  special_instructions text,
  
  -- Courier specific
  package_type text, -- 'document', 'small_package', 'large_package'
  package_weight decimal(5, 2),
  is_fragile boolean default false,
  requires_signature boolean default false,
  
  -- Timing
  created_at timestamp with time zone default now(),
  accepted_at timestamp with time zone,
  picked_up_at timestamp with time zone,
  completed_at timestamp with time zone,
  estimated_completion timestamp with time zone,
  
  -- Metadata
  cancellation_reason text,
  customer_rating integer, -- 1-5
  driver_rating integer, -- 1-5
  notes text
);
```

### **earnings table** (for payouts)
```sql
create table public.driver_earnings (
  id uuid primary key default uuid_generate_v4(),
  driver_id uuid references drivers(id) not null,
  
  -- Earnings period
  period_start date not null,
  period_end date not null,
  
  -- Breakdown
  rideshare_earnings decimal(10, 2) default 0,
  delivery_earnings decimal(10, 2) default 0,
  courier_earnings decimal(10, 2) default 0,
  tips decimal(10, 2) default 0,
  bonuses decimal(10, 2) default 0,
  
  -- Deductions
  trinibuild_commission decimal(10, 2) default 0,
  subscription_fee decimal(10, 2) default 0,
  instant_payout_fees decimal(10, 2) default 0,
  
  -- Totals
  gross_earnings decimal(10, 2) not null,
  net_earnings decimal(10, 2) not null,
  
  -- Payout
  payout_status text default 'pending', -- 'pending', 'processing', 'paid'
  payout_method text,
  payout_date timestamp with time zone,
  
  created_at timestamp with time zone default now()
);
```

---

## **COMMISSION CALCULATION LOGIC**

```typescript
function calculateEarnings(job: GigJob, driver: Driver) {
  let commissionRate = 0.15; // Default 15%
  
  // Set rate based on job type
  if (job.job_type === 'rideshare') {
    commissionRate = 0.15;
  } else if (job.job_type === 'delivery') {
    commissionRate = 0.20;
  } else if (job.job_type === 'courier') {
    commissionRate = 0.15;
  }
  
  // Premium service discount
  if (driver.is_h_car && job.job_type === 'rideshare') {
    commissionRate = 0.10;
  }
  
  // Subscription discount
  if (driver.subscription_tier === 'pro') {
    commissionRate -= 0.05;
  } else if (driver.subscription_tier === 'elite') {
    commissionRate -= 0.08;
  }
  
  // Calculate
  const totalPrice = job.base_price * job.surge_multiplier;
  const commission = totalPrice * commissionRate;
  const driverEarnings = totalPrice - commission + job.tip_amount;
  
  return {
    total_price: totalPrice,
    trinibuild_commission: commission,
    driver_earnings: driverEarnings,
    commission_rate: commissionRate
  };
}
```

---

## **TECH STACK**

### **Option 1: Progressive Web App (PWA)**
- React + TypeScript
- Works on all phones (iOS + Android)
- Installable like native app
- Push notifications via Firebase
- Offline mode support
- **Timeline**: 2-3 weeks
- **Cost**: $0 (already have infrastructure)

### **Option 2: React Native (Hybrid)**
- Single codebase for iOS + Android
- Better GPS performance
- Background location tracking
- Native feel
- **Timeline**: 4-6 weeks
- **Cost**: $99/year (Apple Developer) + $25 (Google Play)

### **Option 3: Native Apps (Best)**
- Swift (iOS) + Kotlin (Android)
- Best performance
- Best battery life
- Most features
- **Timeline**: 8-12 weeks
- **Cost**: $99/year + $25 + development time

**RECOMMENDATION**: Start with **PWA** (fastest), then upgrade to React Native later

---

## **REVENUE PROJECTIONS (Trinidad Market)**

### **Conservative Estimates:**
- **Active Drivers**: 100
- **Jobs per Driver per Day**: 5
- **Average Job Value**: $30 TTD
- **Average Commission**: 17.5%

**Monthly Revenue**:
```
100 drivers × 5 jobs × 30 days × $30 × 17.5% = $78,750 TTD/month
≈ $11,600 USD/month

Add subscription fees:
50 drivers × $50 (Pro) = $2,500 TTD
10 drivers × $100 (Elite) = $1,000 TTD

Total: ~$82,250 TTD/month ($12,100 USD)
```

### **At Scale (1000 drivers)**:
```
$822,500 TTD/month ≈ $121,000 USD/month
```

---

## **NEXT STEPS**

1. ✅ Build Driver Hub web dashboard (2 days)
2. ✅ Update database schema (1 day)
3. ✅ Implement commission logic (1 day)
4. ✅ Build earnings tracking (1 day)
5. ✅ Create driver onboarding flow (1 day)
6. [ ] Build PWA driver app (1-2 weeks)
7. [ ] Add payment integration (WiPay) (3 days)
8. [ ] Testing with beta drivers (1 week)
9. [ ] Launch! 🚀

---

**Want me to start building now?** I'll create:
1. Driver Hub dashboard page
2. Database schema updates
3. Driver service with monetization logic
4. Earnings tracking system

Just say the word! 🚀
