# 🚀 QUICK SETUP GUIDE - Run This ONE SQL File

## ✅ **ONE FILE TO RULE THEM ALL**

I've created a **single combined SQL file** that sets up your entire system!

---

## 📁 **File Location:**
```
supabase/COMPLETE_SYSTEM_UPDATE.sql
```

---

## 🎯 **What This File Does:**

Sets up **3 complete systems** in one go:

1. **Viral Loops V1** - Basic referral system
2. **Viral Loops V2** - Tiered rewards (4 levels)
3. **Onboarding Flow** - 7-step user onboarding

**Total:** 19 tables + 10 functions + triggers + RLS policies

---

## 📋 **How to Run (3 Easy Steps):**

### **Step 1: Open Supabase**
1. Go to your Supabase Dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### **Step 2: Copy & Paste**
1. Open `supabase/COMPLETE_SYSTEM_UPDATE.sql` in your code editor
2. Press **Ctrl+A** (select all)
3. Press **Ctrl+C** (copy)
4. Go back to Supabase SQL Editor
5. Press **Ctrl+V** (paste)

### **Step 3: Run It!**
1. Click the **Run** button (or press **Ctrl+Enter**)
2. Wait 10-15 seconds for completion
3. Look for **"Success"** message at the bottom

---

## ✅ **Verify It Worked:**

Run this quick check in SQL Editor:

```sql
SELECT COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'referral_links',
    'affiliate_earnings',
    'payout_requests',
    'onboarding_sessions',
    'user_websites',
    'affiliate_eligibility',
    'fraud_checks',
    'user_roles'
);
```

**Expected Result:** `8` (or more)

---

## 🎉 **After Running, You'll Have:**

### **Viral Loops System:**
- ✅ Referral link auto-generation
- ✅ Conversion tracking
- ✅ Share tracking (WhatsApp, Facebook, etc.)
- ✅ Affiliate earnings

### **Tiered Rewards:**
- ✅ Level 1: 10 free listings
- ✅ Level 2: 25% first transaction
- ✅ Level 3: 10% recurring (TT$5K cap)
- ✅ Mega Bonus: TT$500 + badge

### **Payout System:**
- ✅ WiPay integration ready
- ✅ LinX support
- ✅ Bank transfer option
- ✅ TT$200 minimum

### **Fraud Detection:**
- ✅ Velocity checks (max 20/IP/24h)
- ✅ Device fingerprinting
- ✅ Self-referral blocking

### **Onboarding:**
- ✅ 7-step flow tracking
- ✅ Session management
- ✅ Website generation
- ✅ Drop-off recovery
- ✅ Analytics view

---

## 🚨 **If You Get Errors:**

### **"relation already exists"**
- **Meaning:** Some tables already exist
- **Fix:** This is OK! The script uses `IF NOT EXISTS`
- **Action:** Keep running, it will skip existing tables

### **"column already exists"**
- **Meaning:** Some columns were added before
- **Fix:** This is OK! The script uses `ADD COLUMN IF NOT EXISTS`
- **Action:** Keep running

### **"function already exists"**
- **Meaning:** Functions were created before
- **Fix:** This is OK! The script uses `CREATE OR REPLACE`
- **Action:** Keep running

### **Any other error:**
- Copy the error message
- Let me know and I'll help fix it

---

## 🎯 **What Happens Next:**

### **Immediately After Running:**
1. All new users get auto-referral links
2. Referral tracking starts working
3. Onboarding sessions are tracked
4. Affiliate eligibility is checked

### **When Users Sign Up:**
- Auto-creates referral link
- Auto-creates affiliate eligibility record
- Tracks onboarding session
- Generates website subdomain

---

## 📊 **Test It's Working:**

### **Check Referral Links:**
```sql
SELECT * FROM referral_links LIMIT 5;
```

### **Check Onboarding Sessions:**
```sql
SELECT * FROM onboarding_sessions LIMIT 5;
```

### **Check Leaderboard:**
```sql
SELECT * FROM affiliate_leaderboard;
```

---

## ⏱️ **Estimated Time:**
- **Copy/Paste:** 30 seconds
- **SQL Execution:** 10-15 seconds
- **Total:** **< 1 minute** ⚡

---

## ✅ **That's It!**

After running this ONE file, your entire system is ready:
- ✅ Viral referrals working
- ✅ Affiliate earnings tracking
- ✅ Payouts ready
- ✅ Onboarding tracking
- ✅ Website generation ready
- ✅ All frontend components will work

**No more SQL needed!** 🎉

---

**File:** `supabase/COMPLETE_SYSTEM_UPDATE.sql`  
**Lines:** ~800  
**Time:** < 1 minute  
**Result:** Complete system ready! 🚀
