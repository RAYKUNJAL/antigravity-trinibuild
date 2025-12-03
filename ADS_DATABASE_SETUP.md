# TriniBuild Ads Manager - Database Setup

## Quick Start

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your TriniBuild project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the contents of `supabase/migrations/20_ads_manager_foundation.sql`
6. Paste and click **RUN** ▶️

### Option 2: Via Supabase CLI

```bash
# If you have the CLI installed and linked
npx supabase db push

# Or manually apply the migration
npx supabase db execute -f supabase/migrations/20_ads_manager_foundation.sql
```

---

## What This Migration Creates

### Tables (7)
1. **advertisers** - Business profiles for vendors running ads
2. **ad_campaigns** - Campaign configurations with budgets & targeting
3. **ad_creatives** - Video assets with watermark configs
4. **ad_placements** - Ad slot definitions (home feed, search, etc.)
5. **ad_events** - Event tracking (partitioned by day for scale)
6. **billing_transactions** - Payment tracking
7. **ai_recommendations** - AI-generated scripts/captions/budgets

### Security (RLS Policies)
- ✅ Public can view active ads
- ✅ Authenticated users (advertisers) can manage own campaigns
- ✅ Row-level security on all tables

### Initial Data
- 4 default ad placements seeded:
  - Home Feed Video Ads
  - Store Directory Banner
  - Search Results Inline
  - Profile Sidebar Promoted

---

## Verification

After running the migration, test it:

```bash
node scripts/test_ads_system.js
```

This will:
1. ✅ Check that all 7 tables exist
2. ✅ Verify RLS policies are active
3. ✅ Test advertiser profile creation
4. ✅ Test campaign creation
5. ✅ Verify ad placements are seeded

---

## Troubleshooting

### "Relation already exists"
Some tables might already exist from previous work. That's okay - the migration uses `IF NOT EXISTS`.

### "Permission denied"
Make sure you're using the **Service Role Key** or running via the Dashboard with admin access.

### "Cannot find module"
Install dependencies:
```bash
npm install @supabase/supabase-js dotenv
```

---

## Next Steps

Once migration is successful:

1. **Visit Ads Portal:** `http://localhost:5173/#/ads-portal`
2. **Create a campaign** using the wizard
3. **View analytics** in the dashboard
4. **Upload videos** (watermark engine coming next!)

---

**Migration File:** `supabase/migrations/20_ads_manager_foundation.sql`  
**Test Script:** `scripts/test_ads_system.js`
