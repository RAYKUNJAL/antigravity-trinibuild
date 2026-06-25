# TriniBuild / R&R Digital — Project Handoff

_Last updated: 2026-06-25. Hand this to any agent/dev to pick up cleanly._

---

## TL;DR
- **Security incident (Monero cryptominer) is fully resolved & contained.** Production sites stayed up the whole time.
- **TriniBuild platform is live** at https://trinibuild.com (commercial-grade rebuild done).
- **AI backend is deployed** (product scanner + "Lime" Trini-accent chatbot) on Groq.
- **In progress now:** adding Cloudflare in front of all sites.
- **Open items** listed at the bottom — none are emergencies.

---

## Infrastructure facts (critical)
- **Production server:** Hetzner, SSH alias `trini`, IP `5.78.105.83` (Ashburn VA region). Multi-tenant: ~25 containers across MULTIPLE businesses (TriniBuild, wefetepass, bidbinbuy, nextbagchaser, opaija, tidelinx, deer-flow, mail, etc.). **Be careful — not everything on this box is TriniBuild.**
- **TriniBuild app path:** `/opt/trinibuild/antigravity-trinibuild`
- **Stack:** Vite + React + TypeScript + Tailwind + Supabase + React Router (NOT Next.js).
- **Git remote:** https://github.com/RAYKUNJAL/antigravity-trinibuild.git (branch `main`).
  - NOTE: the server's git creds (`RAYKUNJAL`) get 403 on push — push from local, then `git pull` on server.
- **Supabase:** URL `https://cdprbbyptjdntcrhmwxf.supabase.co` (anon key in `.env.local`).
- **Reverse proxy:** Caddy in Docker (container `caddy`). Caddyfile is a HOST bind-mount at `/opt/trinibuild/caddy/Caddyfile` (NOT inside the container). The `dist` folder has NO bind mount → deploys need `docker cp dist/. caddy:/opt/trinibuild/antigravity-trinibuild/dist/` then `docker exec caddy caddy reload --config /etc/caddy/Caddyfile`.
- **DEPLOY PROCEDURE (proven):**
  1. `git push origin main` (from local)
  2. `ssh trini "cd /opt/trinibuild/antigravity-trinibuild && git fetch origin main && git reset --hard origin/main"`
  3. `ssh trini "cd /opt/trinibuild/antigravity-trinibuild && npm install && npm run build"`
  4. `ssh trini "docker cp /opt/trinibuild/antigravity-trinibuild/dist/. caddy:/opt/trinibuild/antigravity-trinibuild/dist/"`
  5. `ssh trini "docker exec caddy caddy reload --config /etc/caddy/Caddyfile"`
  6. Verify: `curl -s https://trinibuild.com/ | grep -o 'index-[A-Za-z0-9_-]*\.js'`

## AI backend (deployed)
- Container `trinibuild-ai` (FastAPI/uvicorn :8000) on docker network `caddy_default`, Groq-powered.
- Proxied at `https://trinibuild.com/ai/*` (Caddy `handle /ai/*` strips prefix).
- Endpoints: `/analyze-product-image` (vision, model `meta-llama/llama-4-scout-17b-16e-instruct`), `/island-chat` (Lime, Trini accent), `/generate`, `/chatbot-reply`.
- Frontend reads `VITE_AI_SERVER_URL=https://trinibuild.com/ai` (in `.env.local`).
- GROQ_API_KEY lives in `/opt/trinibuild/antigravity-trinibuild/ai_server/.env` on server.
- **Local Qwen (Ollama :11434) is installed but CPU-only → ~88s/reply, unusable for live chat.** Lime stays on Groq until a GPU is added; model is swappable via one constant.
- **Groq cost is trivial** (~$1–15/mo at expected scale).

---

## SECURITY INCIDENT — 2026-06-25 (RESOLVED)
**What happened:** A Monero cryptominer (`/tmp/pls_pak_choi`, wallet `49V3…`, pool `15.235.234.220:3333`) ran ~30h, stealing ~80% of server resources.
**Entry vector:** the stale `wefetepass-preview` container running **vulnerable Next.js 15.0.3** (known RCE CVE range). The miner was confined to that one container.
**Production was NOT compromised** — full read-only audit of `wefetepass` prod container = clean (no miner, no SQLi, proper auth, DB localhost-only, security headers present).

**Actions taken (all done & verified):**
- Killed miner; blocked pool IP `15.235.234.220` (in + out).
- Blocked outbound mining ports (3333/4444/5555/7777/9999/14433/14444/45700), persisted via iptables-persistent.
- Stopped `wefetepass-preview`, set `--restart=no`, removed its `preview.wefetepass.com` Caddy route.
- Closed CUPS (port 631). Enabled fail2ban (sshd jail active, already banning attackers).
- Verified no OTHER container runs vulnerable Next.js (all on 15.5+/16.x or patched 14.2.35).
- Locked world-readable secret backups to 600.

**Security skill created:** `app-security-hardening` (in skills, `security/` category) — covers error handling, argon2 hashing, rate limiting, account lockout, input validation, secrets, CVEs, container/server hardening, Cloudflare. Includes `scripts/audit-sweep.sh` (read-only audit). Invoke by asking to "harden / audit / secure" any app.

---

## CLOUDFLARE — in progress (status as of handoff)
Goal: put every site behind Cloudflare (free) to hide origin IP `5.78.105.83`, block exploit scanners, free WAF + DDoS.
Steps: Add site → Free plan → confirm A record → `5.78.105.83` (orange/proxied) → copy 2 nameservers → set them at the domain REGISTRAR → wait for active email.
**AFTER ACTIVE, set these (free):**
- SSL/TLS mode = **Full (strict)** ← REQUIRED (server already has real HTTPS via Caddy; "Flexible" causes redirect loops)
- Always Use HTTPS = On
- WAF Managed Rules = On
- Bot Fight Mode = On
- Rate-limit rules on `/api/*` and `/ai/*`
Repeat per domain: trinibuild.com, wefetepass.com, others.

---

## OPEN ITEMS (none urgent)
1. **Finish Cloudflare** for all domains (see above) — biggest remaining security win.
2. **Rotate secrets** that were briefly world-readable in wefetepass (`JWT_SECRET`, `OPENROUTER_API_KEY`, `GEMINI_API_KEY`, `RESEND_API_KEY`, `GOOGLE_MAPS_API_KEY`, DB creds) — assume potentially read.
3. **wefetepass `/api/ai/chat`** has NO auth/rate-limit → LLM cost-abuse risk. Add rate limit. (wefetepass codebase: `/opt/trinibuild/wefetepass/app`, Vite+Express+tRPC, NOT git-tracked.)
4. **TriniBuild Directory + Market pages are empty** (not broken). Seed SQL ready & committed: `supabase/migrations/45_seed_demo_directory_and_market.sql` (12 stores + 12 listings, reversible, tagged demo). Needs Supabase service_role key OR run it in Supabase SQL Editor.
5. **wefetepass-preview**: stale Next.js image, retired. Current source migrated to Vite — rebuild fresh from `/opt/trinibuild/wefetepass/app` only if the wefetepass owner wants the preview back. Do NOT blind-rebuild (source ≠ old image).
6. **SSH hardening** (optional): currently allows password + root login. Lock to key-only with a TESTED second-session fallback (don't lock out).
7. **wefetepass source not in git** — `git init` for integrity baseline.

## TriniBuild work completed this cycle (for context)
14 working template cards + 7 new commerce templates; full desktop nav + mobile drawer; honest homepage (false-advertising removed per T&T Trade Descriptions Act — NO fabricated stats/testimonials, platform has zero sales yet); real product images; commercial dashboard + Wix-style block editor (`/store-builder`); 5-step builder wizard + full-size preview; truthful trust badges; hex color picker; AI product scanner (fixed) + Lime chatbot.
