# 🚀 TriniBuild Deployment Instructions

## QUICK START (5 Minutes to Live)

### Step 1: Get Your Supabase Keys

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select project: `cdprbbyptjdntcrhmwxf`
3. Go to **Settings → API**
4. Copy:
   - **Project URL**: `https://cdprbbyptjdntcrhmwxf.supabase.co`
   - **anon/public key**: (starts with `eyJ...`)
   - **service_role key**: (starts with `eyJ...`)

---

### Step 2: Deploy to Vercel

#### Option A: Web Interface (Easiest)

1. **Go to Vercel**: [vercel.com/new](https://vercel.com/new)

2. **Import Repository**:
   - Click "Import Git Repository"
   - Select `RAYKUNJAL/antigravity-trinibuild`
   - Click "Import"

3. **Configure Project**:
   - Project Name: `trinibuild` (or `trinibuild-staging` for testing)
   - Framework Preset: **Next.js** (should auto-detect)
   - Root Directory: `.` (keep default)

4. **Add Environment Variables**:
   Click "Environment Variables" and add these 3:

   ```
   NEXT_PUBLIC_SUPABASE_URL
   Value: https://cdprbbyptjdntcrhmwxf.supabase.co

   NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: [paste your anon key]

   SUPABASE_SERVICE_ROLE_KEY
   Value: [paste your service role key]
   ```

5. **Deploy**:
   - Click "Deploy"
   - Wait 2-3 minutes
   - You'll get a URL like: `https://trinibuild-xxx.vercel.app`

6. **Test It**:
   - Visit your URL
   - You should see the Template Gallery
   - Try clicking around!

---

#### Option B: Vercel CLI (For Developers)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
cd /home/claude/trinibuild-source
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? [Your account]
# - Link to existing project? No
# - Project name? trinibuild
# - Directory? ./
# - Override settings? No

# Add environment variables in Vercel dashboard
# Then redeploy:
vercel --prod
```

---

### Step 3: Verify Deployment

**Check These URLs**:
- Homepage: `https://your-url.vercel.app`
- Template Gallery: Should load immediately
- Check browser console: Should be no errors

**Quick Test Flow**:
1. Click "Choose Template"
2. Should open a template
3. Check that images load
4. Mobile responsive test (resize browser)

---

### Step 4: Set Up Custom Domain (Optional)

1. In Vercel dashboard → **Settings → Domains**
2. Add domain: `trinibuild.tt` or `app.trinibuild.com`
3. Follow DNS instructions
4. Wait for SSL certificate (automatic)

---

## 🐛 TROUBLESHOOTING

### Issue: Blank White Screen
**Solution**: Check browser console for errors
- Missing env vars? Add them in Vercel dashboard
- Redeploy after adding vars

### Issue: Images Not Loading
**Solution**: Check next.config.js domains
- Should include: `cdprbbyptjdntcrhmwxf.supabase.co`
- Redeploy if you change config

### Issue: Build Failed
**Solution**: Check Vercel build logs
- Common: Missing dependencies in package.json
- Common: TypeScript errors
- Fix locally, commit, push, redeploy

### Issue: Database Connection Error
**Solution**: Check environment variables
- Verify keys are correct
- Verify no extra spaces
- Verify keys have proper permissions in Supabase

---

## 📊 MONITORING BETA TEST

### Vercel Analytics (Built-in)
- Go to your project → **Analytics**
- See page views, unique visitors
- Track which pages get traffic

### Supabase Logs
- Go to Supabase dashboard
- **Logs** section
- See database queries, errors
- Track user signups

### Error Tracking
- Vercel dashboard → **Logs**
- Filter by errors
- See stack traces
- Fix issues

---

## 🔄 UPDATES & ITERATIONS

### Quick Fix Workflow
```bash
# 1. Make changes locally
cd /home/claude/trinibuild-source

# 2. Test locally (optional)
npm install
npm run dev
# Visit http://localhost:3000

# 3. Commit changes
git add .
git commit -m "fix: your bug fix description"

# 4. Push to GitHub (if git integration enabled)
git push origin master

# OR manually redeploy in Vercel dashboard
```

### Beta Feedback Loop
1. User reports issue
2. Fix code locally
3. Test fix
4. Commit + push
5. Vercel auto-deploys
6. Tell user "Fixed! Refresh page"
7. Repeat

---

## 🎯 BETA TEST CHECKLIST

**Before Inviting Users**:
- [ ] Deployed to staging
- [ ] Tested signup flow
- [ ] Tested on mobile
- [ ] Tested in Chrome + Safari
- [ ] All images loading
- [ ] No console errors
- [ ] Read BETA_TEST_GUIDE.md

**During Beta**:
- [ ] Monitor Vercel logs daily
- [ ] Check Supabase for new users
- [ ] Respond to questions fast
- [ ] Track issues in spreadsheet
- [ ] Deploy fixes within 24h

**After Beta**:
- [ ] Thank all testers
- [ ] Fix critical bugs
- [ ] Polish based on feedback
- [ ] Deploy to production domain
- [ ] Plan launch!

---

## 📞 NEED HELP?

**Vercel Issues**: [vercel.com/support](https://vercel.com/support)
**Supabase Issues**: [supabase.com/support](https://supabase.com/support)
**Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)

---

## ✅ YOU'RE READY!

**Your staging URL**: `https://trinibuild-[random].vercel.app`

Next steps:
1. ✅ Deploy (you're here!)
2. Test yourself
3. Read BETA_TEST_GUIDE.md
4. Invite 5-10 beta testers
5. Collect feedback
6. Iterate
7. Launch! 🚀

---

**Good luck with your beta test!** 🇹🇹
