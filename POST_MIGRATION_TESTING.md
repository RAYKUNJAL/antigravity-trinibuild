# 🧪 POST-MIGRATION TESTING CHECKLIST

## **✅ DATABASE IS LIVE - NOW TEST IT!**

### **🚀 IMMEDIATE TESTING (Next 30 minutes)**

---

## **TEST 1: Driver Signup Flow** ⏱️ 5 minutes

### **Steps:**
1. Run `npm run dev` (if not already running)
2. Open: `http://localhost:3000/drive/signup`
3. Fill out the registration form:
   - **Vehicle**: Toyota Corolla 2020, Plate PBX9999
   - **License**: TT123456, Expiry: 2026-12-31
   - **Services**: ✅ Rideshare, ✅ Delivery, ✅ Courier
   - **Bank**: First Citizens Bank, Account: 1234567890
4. Click "Complete Registration"

### **Expected Result:**
✅ Redirects to `/driver/hub`  
✅ Driver record created in database  
✅ No console errors  

### **Verify in Supabase:**
```sql
SELECT * FROM drivers ORDER BY created_at DESC LIMIT 1;
```
Should show your new driver with PBX9999 plate!

---

## **TEST 2: Driver Hub Dashboard** ⏱️ 3 minutes

### **Steps:**
1. Should already be at `/driver/hub` after signup
2. Click the **Online/Offline toggle** (should turn GREEN)
3. Check that service buttons appear
4. View earnings dashboard (should show $0 initially)

### **Expected Result:**
✅ Toggle works smoothly  
✅ Status changes to "online" in database  
✅ Service toggles visible  
✅ No errors in console  

### **Verify in Supabase:**
```sql
SELECT status, rideshare_enabled, delivery_enabled, courier_enabled 
FROM drivers 
WHERE vehicle_plate = 'PBX9999';
```
Should show: `status: 'online'`, all services: `true`

---

## **TEST 3: Customer Booking** ⏱️ 5 minutes

### **Steps:**
1. Open **NEW INCOGNITO WINDOW**: `http://localhost:3000/rides`
2. Allow GPS when prompted (or it will default to Port of Spain)
3. Enter:
   - **Pickup**: Woodbrook, Port of Spain
   - **Dropoff**: Piarco Airport
4. Select **Economy** ride
5. Click "Confirm Ride"

### **Expected Result:**
✅ Shows "Finding Driver..." (3 seconds)  
✅ Driver found (simulated driver appears)  
✅ Map shows driver marker  
✅ Driver moves toward pickup  
✅ Distance/ETA updates  

### **Verify in Supabase:**
```sql
SELECT * FROM gig_jobs ORDER BY created_at DESC LIMIT 1;
```
Should show new job with:
- `job_type: 'rideshare'`
- `status: 'accepted'` or `'searching'`
- `pickup_location: 'Woodbrook, Port of Spain'`

---

## **TEST 4: Real-Time Sync** ⏱️ 3 minutes

### **Two Browsers Test:**

**Browser 1 (Driver):**
- `http://localhost:3000/driver/hub`
- Toggle **ONLINE**
- Wait for jobs

**Browser 2 (Customer - Incognito):**
- `http://localhost:3000/rides`
- Book a ride

### **Expected Result:**
✅ Browser 1 sees new job appear instantly (Realtime working!)  
✅ Browser 2 sees driver accept  
✅ Both see live location updates  
✅ Both see status changes  

---

## **TEST 5: Trinidad Pricing** ⏱️ 2 minutes

### **Open Browser Console:**
```javascript
// Test pricing calculator
import { trinidadPricing } from './services/trinidadPricing';

// 5km Economy ride, 15 minutes
const test1 = trinidadPricing.calculateFare('rideshare', 'economy', 5, 15);
console.log('5km Economy:', test1);

// Expected:
// actual_fare: ~$52.50 TTD
// driver_earnings: ~$42.00 (80%)
// commission: ~$10.50 (20%)
```

### **Expected Result:**
✅ Calculations match Trinidad market rates  
✅ Commission splits correctly  
✅ Minimum fare applies when needed  

---

## **TEST 6: Multi-Service Toggle** ⏱️ 2 minutes

### **In Driver Hub:**
1. Toggle **OFF** Rideshare
2. Toggle **ON** Delivery only
3. Check available jobs

### **Expected Result:**
✅ Database updates instantly  
✅ Only delivery jobs show in feed  
✅ Rideshare jobs don't appear  

### **Verify:**
```sql
SELECT rideshare_enabled, delivery_enabled, courier_enabled 
FROM drivers 
WHERE vehicle_plate = 'PBX9999';
```

---

## **TEST 7: GPS Location Updates** ⏱️ 3 minutes

### **Steps:**
1. Driver accepts a job
2. Watch driver marker on customer's map
3. Check console for location updates

### **Expected Result:**
✅ Driver location updates every ~100ms  
✅ Map marker moves smoothly  
✅ Distance/ETA recalculates  

### **Verify in Supabase:**
```sql
SELECT driver_lat, driver_lng, last_location_update 
FROM gig_jobs 
WHERE status IN ('accepted', 'in_transit')
ORDER BY created_at DESC 
LIMIT 1;
```
Should see coordinates updating!

---

## **TEST 8: Mobile Responsive** ⏱️ 3 minutes

### **Chrome DevTools:**
1. Press **F12**
2. Click device toolbar icon
3. Test on:
   - iPhone 12 Pro (390x844)
   - Samsung Galaxy (360x640)

### **Check:**
✅ Driver Hub UI fits properly  
✅ Buttons are tappable  
✅ Map zooms/pans smoothly  
✅ Forms are easy to fill  

---

## **TEST 9: Error Handling** ⏱️ 2 minutes

### **Test Cases:**
1. Try booking without GPS permission → Should default to Port of Spain
2. Try accessing Driver Hub without login → Should redirect to auth
3. Try updating another driver's profile → Should be blocked by RLS

### **Expected Result:**
✅ Graceful error messages  
✅ No crashes  
✅ Security policies working  

---

## **TEST 10: WiPay Payment (Mock)** ⏱️ 2 minutes

### **In Booking Flow:**
1. Select "Pay with Card"
2. WiPay widget appears (mock in dev mode)
3. Click "Pay with WiPay (Mock)"

### **Expected Result:**
✅ Mock payment widget shows  
✅ Amount displays correctly (TTD)  
✅ Payment success message  
✅ Job status updates  

### **Console Should Show:**
```
[WiPay Mock] Payment created: {...}
[WiPay Mock] Transaction: MOCK_1234...
```

---

## **✅ FINAL VERIFICATION QUERIES**

### **Run these in Supabase SQL Editor:**

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('drivers', 'gig_jobs', 'driver_earnings', 'driver_documents');

-- Check Realtime is enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('drivers', 'gig_jobs');

-- Count records
SELECT 
  (SELECT COUNT(*) FROM drivers) as driver_count,
  (SELECT COUNT(*) FROM gig_jobs) as job_count;
```

---

## **🎯 SUCCESS CRITERIA**

### **All Tests Pass? You're READY TO LAUNCH! 🚀**

✅ Driver signup works end-to-end  
✅ Driver Hub dashboard functional  
✅ Customer booking flow complete  
✅ Real-time GPS tracking working  
✅ Trinidad pricing calculates correctly  
✅ Multi-service toggles work  
✅ Database updates in real-time  
✅ Mobile responsive  
✅ Security policies enforced  
✅ WiPay mock payments work  

---

## **📊 TESTING RESULTS**

| Test | Status | Notes |
|------|--------|-------|
| Driver Signup | ⬜ | |
| Driver Hub | ⬜ | |
| Customer Booking | ⬜ | |
| Real-Time Sync | ⬜ | |
| Trinidad Pricing | ⬜ | |
| Multi-Service | ⬜ | |
| GPS Updates | ⬜ | |
| Mobile UI | ⬜ | |
| Error Handling | ⬜ | |
| WiPay Mock | ⬜ | |

---

## **🐛 COMMON ISSUES & FIXES**

### **Issue: "User not authenticated"**
**Fix**: Sign up/login first at `/auth`

### **Issue: Map not loading**
**Fix**: Check browser console, allow location permission

### **Issue: Driver not found**
**Fix**: Make sure driver is ONLINE in Driver Hub

### **Issue: No real-time updates**
**Fix**: Verify Realtime is enabled for tables in Supabase

### **Issue: Pricing seems wrong**
**Fix**: Check time of day (surcharges may apply)

---

## **🚨 IF TESTS FAIL**

1. Check browser console for errors
2. Check Supabase logs
3. Verify tables exist in database
4. Ensure Realtime is enabled
5. Check RLS policies

---

## **✅ AFTER ALL TESTS PASS:**

### **Next Steps:**
1. ✅ Add WiPay credentials (`.env.local`)
2. ✅ Deploy to production (Vercel)
3. ✅ Start driver recruitment
4. ✅ Launch marketing campaign!

---

**READY TO TEST? START WITH TEST 1!** 🚀

**Estimated Total Testing Time: 30 minutes**

Track your progress by checking boxes as you go!
