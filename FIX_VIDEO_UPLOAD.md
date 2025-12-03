# Fix Video Upload Error - Quick Guide

## Problem
**Error:** `Storage bucket "site-assets" not found. Please run migration 18.`

## Solution (Choose ONE method)

---

## ✅ Method 1: Supabase Dashboard (RECOMMENDED - 2 minutes)

### Step 1: Access SQL Editor
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your **TriniBuild** project
3. Click **SQL Editor** in the left sidebar

### Step 2: Run Migration
1. Click **New Query** button
2. Copy the ENTIRE contents from:
   ```
   supabase/migrations/18_force_fix_video_storage.sql
   ```
3. Paste into the SQL Editor
4. Click **RUN** button (bottom right)

### Step 3: Verify
1. Go to **Storage** in the left sidebar
2. You should see **site-assets** bucket
3. Try uploading a video again

---

## ✅ Method 2: Quick SQL (If you just need the bucket)

### Paste this into Supabase SQL Editor:

```sql
-- Create site-assets bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'site-assets', 
    'site-assets', 
    true, 
    524288000, -- 500MB
    ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/avi', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 524288000,
    allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/avi', 'image/jpeg', 'image/png', 'image/webp'];

-- Public read access
DROP POLICY IF EXISTS "Public Access site-assets" ON storage.objects;
CREATE POLICY "Public Access site-assets"
ON storage.objects FOR SELECT
USING ( bucket_id = 'site-assets' );

-- Authenticated upload
DROP POLICY IF EXISTS "Authenticated users can upload site-assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload site-assets"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'site-assets' AND auth.role() = 'authenticated' );
```

---

## ✅ Method 3: Using Supabase CLI (If installed)

```bash
# From project root
supabase db push

# Or run specific migration
supabase migration up 18_force_fix_video_storage
```

---

## Verification Checklist

After running the migration, verify:

- [ ] Go to Supabase Dashboard → Storage
- [ ] See "site-assets" bucket listed
- [ ] Bucket settings show:
  - Public: ✅ Yes
  - Max file size: 500 MB
  - Allowed types: video/*, image/*
- [ ] Try uploading a video from the app
- [ ] Check browser console for any errors

---

## Common Issues

### Issue: "Permission denied"
**Fix:** Make sure you're logged in as an authenticated user in your app

### Issue: "File too large"
**Fix:** Videos must be under 500MB. Compress if needed.

### Issue: "Bucket still not found"
**Fix:** 
1. Hard refresh your browser (Ctrl+Shift+R)
2. Clear localStorage
3. Log out and log back in

### Issue: SQL Editor shows errors
**Fix:** Run each section separately:
1. First: CREATE bucket
2. Then: CREATE policies

---

## Quick Test

After fixing, test with this:

1. Go to Admin Dashboard → Video Manager
2. Click "Add Video"
3. Try uploading a small MP4 file (< 10MB)
4. Should see progress bar and success message

---

## Need Help?

If issues persist:
1. Check browser console (F12) for detailed errors
2. Verify you're authenticated (check local storage for session)
3. Check Supabase logs in Dashboard → Logs section

---

**Status:** Migration 18 fixes the storage bucket issues permanently ✅
