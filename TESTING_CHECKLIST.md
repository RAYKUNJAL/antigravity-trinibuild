# 🧪 MANDATORY PRE-DEPLOYMENT TESTING CHECKLIST

**Rule: NO CODE GOES LIVE WITHOUT PASSING THESE TESTS**

---

## ✅ LOCAL BUILD VALIDATION

### 1. TypeScript Check
```bash
cd /home/claude/trinibuild-source
npm run build
# MUST complete without errors
# Warnings are OK, errors are NOT
```

**Pass Criteria:** Build completes, dist/ folder created

---

## ✅ DATABASE VALIDATION

### 2. Verify Tables Exist
```bash
# Before using ANY table, verify it exists
```
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'YOUR_TABLE_NAME';
```

**Pass Criteria:** Table returns in results

### 3. Verify Storage Buckets
```sql
SELECT name FROM storage.buckets WHERE name = 'YOUR_BUCKET';
```

**Pass Criteria:** Bucket exists and is public if needed

---

## ✅ ENVIRONMENT VARIABLE CHECK

### 4. Verify Vercel Env Vars
```bash
# Check if variable is set
curl "https://api.vercel.com/v9/projects/prj_UzmHwZgSZM7PFbzRjGArgaFiannB/env" \
  -H "Authorization: Bearer TOKEN" | jq '.envs[] | select(.key=="VITE_YOUR_KEY")'
```

**Pass Criteria:** Variable exists and has value

---

## ✅ IMAGE UPLOAD TESTING (When Applicable)

### 5. Test File Compression
Create test file in `/tmp/test-image.js`:
```javascript
// Test image compression pipeline
const canvas = document.createElement('canvas');
canvas.width = 1920;
canvas.height = 1080;
// Draw test pattern
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'red';
ctx.fillRect(0, 0, canvas.width, canvas.height);
// Convert to blob
canvas.toBlob((blob) => {
  console.log('Size:', blob.size, 'Type:', blob.type);
}, 'image/jpeg', 0.85);
```

**Pass Criteria:** Blob created, size reasonable (<1MB for test image)

### 6. Test Supabase Upload
```bash
# Create test image
echo "iVBORw0KG..." | base64 -d > /tmp/test.jpg

# Upload via SDK (simulate what code does)
curl -X POST \
  "https://cdprbbyptjdntcrhmwxf.supabase.co/storage/v1/object/product-images/test/test.jpg" \
  -H "Authorization: Bearer ANON_KEY" \
  -H "Content-Type: image/jpeg" \
  --data-binary @/tmp/test.jpg
```

**Pass Criteria:** Returns 200, file uploaded

---

## ✅ API ENDPOINT TESTING

### 7. Test AI API Calls
```bash
# Test OpenAI/Gemini endpoint
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_KEY" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "test"}],
    "max_tokens": 10
  }'
```

**Pass Criteria:** Returns 200, has `choices` array

---

## ✅ RUNTIME LOG CHECK

### 8. Check Production Errors (After Deploy)
```bash
# Via Vercel MCP tool
```

**Pass Criteria:** No fatal errors in last 24 hours

---

## ✅ FUNCTIONAL TESTING

### 9. Test User Flow (Critical Path)

**For Image Upload Feature:**
1. Open browser to localhost:5173 or trinibuild.com
2. Upload test image (use iPhone HEIC if testing mobile)
3. Verify compression happens (check console logs)
4. Verify upload succeeds (check Network tab)
5. Verify AI processes (check response)
6. Verify result displays

**Pass Criteria:** Full flow completes without errors

---

## ✅ MOBILE TESTING (When Applicable)

### 10. Test on Actual Device
- iPhone Safari: HEIC upload
- Android Chrome: Large image upload  
- Mobile network: Slow 3G simulation

**Pass Criteria:** Works on real devices, not just desktop

---

## 🚨 DEPLOYMENT BLOCKERS

**DO NOT DEPLOY if ANY of these are true:**
- [ ] TypeScript errors in build
- [ ] Tables/buckets don't exist in Supabase
- [ ] Environment variables not set in Vercel
- [ ] Local testing shows errors
- [ ] API calls return 40x/50x errors
- [ ] Image upload fails locally
- [ ] Runtime logs show fatal errors

---

## 📋 DEPLOYMENT APPROVAL CHECKLIST

**Before pushing to main:**
- [ ] All tests above passed
- [ ] Tested locally with `npm run dev`
- [ ] Tested build with `npm run build`
- [ ] Verified Supabase schema
- [ ] Verified Vercel env vars
- [ ] Tested on actual mobile device (if mobile feature)
- [ ] Checked Vercel runtime logs for existing errors
- [ ] Created rollback plan (know previous commit hash)

**Deployment Command:**
```bash
git add -A
git commit -m "Descriptive message"
git push origin main
# Wait 60 seconds for Vercel deploy
# Check https://trinibuild.com immediately
# Monitor Vercel runtime logs for 5 minutes
```

---

## 🔄 POST-DEPLOYMENT VALIDATION

**Within 5 minutes of deploy:**
1. Visit https://trinibuild.com
2. Test the feature you just deployed
3. Check Vercel runtime logs
4. If errors: `git revert HEAD && git push origin main`

---

**This checklist is MANDATORY. No exceptions.**

Save this file and reference it before EVERY deployment.
