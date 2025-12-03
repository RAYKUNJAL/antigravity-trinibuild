# Video Upload Fix - Manual Steps

## Problem
The video upload feature is not working due to:
1. Database schema mismatch (missing `sort_order` and `is_youtube` columns)
2. RLS (Row Level Security) policies that are too restrictive

## Fix Steps

### Option 1: Run Migration via Supabase Dashboard (RECOMMENDED)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `supabase/migrations/19_fix_video_placements_final.sql`
5. Click **Run** to execute the migration

### Option 2: Use Supabase CLI

```bash
# Link your project (if not already linked)
npx supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
npx supabase db push
```

## Verification

After running the migration, test the video upload:

```bash
node scripts/test_video_system.js
```

This will:
1. Check that the `video_placements` table has the correct schema
2. Test inserting a video placement record
3. Test uploading a file to the `site-assets` bucket

## What Changed

### Database Schema
- Added `sort_order` column (replaces `position`)
- Added `is_youtube` column for YouTube video detection
- Added unique constraint on `(page, section, sort_order)`

### RLS Policies
- **Public**: Can view active videos
- **Authenticated users**: Full access (SELECT, INSERT, UPDATE, DELETE)
- **Storage**: Permissive policies for `site-assets` bucket

## Troubleshooting

If you still have issues:
1. Make sure you're logged in as an admin user
2. Check browser console for errors
3. Run the verification script: `node scripts/test_video_system.js`
