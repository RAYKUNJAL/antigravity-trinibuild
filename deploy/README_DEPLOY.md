# 🇹🇹 TriniBuild — Self-Hosted Deployment (Hetzner)

**Replaces:** Vercel (hosting) + Supabase (database, auth, storage)
**With:** Your own Hetzner server — Nginx + Node.js + PostgreSQL + PM2

---

## What Goes Where

| Before (rented) | After (yours) |
|---|---|
| Vercel hosting | Nginx on Hetzner serving `dist/` |
| Vercel auto-deploy | GitHub Actions → SSH deploy |
| Supabase PostgreSQL | PostgreSQL 16 on Hetzner |
| Supabase Auth | JWT auth in `server/index.js` |
| Supabase Storage | `/var/www/trinibuild/uploads/` on disk |
| Supabase client keys in browser | OpenAI key now SERVER-side (more secure) |

**Code still lives on GitHub:** `github.com/RAYKUNJAL/antigravity-trinibuild`
GitHub is your source of truth. The server pulls from it.

---

## ONE-TIME SETUP (15 minutes)

### Step 1 — SSH into your Hetzner server
```bash
ssh root@YOUR_SERVER_IP
```
(Password is in your Hetzner console email, or use the SSH key you added.)

### Step 2 — Run the setup script
```bash
curl -O https://raw.githubusercontent.com/RAYKUNJAL/antigravity-trinibuild/main/deploy/setup-server.sh
bash setup-server.sh
```
This installs everything: Node 20, PostgreSQL 16, Nginx, PM2, Certbot, firewall.
It will ask for your repo URL — paste:
```
https://YOUR_GITHUB_TOKEN@github.com/RAYKUNJAL/antigravity-trinibuild.git
```

### Step 3 — Point your domain
In your domain registrar (where trinibuild.com lives):
- Delete the old Vercel A/CNAME records
- Add: `A record` → `trinibuild.com` → `YOUR_SERVER_IP`
- Add: `A record` → `www.trinibuild.com` → `YOUR_SERVER_IP`

### Step 4 — Get SSL (after DNS propagates, ~15 min)
```bash
certbot --nginx -d trinibuild.com -d www.trinibuild.com
```

### Step 5 — Add your API keys
```bash
nano /var/www/trinibuild/.env
# Fill in OPENAI_API_KEY=sk-proj-...
pm2 restart all
```

### Step 6 — Set up auto-deploy (replaces Vercel)
In GitHub → repo → Settings → Secrets and variables → Actions, add:
- `HETZNER_HOST` = your server IP
- `HETZNER_SSH_KEY` = your private SSH key (`cat ~/.ssh/id_rsa` on your machine)

Now every `git push origin main` auto-deploys to your server. Same as Vercel, but yours.

---

## DAILY WORKFLOW (unchanged)

```bash
git add -A
git commit -m "your change"
git push origin main
# → GitHub Actions deploys to Hetzner in ~60 seconds
```

---

## USEFUL COMMANDS ON THE SERVER

```bash
pm2 status                    # is the API running?
pm2 logs trinibuild-api       # live logs
pm2 restart trinibuild-api    # restart after .env change
systemctl status nginx        # web server status
sudo -u postgres psql trinibuild   # open the database
curl localhost:3001/api/health     # API health check
```

## DATABASE BACKUP (run weekly, or cron it)

```bash
sudo -u postgres pg_dump trinibuild > /root/backup-$(date +%F).sql
```

Cron it daily at 3am:
```bash
echo "0 3 * * * sudo -u postgres pg_dump trinibuild > /root/backup-\$(date +\%F).sql" | crontab -
```

---

## MIGRATING YOUR EXISTING SUPABASE DATA

Once the server is live, export from Supabase and import:

```bash
# 1. On your machine — dump Supabase (get connection string from Supabase dashboard)
pg_dump "postgresql://postgres:[PASSWORD]@db.cdprbbyptjdntcrhmwxf.supabase.co:5432/postgres" \
  --data-only --no-owner \
  -t stores -t products -t cod_orders -t affiliate_profiles \
  -t affiliate_referrals -t document_orders -t plan_tiers \
  > supabase-data.sql

# 2. Copy to server
scp supabase-data.sql root@YOUR_SERVER_IP:/root/

# 3. On server — import
sudo -u postgres psql trinibuild < /root/supabase-data.sql
```

Note: Supabase `auth.users` accounts can't be exported with passwords (they're hashed
with Supabase's secret). Users will need to reset passwords once, OR keep Supabase
Auth temporarily while everything else moves.

---

## ARCHITECTURE

```
                    trinibuild.com (DNS → Hetzner IP)
                              │
                    ┌─────────▼─────────┐
                    │   Nginx (:80/443) │  SSL via Certbot
                    └─────┬───────┬─────┘
              static files│       │/api/*
                    ┌─────▼───┐ ┌─▼──────────────┐
                    │  dist/  │ │ Node API :3001 │  PM2 (2 instances)
                    │ (Vite)  │ │ server/index.js│
                    └─────────┘ └─┬──────────────┘
                                  │
                        ┌─────────▼──────────┐
                        │  PostgreSQL 16     │  localhost only
                        │  db: trinibuild    │
                        └────────────────────┘
```

## FRONTEND MIGRATION STATUS

The React pages currently call Supabase directly (`services/supabaseClient.ts`).
The new API at `/api/*` replaces those calls. Migration of each service file:

| Service | Replace with |
|---|---|
| supabase.auth.signUp() | POST /api/auth/signup |
| supabase.auth.signInWithPassword() | POST /api/auth/login |
| supabase.auth.getUser() | GET /api/auth/me |
| codSystemService (supabase queries) | /api/cod/* endpoints |
| affiliateSystemService | /api/affiliate/* endpoints |
| documentCenterService (OpenAI client-side) | POST /api/documents/generate (server-side key ✅) |
| subscriptionService | /api/subscription/* endpoints |
| supabase.storage.upload() | POST multipart to /api/.../proof |

A new `services/apiClient.ts` will replace `supabaseClient.ts` — this is the next build step.
