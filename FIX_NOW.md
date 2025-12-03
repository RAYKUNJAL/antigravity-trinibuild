# ⚡ FIX VIDEO UPLOAD NOW - 3 STEPS

## Step 1: Open Supabase SQL Editor (30 seconds)
**Click this link:**
https://supabase.com/dashboard/project/cdprbbyptjdntcrhmwxf/sql/new

## Step 2: Run the Fix (30 seconds)
1. Open file: `COMPLETE_VIDEO_FIX.sql`
2. Copy ALL the SQL (Ctrl+A, Ctrl+C)
3. Paste into Supabase SQL Editor
4. Click **RUN** button (bottom right)

You should see:
```
✓ Success. No rows returned
```

## Step 3: Test Upload (1 minute)
1. Go back to your app
2. Hard refresh: **Ctrl+Shift+R**
3. Log out and log back in
4. Try uploading a video

---

## ✅ It Should Work Now

If it STILL fails:

### Emergency Console Test
Open browser console (F12) and paste:
```javascript
// Test upload directly
const testFile = new File(['test'], 'test.mp4', { type: 'video/mp4' })
const { data, error } = await window.supabase.storage
  .from('site-assets')
  .upload(`test/${Date.now()}.mp4`, testFile)
console.log('Result:', data ? 'SUCCESS ✓' : `FAILED: ${error.message}`)
```

If you see "SUCCESS ✓" - the bucket works, issue is in the app code
If you see "FAILED:" - tell me the EXACT error message

---

## What This Fix Does
- ✅ Removes any conflicting policies
- ✅ Creates/updates bucket with correct settings
- ✅ Adds all required RLS policies
- ✅ Allows authenticated uploads
- ✅ Enables public read access

**The SQL file handles EVERYTHING. Just run it once.**
