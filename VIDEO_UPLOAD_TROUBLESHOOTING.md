# Video Upload Troubleshooting Guide

## Quick Diagnosis

Open your browser console (F12) when trying to upload and look for these messages:

### Common Error Messages & Solutions

---

## ❌ Error: "You must be logged in to upload videos"

**Cause:** Not authenticated or session expired

**Fix:**
1. Log out completely
2. Clear browser cache/localStorage
3. Log back in
4. Try uploading again

**Check:**
```javascript
// Open browser console and run:
const { data } = await window.supabase.auth.getUser()
console.log('User:', data.user)
// Should show user details, not null
```

---

## ❌ Error: "Storage bucket error"

**Cause:** Bucket not found or misconfigured

**Fix:**
1. Go to Supabase Dashboard → Storage
2. Verify "site-assets" bucket exists
3. Check bucket is marked as PUBLIC
4. Re-run migration 18 if needed (see FIX_VIDEO_UPLOAD.md)

---

## ❌ Error: "Permission denied"

**Cause:** RLS policy issue or not authenticated

**Fix:**
1. Check authentication (see above)
2. Verify RLS policies in Supabase:
   - Go to Storage → site-assets → Policies
   - Should have "Authenticated users can upload" policy
3. If missing, run this SQL:

```sql
CREATE POLICY IF NOT EXISTS "Authenticated users can upload site-assets"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'site-assets' AND auth.role() = 'authenticated' );
```

---

## ❌ Error: "File too large"

**Cause:** Video exceeds 500MB limit

**Fix:**
1. Compress your video
2. Or adjust bucket limit in Supabase:
   ```sql
   UPDATE storage.buckets
   SET file_size_limit = 1073741824 -- 1GB
   WHERE id = 'site-assets';
   ```

---

## ❌ Error: "Invalid file type"

**Cause:** Wrong file format

**Fix:**
-Convert video to: MP4, WebM, MOV, or AVI
- Allowed MIME types:
  - video/mp4
  - video/webm
  - video/quicktime
  - video/x-msvideo
  - video/avi

---

## 🔍 Debug Mode

Enable detailed logging:

1. **Open Browser Console** (F12)
2. **Try uploading** - You'll see:
   - "User authenticated: [email]"
   - "Uploading video: [filename] ([size]MB)"
   - "Uploading to: site-assets/videos/[path]"
   - "User ID: [uuid]"
   - Either "Upload successful" or error details

3. **Check for errors:**
   - Red error messages
   - "Upload error details:" logs
   - "Upload error code:" (if any)

---

## ✅ Verification Checklist

Before uploading, verify:

### 1. Authentication
- [ ] User is logged in
- [ ] Session is valid (not expired)
- [ ] Email is verified (if required)

### 2. Supabase Storage
- [ ] "site-assets" bucket exists
- [ ] Bucket is PUBLIC
- [ ] File size limit: 500MB+
- [ ] Allowed MIME types include video/*

### 3. RLS Policies (Min. 2 required)
- [ ] Public SELECT policy
- [ ] Authenticated INSERT policy

### 4. File Requirements
- [ ] File is < 500MB
- [ ] File format is MP4, WebM, MOV, or AVI
- [ ] File is not corrupted

---

## 🔧 Manual Test inBrowser Console

```javascript
// 1. Check authentication
const { data: { user }, error } = await window.supabase.auth.getUser()
console.log('Logged in:', !!user, user?.email)

// 2. Test bucket access
const { data: buckets } = await window.supabase.storage.listBuckets()
console.log('Buckets:', buckets)

// 3. Test upload (with small test file)
const testFile = new File(["test"], "test.mp4", { type: "video/mp4" })
const { data, error: uploadError } = await window.supabase.storage
  .from('site-assets')
  .upload(`test/${Date.now()}.mp4`, testFile)
console.log('Test upload:', data, uploadError)
```

---

## 🆘 Still Not Working?

### Collect This Info:

1. **Browser Console Logs**
   - Copy ALL console output when uploading
   - Include error messages and stack traces

2. **Supabase Configuration**
   - Bucket name: site-assets
   - File size limit: ?
   - Public: Yes/No
   - Number of policies: ?

3. **User Info**
   - Authenticated: Yes/No
   - User ID: ?
   - Role: ?

4. **File Info**
   - Size: ?
   - Type: ?
   - Format: ?

### Send To Support:
- Email: support@trinibuild.com
- Include: browser console logs, Supabase config, file info

---

## 💡 Common Solutions Summary

| Issue | Quick Fix |
|-------|-----------|
| Not authenticated | Log out + log in |
| Session expired | Refresh page + log in |
| Bucket not found | Run migration 18 |
| Permission denied | Check RLS policies |
| File too large | Compress video or increase limit |
| Wrong file type | Convert to MP4 |

---

## Updated Code (2025-12-03)

The video upload service now includes:
✅ Authentication check before upload  
✅ Detailed error logging to console  
✅ Better error messages for users  
✅ File validation before upload  
✅ Upload progress tracking  

Check `services/videoService.ts` for the latest code.

---

**Last Updated:** December 3, 2025  
**Status:** Enhanced error handling deployed
