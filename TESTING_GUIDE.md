# 🧪 TriniBuild Go - Complete Testing Guide

## **Pre-Launch Testing Checklist**

### **Phase 1: Database Setup** ✅

```bash
# 1. Run migrations in Supabase SQL Editor
# Copy contents of: supabase/migrations/04_driver_hub_schema.sql
# Run in Supabase Dashboard → SQL Editor

# 2. Enable Realtime
# Go to: Database → Replication
# Toggle ON for:
- ✅ drivers
- ✅ gig_jobs  
- ✅ rides

# 3. Verify tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('drivers', 'gig_jobs', 'driver_earnings', 'driver_documents');
```

---

## **Phase 2: Driver Registration Flow**

### **Test Case 1: New Driver Signup**

**URL**: `http://localhost:3000/drive/signup`

**Steps:**
1. ✅ Open signup page
2. ✅ Fill Step 1 (Vehicle Info):
   - Type: Car
   - Make: Toyota
   - Model: Corolla
   - Year: 2020
   - Plate: PBX 1234
   - Color: White
   - ✅ Check "I have H-Car" (optional)
3. ✅ Click Continue

4. ✅ Fill Step 2 (License):
   - License Number: TT123456
   - Expiry: 2026-12-31
5. ✅ Click Continue

6. ✅ Select Services (Step 3):
   - ✅ Rideshare
   - ✅ Delivery
   - ✅ Courier
7. ✅ Click Continue

8. ✅ Fill Step 4 (Bank Info):
   - Bank: First Citizens Bank
   - Account: 1234567890
9. ✅ Click "Complete Registration"

**Expected Result:**
- ✅ Redirects to `/driver/hub`
- ✅ Driver record created in database
- ✅ Status: offline
- ✅ All 3 services enabled

**Verify in Database:**
```sql
SELECT * FROM drivers WHERE vehicle_plate = 'PBX 1234';
```

---

### **Test Case 2: Driver Goes Online**

**URL**: `http://localhost:3000/driver/hub`

**Steps:**
1. ✅ Click big Online/Offline toggle
2. ✅ Toggle turns green
3. ✅ Service buttons appear below
4. ✅ "Looking for jobs..." message shows

**Expected Result:**
- ✅ Status in DB changes to 'online'
- ✅ Service toggle buttons visible
- ✅ Available jobs feed appears

**Verify:**
```sql
SELECT status FROM drivers WHERE vehicle_plate = 'PBX 1234';
-- Should return: 'online'
```

---

## **Phase 3: Customer Booking Flow**

### **Test Case 3: Book a Rideshare**

**Setup:**
- Have 1 driver online
- Open in different browser/incognito: `http://localhost:3000/rides`

**Steps:**
1. ✅ Allow GPS when prompted
2. ✅ Enter pickup: "Woodbrook, Port of Spain"
3. ✅ Enter dropoff: "Piarco Airport"
4. ✅ Select ride type: "Economy"
5. ✅ Click "Confirm Ride"

**Expected Result:**
- ✅ Shows "Finding Driver..." (3 seconds)
- ✅ Driver found: "David R." (mock driver)
- ✅ Car marker appears on map
- ✅ Car moves toward pickup location
- ✅ Distance/ETA updates in real-time
- ✅ After 15s: "Driver has Arrived!"

**Verify in Database:**
```sql
SELECT * FROM gig_jobs WHERE job_type = 'rideshare' ORDER BY created_at DESC LIMIT 1;
-- Check:
-- status: 'accepted' → 'in_transit' → 'completed'
-- driver_lat, driver_lng updating
```

---

## **Phase 4: Real-Time Testing**

### **Test Case 4: Two-Browser Real-Time Sync**

**Browser 1 (Driver):**
- http://localhost:3000/driver/hub
- Go online
- Wait for job

**Browser 2 (Customer):**
- http://localhost:3000/rides
- Book a ride

**Expected:**
- ✅ Browser 1 shows new job card instantly
- ✅ Driver can accept job
- ✅ Browser 2 sees "Driver Accepted"
- ✅ Both see live location updates
- ✅ Both see status changes in real-time

---

## **Phase 5: Pricing Calculator Testing**

### **Test Case 5: Trinidad Pricing Accuracy**

```typescript
// Test in browser console or Node.js
import { trinidadPricing } from './services/trinidadPricing';

// Test 1: Economy ride - 5km, 15 minutes
const test1 = trinidadPricing.calculateFare('rideshare', 'economy', 5, 15);
console.log('Test 1:', test1);
// Expected:
// total_fare: $52.50 (Base $15 + Distance $22.50 + Time $15)
// driver_earnings: $42.00 (80%)
// commission: $10.50 (20%)

// Test 2: Premium ride - 10km, 30 minutes (Night)
// Run between 10pm-5am
const test2 = trinidadPricing.calculateFare('rideshare', 'premium', 10, 30);
console.log('Test 2:', test2);
// Expected:
// base_fare: $30
// distance: $60 (10km × $6)
// time: $45 (30min × $1.5)
// subtotal: $135
// night surcharge: +25% = $168.75
// commission (25%): $42.19
// driver_earnings: $126.56

// Test 3: Food delivery
const test3 = trinidadPricing.calculateFare('delivery', 'food', 3, 10);
console.log('Test 3:', test3);
// Expected:
// base: $12
// distance: $10.50
// time: $7
// minimum: $18 (applied)
// commission (25%): $4.50
// driver: $13.50
```

---

## **Phase 6: WiPay Payment Testing**

### **Test Case 6: Mock Payment**

**Steps:**
1. ✅ Book a ride
2. ✅ Select "Pay with Card"
3. ✅ WiPay widget appears (mock in dev mode)
4. ✅ Click "Pay with WiPay (Mock)"
5. ✅ Payment success message

**Expected:**
```javascript
// Console should show:
[WiPay Mock] Payment created: {
  amount: 50.00,
  currency: 'TTD',
  orderNumber: 'RIDE-123',
  description: 'Rideshare from Woodbrook to Airport'
}

[WiPay Mock] Transaction: MOCK_1234567890
```

**Test Production Mode:**
```bash
# In .env.local, set:
VITE_WIPAY_SANDBOX=false
VITE_WIPAY_API_KEY=sk_test_xxx
VITE_WIPAY_MERCHANT_ID=merchant_xxx

# Then test again - should redirect to real WiPay page
```

---

## **Phase 7: Multi-Service Testing**

### **Test Case 7: Driver Toggles Services**

**Steps:**
1. ✅ Driver Hub: Toggle OFF "Rideshare"
2. ✅ Toggle ON "Delivery"
3. ✅ Toggle ON "Courier"

**Expected:**
- ✅ Only delivery/courier jobs show in feed
- ✅ Rideshare requests don't appear
- ✅ Database updated instantly

**Verify:**
```sql
SELECT rideshare_enabled, delivery_enabled, courier_enabled 
FROM drivers 
WHERE vehicle_plate = 'PBX 1234';
-- Should match toggle states
```

---

## **Phase 8: Earnings Calculation**

### **Test Case 8: Complete Job & Verify Earnings**

**Steps:**
1. ✅ Driver accepts $50 job (Economy rideshare)
2. ✅ Complete the job
3. ✅ Check earnings dashboard

**Expected:**
```
Commission: 20% = $10
Driver Earns: $40

Dashboard shows:
- Today: +$40
- Total Jobs: +1
- Total Rides: +1
```

**Verify:**
```sql
-- Check job record
SELECT 
  total_price, 
  commission_rate, 
  trinibuild_commission, 
  driver_earnings 
FROM gig_jobs 
WHERE id = 'job-id-here';

-- Expected:
-- total_price: 50.00
-- commission_rate: 20.00
-- trinibuild_commission: 10.00
-- driver_earnings: 40.00

-- Check driver total
SELECT total_earnings, total_rides FROM drivers WHERE vehicle_plate = 'PBX 1234';
-- total_earnings should increase by $40
```

---

## **Phase 9: Edge Cases & Error Handling**

### **Test Case 9: GPS Permission Denied**

**Steps:**
1. ✅ Go to /rides
2. ✅ Click "Block" on GPS permission
3. ✅ Try to book ride

**Expected:**
- ✅ Map centers on Port of Spain (default)
- ✅ Pickup field says "Please enter address"
- ✅ Can still type address manually
- ✅ Booking works without GPS

---

### **Test Case 10: No Drivers Online**

**Steps:**
1. ✅ Ensure all drivers are offline
2. ✅ Try to book ride

**Expected:**
- ✅ Shows "Finding Driver..." message
- ✅ Eventually times out (or keeps searching)
- ✅ No errors in console

---

### **Test Case 11: Driver Cancels**

**Steps:**
1. ✅ Driver accepts job
2. ✅ Click "Cancel Ride" button

**Expected:**
- ✅ Job status → 'cancelled'
- ✅ Driver goes back to 'online'
- ✅ Available jobs refresh
- ✅ Customer sees cancellation message

---

## **Phase 10: Performance Testing**

### **Test Case 12: Load Test**

**Use Artillery or similar tool:**

```bash
npm install -g artillery

# Create test config: artillery-test.yml
artillery run artillery-test.yml
```

**artillery-test.yml:**
```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Browse rides page"
    flow:
      - get:
          url: "/rides"
  - name: "Visit driver hub"
    flow:
      - get:
          url: "/driver/hub"
```

**Expected:**
- ✅ Page loads < 2 seconds
- ✅ No crashes
- ✅ Database connections stable

---

## **Phase 11: Mobile Testing**

### **Test Case 13: Mobile Responsive**

**Devices to Test:**
- iPhone 12/13 (Safari)
- Samsung Galaxy (Chrome)
- iPad (Safari)

**Check:**
- ✅ Driver Hub UI fits on mobile
- ✅ Toggle buttons work on touch
- ✅ Map zooms/pans smoothly
- ✅ Forms are easy to fill
- ✅ Buttons are big enough to tap

**Tools:**
```bash
# Chrome DevTools
F12 → Toggle Device Toolbar
# Test at:
# - 375x667 (iPhone SE)
# - 390x844 (iPhone 12 Pro)
# - 360x640 (Samsung Galaxy)
```

---

## **Phase 12: Security Testing**

### **Test Case 14: Unauthorized Access**

**Steps:**
1. ✅ Log out
2. ✅ Try to access `/driver/hub`

**Expected:**
- ✅ Redirects to `/auth` login page
- ✅ Cannot view driver data
- ✅ Cannot accept jobs

**Test SQL Injection:**
```javascript
// Try malicious input in forms
vehiclePlate: "PBX'; DROP TABLE drivers;--"
```
**Expected:**
- ✅ Supabase RLS blocks it
- ✅ Input sanitized
- ✅ No database damage

---

## **Automated Testing Script**

Create `tests/e2e-test.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('Complete driver flow', async ({ page }) => {
  // 1. Driver signup
  await page.goto('http://localhost:3000/drive/signup');
  
  // Step 1: Vehicle
  await page.fill('[name="vehicleMake"]', 'Toyota');
  await page.fill('[name="vehicleModel"]', 'Corolla');
  await page.fill('[name="vehiclePlate"]', 'TEST123');
  await page.click('text=Continue');
  
  // Step 2: License
  await page.fill('[name="licenseNumber"]', 'TT999999');
  await page.fill('[name="licenseExpiry"]', '2026-12-31');
  await page.click('text=Continue');
  
  // Step 3: Services
  await page.click('text=Rideshare');
  await page.click('text=Continue');
  
  // Step 4: Bank
  await page.selectOption('[name="bankName"]', 'First Citizens Bank');
  await page.fill('[name="bankAccountNumber"]', '1234567890');
  await page.click('text=Complete Registration');
  
  // Should redirect to driver hub
  await expect(page).toHaveURL('/driver/hub');
  
  // 2. Go online
  await page.click('button[aria-label="Toggle online"]');
  
  // Verify online
  await expect(page.locator('text=ON')).toBeVisible();
});

test('Complete booking flow', async ({ page }) => {
  await page.goto('http://localhost:3000/rides');
  
  // Allow GPS (mock)
  await page.evaluate(() => {
    navigator.geolocation.getCurrentPosition = (success) => {
      success({
        coords: { latitude: 10.652, longitude: -61.514 }
      });
    };
  });
  
  // Book ride
  await page.fill('[name="dropoff"]', 'Piarco Airport');
  await page.click('text=Confirm Ride');
  
  // Wait for driver match
  await expect(page.locator('text=Driver Found')).toBeVisible({ timeout: 5000 });
});
```

**Run tests:**
```bash
npm install -D @playwright/test
npx playwright test
```

---

## **Final Pre-Launch Checklist**

### **Database:**
- [ ] All migrations run successfully
- [ ] Realtime enabled for critical tables
- [ ] Row-level security policies working
- [ ] Indexes created for performance

### **Features:**
- [ ] Driver signup works end-to-end
- [ ] Driver can go online/offline
- [ ] Driver can toggle services
- [ ] Jobs appear in real-time
- [ ] GPS tracking works
- [ ] Pricing calculates correctly
- [ ] Payments process (or mock in dev)

### **UI/UX:**
- [ ] Mobile responsive
- [ ] Fast load times (< 2s)
- [ ] No console errors
- [ ] Smooth animations
- [ ] Clear error messages

### **Security:**
- [ ] Authentication required
- [ ] RLS policies prevent unauthorized access
- [ ] Input validation working
- [ ] No sensitive data exposed

### **Documentation:**
- [ ] README updated
- [ ] API keys documented
- [ ] Setup instructions clear
- [ ] Troubleshooting guide available

---

## **Production Smoke Tests**

**After deploying to production:**

```bash
# Test URLs
✅ https://trinibuild.com/drive/signup
✅ https://trinibuild.com/driver/hub  
✅ https://trinibuild.com/rides

# Check:
- SSL certificate valid
- All pages load
- No 404 errors
- Database connected
- Realtime working
- Payments processing
```

---

**All tests passing? YOU'RE READY TO LAUNCH! 🚀**
