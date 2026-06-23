# ⚡ SIMPLE MANUAL DEPLOYMENT - 30 Minutes Total

Ray, forget automation tools - **let's do this manually**. It's actually FASTER and you'll be live in 30 minutes!

---

## 📥 STEP 1: Get Files to Windows (5 min)

The files are at: `/home/claude/caribbean-ticketing-app/`

**Option A: Download via Claude Desktop**
1. Look at any file I shared in this chat
2. Click the download icon
3. Navigate to the folder in File Explorer
4. Copy entire `trinibuild-ticketing-app` folder to:
   `C:\Users\Banjo\Projects\trinibuild-ticketing`

**Option B: Use WSL** (if you have it)
```bash
# In WSL terminal:
cp -r /home/claude/caribbean-ticketing-app /mnt/c/Users/Banjo/Projects/trinibuild-ticketing
```

---

## 🌐 STEP 2: Push to GitHub (5 min)

```powershell
# Navigate to project
cd C:\Users\Banjo\Projects\trinibuild-ticketing

# Configure Git
git config --global user.email "ray@trinibuild.com"
git config --global user.name "Ray"

# Initialize (if not already)
git init
git add .
git commit -m "TriniBuild Ticketing Platform"

# Create repo on GitHub
gh auth login
gh repo create trinibuild-ticketing --public --source=. --push
```

**No GitHub CLI?** 
1. Go to https://github.com/raytattoos
2. Click "New repository"
3. Name: `trinibuild-ticketing`
4. Create
5. Then:
```powershell
git remote add origin https://github.com/raytattoos/trinibuild-ticketing.git
git branch -M main
git push -u origin main
```

✅ **Checkpoint**: Repo live at github.com/raytattoos/trinibuild-ticketing

---

## 🚀 STEP 3: Deploy to Vercel (10 min)

### A. Import Project
1. Go to https://vercel.com
2. Click "Add New Project"
3. Import `raytattoos/trinibuild-ticketing`
4. Select Framework: **Next.js**
5. Root Directory: `./`

### B. Environment Variables
Click "Add Environment Variable" and add these (one by one):

```env
# You'll need to create/get these first:
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
RESEND_API_KEY=
ANTHROPIC_API_KEY=
QR_SECRET_KEY=
NEXT_PUBLIC_APP_URL=https://trinibuild.com
```

**Skip the ones you don't have yet** - we can add them later!

**MINIMUM to deploy**:
- Just set `NEXT_PUBLIC_APP_URL=https://trinibuild.com`
- Everything else can wait!

### C. Deploy!
Click "Deploy" and wait ~2 minutes

✅ **Checkpoint**: App deployed to `trinibuild-ticketing.vercel.app`

---

## 💾 STEP 4: Create Supabase (10 min - DO THIS SECOND)

### A. Create Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Settings:
   - Name: `trinibuild-tickets`
   - Password: (generate & SAVE IT!)
   - Region: **US East (N. Virginia)**
4. Click "Create new project"
5. Wait ~2 min for setup

### B. Run Migration
1. Click "SQL Editor" in left sidebar
2. Click "New Query"
3. Open file: `C:\Users\Banjo\Projects\trinibuild-ticketing\supabase\migrations\001_initial_schema.sql`
4. Copy ALL contents
5. Paste in SQL Editor
6. Click "Run"
7. Verify tables created (check "Table Editor")

### C. Add Helper Function
Still in SQL Editor, run this:
```sql
CREATE OR REPLACE FUNCTION increment_tickets_sold(event_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE events SET tickets_sold = tickets_sold + amount WHERE id = event_id;
END;
$$ LANGUAGE plpgsql;
```

### D. Get API Keys
1. Click "Settings" → "API"
2. Copy these 3 things:
   - **Project URL**
   - **anon public** key
   - **service_role** key (secret!)

### E. Add to Vercel
1. Go back to Vercel project
2. Settings → Environment Variables
3. Add the 3 Supabase values:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Redeploy (Deployments → ... → Redeploy)

✅ **Checkpoint**: Database live with all tables!

---

## 🔗 STEP 5: Connect Domain (5 min - OPTIONAL FOR NOW)

### Quick Test First
Just visit: `https://trinibuild-ticketing.vercel.app`

Works? Great! Domain routing can wait.

### To Add Domain Later:
**Option A**: Path (`trinibuild.com/tickets`)
- In your main trinibuild.com Vercel project
- Settings → Rewrites
- Add rule pointing to ticketing app

**Option B**: Subdomain (`tickets.trinibuild.com`)  
- Add DNS CNAME
- Configure in Vercel

---

## 🎉 YOU'RE LIVE!

At this point you have:
- ✅ Code on GitHub
- ✅ App deployed on Vercel
- ✅ Database on Supabase
- ✅ Ready to test!

---

## 🧪 QUICK TEST

1. Visit your Vercel URL
2. See if events page loads (it might be empty - that's OK)
3. Database connection working? Check Vercel logs

---

## 📋 ADD OTHER STUFF LATER

Once basic app works, add:
- PayPal keys (for payments)
- Resend key (for emails)
- Anthropic key (for blog automation)
- QR secret (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

---

## 🆘 IF STUCK

**Deploy fails?**
- Check Vercel build logs
- Make sure package.json has all dependencies

**Database not connecting?**
- Double-check Supabase URL and keys
- Make sure they're in Vercel env vars

**Can't push to GitHub?**
- Make sure Git is configured
- Check GitHub authentication

---

**Start with Step 1 and let me know when you're ready for the next step!** 

I'm here to help! 🚀
