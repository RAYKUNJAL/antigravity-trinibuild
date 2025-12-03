# URGENT: Fix Video Upload Now!

## 🚨 Current Error
```
Storage bucket error. The "site-assets" bucket may not be configured correctly.
```

## ✅ Quick Fix (3 Steps - 2 Minutes)

### Step 1: Open Diagnostic Tool
1. Open this file in your browser:
   ```
   file:///c:/Users/RAY/OneDrive/Documents/Trinibuild/storage-diagnostic.html
   ```
   OR just double-click: `storage-diagnostic.html`

2. Enter your Supabase credentials:
   - **URL:** `https://cdprbbyptjdntcrhmwxf.supabase.co`
   - **Anon Key:** (get from `.env.local` file)

3. Click "Run Diagnostic"

### Step 2: Copy the SQL
The diagnostic tool will generate SQL for you. It will say:
```
🔧 SOLUTION: Create the bucket
   Copy this SQL and run in Supabase Dashboard → SQL Editor:
```

Click the SQL - it auto-copies to clipboard!

### Step 3: Run SQL in Supabase
1. Go to: https://supabase.com/dashboard/project/cdprbbyptjdntcrhmwxf/sql/new
2. Paste the SQL
3. Click RUN

Done! ✅

---

## 🔧 Alternative: Manual SQL Fix

If diagnostic tool doesn't work, paste this directly in Supabase SQL Editor:

```sql
-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'site-assets', 
    'site-assets', 
    true, 
    524288000,
    ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/avi', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 524288000,
    allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/avi', 'image/jpeg', 'image/png', 'image/webp'];

-- 2. Allow public read
DROP POLICY IF EXISTS "Public Access site-assets" ON storage.objects;
CREATE POLICY "Public Access site-assets"
ON storage.objects FOR SELECT
USING ( bucket_id = 'site-assets' );

-- 3. Allow authenticated upload  
DROP POLICY IF EXISTS "Authenticated users can upload site-assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload site-assets"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'site-assets' AND auth.role() = 'authenticated' );

-- 4. Allow users to manage their own files
DROP POLICY IF EXISTS "Users can update own site-assets" ON storage.objects;
CREATE POLICY "Users can update own site-assets"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'site-assets' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Users can delete own site-assets" ON storage.objects;
CREATE POLICY "Users can delete own site-assets"
ON storage.objects FOR DELETE
USING ( bucket_id = 'site-assets' AND auth.uid() = owner );
```

---

## 📋 Verify It Worked

After running the SQL:

1. Go to: https://supabase.com/dashboard/project/cdprbbyptjdntcrhmwxf/storage/buckets
2. You should see "site-assets" bucket
3. Click on it - should show:
   - Public: ✅ Yes
   - File size limit: 500 MB
   - Allowed types: video/*, image/*

4. Try uploading a video in your app

---

## 🆘 Still Not Working?

### Check These:

1. **Are you logged in to the app?**
   - Log out and log back in
   - Clear browser cache

2. **Is the bucket in the RIGHT Supabase project?**
   - Project URL in `.env.local`: `https://cdprbbyptjdntcrhmwxf.supabase.co`
   - Bucket should be in THIS project

3. **Check browser console (F12)**
   - What exact error do you see?
   - Share the console output

### Browser Console Test:
Open console (F12) and paste:
```javascript
const { data } = await window.supabase.auth.getUser()
console.log('User:', data.user?.email || 'NOT LOGGED IN')

const test = new File(['test'], 'test.txt', { type: 'text/plain' })
const { error } = await window.supabase.storage
  .from('site-assets')
  .upload(`test/${Date.now()}.txt`, test)
console.log('Upload error:', error?.message || 'SUCCESS!')
```

---

## 📞 Contact
If still broken after trying all above, share:
1. Screenshot of Supabase Storage page
2. Browser console errors
3. Output from browser console test above

---

**Your Supabase Project:** cdprbbyptjdntcrhmwxf  
**Storage Dashboard:** https://supabase.com/dashboard/project/cdprbbyptjdntcrhmwxf/storage/buckets  
**SQL Editor:** https://supabase.com/dashboard/project/cdprbbyptjdntcrhmwxf/sql/new
