# TriniBuild Complete Setup & Fix Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Environment Configuration

1. **Create `.env.local` file** in the project root if it doesn't exist:

```bash
# Copy from example
cp .env.example .env.local
```

2. **Add your Supabase credentials** to `.env.local`:

```env
VITE_SUPABASE_URL=https://cdprbbyptjdntcrhmwxf.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Where to find these keys:**
- Go to [Supabase Dashboard](https://app.supabase.com/project/cdprbbyptjdntcrhmwxf/settings/api)
- Copy `URL` → paste as `VITE_SUPABASE_URL`
- Copy `anon public` key → paste as `VITE_SUPABASE_ANON_KEY`
- Copy `service_role` key → paste as `SUPABASE_SERVICE_ROLE_KEY`

### Step 2: Database Setup

1. **Open Supabase SQL Editor:**
   - Go to https://app.supabase.com/project/cdprbbyptjdntcrhmwxf/sql/new

2. **Run the complete setup script:**
   - Open `supabase/COMPLETE_DATABASE_SETUP.sql`
   - Copy all contents
   - Paste into Supabase SQL Editor
   - Click "Run" button
   - Wait for "Database setup complete! ✅" message

### Step 3: Verify Setup

1. **Start the dev server:**
```bash
npm run dev
```

2. **Open the app:**
   - Navigate to http://localhost:3000

3. **Check the console:**
   - You should see: `✅ Supabase configuration loaded`
   - You should see: `✅ Database connection successful`

4. **Test the admin dashboard:**
   - Go to http://localhost:3000/#/admin/bypass
   - Then navigate to http://localhost:3000/#/admin/command-center
   - System Status should show GREEN for Database

---

## 🔧 Fixing Specific Issues

### Issue: "Database Connection Failed" Error

**Symptoms:**
- Red banner in Command Center
- All metrics show 0
- System Status shows RED for Database

**Fix:**
1. Check `.env.local` exists and has correct values
2. Verify Supabase project is active (not paused)
3. Run database setup script (see Step 2 above)
4. Restart dev server: `Ctrl+C` then `npm run dev`

### Issue: "Missing Tables" Warning

**Symptoms:**
- Yellow banner in Command Center
- Some features don't work
- System Status shows YELLOW for Database

**Fix:**
1. Run the complete database setup script
2. Check Supabase Dashboard → Table Editor
3. Verify these tables exist:
   - profiles
   - jobs
   - real_estate_listings
   - events
   - tickets
   - rides
   - drivers
   - ad_campaigns
   - advertisers
   - site_settings
   - page_views
   - support_messages
   - location_keyword_heatmap

### Issue: Admin Pages Show 404

**Symptoms:**
- Clicking admin sidebar links shows "Page Not Found"
- URL shows correct path but page doesn't load

**Fix:**
This should NOT happen as all components exist. If it does:
1. Clear browser cache: `Ctrl+Shift+Delete`
2. Hard refresh: `Ctrl+Shift+R`
3. Restart dev server
4. Check browser console for errors

### Issue: All Metrics Show 0

**Symptoms:**
- Total Users: 0
- Open Jobs: 0
- Active Properties: 0
- Upcoming Events: 0

**This is NORMAL if:**
- Database is newly set up (no data yet)
- You haven't created any test data

**To add test data:**
1. Create a user account
2. Add some jobs, properties, or events through the UI
3. Or run seed scripts (coming soon)

---

## 📊 Running Diagnostics

### Automated System Check

Run the diagnostic script to check all systems:

```bash
npx tsx scripts/diagnose-system.ts
```

This will check:
- ✅ Database connection
- ✅ All required tables exist
- ✅ Data counts
- ✅ Site settings configured

### Manual Checks

**1. Check Supabase Connection:**
```javascript
// Open browser console at http://localhost:3000
import { supabase } from './services/supabaseClient'
const { data, error } = await supabase.from('profiles').select('count')
console.log({ data, error })
```

**2. Check Environment Variables:**
```javascript
// Open browser console
console.log('URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
```

**3. Check Database Health:**
```javascript
// Open browser console
import { getDatabaseHealth } from './services/supabaseClient'
const health = await getDatabaseHealth()
console.log(health)
```

---

## 🎯 Admin Dashboard Features

### Working Features (After Setup)

✅ **Command Center**
- Real-time system health monitoring
- User, job, property, event metrics
- AI systems status

✅ **Traffic Hub**
- Live traffic analytics
- Geographic heatmap
- Traffic source breakdown
- AI routing controls

✅ **User Management**
- View all users
- Search and filter
- User details

✅ **Marketplace Monitor**
- Active listings
- Recent activity

✅ **Jobs Monitor**
- Open jobs
- Applications

✅ **Real Estate Monitor**
- Property listings
- Agent activity

✅ **Rideshare Fleet**
- Active rides
- Driver status

✅ **Tickets & Events Monitor**
- Upcoming events
- Ticket sales

### Features Requiring Additional Setup

⚠️ **Ads Engine**
- Requires ad campaigns data
- Create campaigns through UI

⚠️ **SEO & Keywords**
- Requires keyword tracking data
- Data accumulates over time

⚠️ **Content AI**
- Requires AI API keys
- Configure in settings

⚠️ **Finance & Payouts**
- Requires payment integration
- PayPal/WiPay setup needed

---

## 🐛 Common Errors & Solutions

### Error: "Missing Supabase environment variables"

**Console shows:**
```
❌ Missing Supabase environment variables!
```

**Solution:**
1. Create `.env.local` file
2. Add Supabase credentials (see Step 1)
3. Restart dev server

### Error: "relation 'public.profiles' does not exist"

**Console shows:**
```
relation "public.profiles" does not exist
```

**Solution:**
1. Run database setup script (see Step 2)
2. Verify script completed successfully
3. Check Supabase Dashboard → Table Editor

### Error: "infinite recursion" or "policy for relation"

**Console shows:**
```
ERROR_MSG: infinite recursion detected in policy for relation "profiles"
```

**Cause:**
This happens when a security policy on the `profiles` table tries to query the `profiles` table itself (e.g., checking if you are an admin), creating an endless loop.

**Solution:**
1. Open Supabase SQL Editor
2. Run the recursion fix script: `supabase/FIX_RLS_RECURSION.sql`
3. This will reset the security policies to a safe state.

### Error: "Row Level Security policy violation"

**Console shows:**
```
new row violates row-level security policy
```

**Solution:**
1. Check you're logged in (if required)
2. Verify RLS policies are correct
3. Re-run database setup script

### Error: "Failed to fetch"

**Console shows:**
```
TypeError: Failed to fetch
```

**Solution:**
1. Check internet connection
2. Verify Supabase project is active
3. Check Supabase URL is correct
4. Try accessing Supabase Dashboard directly

---

## 📝 Next Steps After Setup

1. **Create Admin Account:**
   - Go to http://localhost:3000/#/admin/bypass
   - This bypasses authentication for development

2. **Test Each Admin Page:**
   - Click through all sidebar items
   - Verify pages load without errors
   - Check browser console for warnings

3. **Add Test Data:**
   - Create sample users
   - Add test jobs, properties, events
   - Verify data appears in monitors

4. **Configure AI Features:**
   - Set up AI API keys (if using)
   - Test AI routing toggles in Traffic Hub
   - Verify settings persist

5. **Production Deployment:**
   - Set environment variables in Vercel/Netlify
   - Run database migrations on production Supabase
   - Test all features in production

---

## 🆘 Still Having Issues?

### Check These First:
1. ✅ `.env.local` file exists with correct values
2. ✅ Database setup script ran successfully
3. ✅ Dev server restarted after changes
4. ✅ Browser cache cleared
Your system is fully set up when:

- [ ] `.env.local` file exists with Supabase credentials
- [ ] Database setup script completed successfully
- [ ] Dev server starts without errors
- [ ] Console shows "✅ Supabase configuration loaded"
- [ ] Console shows "✅ Database connection successful"
- [ ] Command Center loads without red/yellow banners
- [ ] System Status shows GREEN for Database
- [ ] All admin pages load without 404 errors
- [ ] Metrics show actual data (or 0 if no data added)
- [ ] No errors in browser console

**When all items are checked, your TriniBuild system is ready! 🎉**
