# TriniBuild — Launch Risk Tracker

_Updated: 2026-06-25. Sort: Critical → Low. Status: 🔴 open · 🟡 in progress · ✅ done · ⏸ deferred._

## CRITICAL — must fix before charging anyone

| ID | Status | Risk | File / evidence | Fix |
|----|--------|------|-----------------|-----|
| C1 | 🔴 | `/signup` + `/login` dead (POST to non-existent `/api`, live 405) | `App.tsx:73,96`; `simpleAuthService.ts:24,83` | Route both to Supabase `Auth`, or rewrite Simple pages on `supabase.auth` |
| C2 | 🔴 | Public admin backdoor `/admin/bypass` | `AdminBypass.tsx:11-26`; `App.tsx:221` | Delete route + file |
| C3 | 🔴 | ProtectedRoute forgeable via localStorage | `ProtectedRoute.tsx:15`; `authService.isAuthenticated` | Validate Supabase session server-side; stop trusting localStorage |
| C4 | 🔴 | Anon checkout fails on RLS (wrong order path) | `StorefrontV2.tsx:180`; `orderService.ts:12-14` | Use `orderService`/edge fn or add anon insert RLS policy; test guest COD |
| C5 | 🔴 | Browser-exposed LLM keys (`VITE_*` to OpenAI/Gemini/etc) | `ai.ts:21,462`; `llmRouter.ts:19-55` | Route all LLM calls through `ai_server`; remove client keys |
| C6 | 🔴 | AI Product Lister 100% fails | `AIProductListing.tsx:145`; `aiListingOptimizer.ts:811` | Repoint to `/ai/analyze-product-image` (Groq), like WorkingAIDemo |
| C7 | 🔴 | Bank account numbers may be placeholders | `subscriptionService.ts:32-37` | **Ray verifies real R&R accounts + WhatsApp** |
| C8 | 🔴 | Tickets mint without payment | `Tickets.tsx:161-174` | Verify payment before `purchaseTickets`, or disable ticket sales |

## HIGH

| ID | Status | Risk | File | Fix |
|----|--------|------|------|-----|
| H1 | 🔴 | Password reset is "coming soon" stub | `App.tsx:173` | Add `supabase.auth.resetPasswordForEmail` |
| H2 | 🔴 | AI backend: open CORS + no auth + spoofable rate limit | `main.py:29-35,52-57` | Lock CORS to trinibuild.com; model allowlist; trust Caddy real-IP |
| H3 | 🔴 | `VITE_AI_SERVER_URL=localhost:8000` in env file | `.env.local` | Ensure prod build uses `https://trinibuild.com/ai` |
| H4 | 🔴 | Leaked Google Maps key hardcoded + shipping live | `Directory.tsx:17`; `Settings.tsx:13` | Rotate, referrer-restrict, move to env, delete `trinibuild-google-ai-studio-/` dup folder |
| H5 | 🔴 | No security headers on live site | live `curl -I` | Add HSTS/CSP/X-Frame/etc in Caddy |
| H6 | 🔴 | Live build stale (behind latest commit) | `Last-Modified: Jun 24` | Redeploy per HANDOFF procedure |
| H7 | 🔴 | Directory/Vendors empty or mock | `Directory.tsx:211`; `VendorDirectoryPage.tsx:56-131` | Apply seed `45_seed_demo_directory_and_market.sql`; remove mock vendors |
| H8 | 🔴 | Billable stubs shown with pricing | `ToolWorkspace.tsx`; `EmailCampaignsPage.tsx`; `ToolDetail.tsx:63` | Hide or label coming-soon |

## FABRICATED-TRACTION (legal — T&T Trade Descriptions Act)

| ID | Status | Page | Evidence |
|----|--------|------|----------|
| F1 | 🔴 | DriveWithUs stats | `DriveWithUs.tsx:41-44,336` |
| F2 | 🔴 | Food landing stats + 3 testimonials | `FoodServicesLanding.tsx:102-115,219-239` |
| F3 | 🔴 | Jobs landing fake testimonial | `JobsLanding.tsx:42-49` |
| F4 | 🔴 | Tickets landing "50+ Promoters" | `TicketsLanding.tsx:59` |
| F5 | 🔴 | Referral stats + fake leaderboard | `ReferralProgramPage.tsx:52-55,259-264` |
| F6 | 🔴 | Blog "Roti King 300%" fake story | `Blog.tsx:55`; `BlogPost.tsx:11,32` |
| F7 | 🔴 | AffiliateProgram mock stats/payouts | `AffiliateProgram.tsx:11-39` |
| F8 | 🔴 | Fake "pros" in Jobs tab | `proService.ts:23-130` |

## MEDIUM / deferred

| ID | Status | Risk | Note |
|----|--------|------|------|
| M1 | ⏸ | Stripe dead code reads secret env | Delete `stripeService.ts` |
| M2 | ⏸ | StoreDashboard silent localStorage fallback on save | Surface save failures |
| M3 | ⏸ | Admin Messaging/Automations/Reports hardcoded | Label or wire |
| M4 | ⏸ | JobProfile localStorage-only | Migrate to Supabase |
| M5 | ⏸ | PayPal subscriptions (env plan IDs + activation webhook) | Optional rail |
| M6 | 🟡 | Finish Cloudflare for all domains | From HANDOFF open items |
