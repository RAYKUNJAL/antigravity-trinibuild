# TriniBuild — Full Launch-Readiness Audit

_Audit date: 2026-06-25 · Target: first paying merchants next week · Auditor: Hermes (Ray-led money path + 3 verification subagents, all findings cross-checked against source)_

> **Bottom line:** The platform is broad and a real Supabase data layer exists under the store/storefront/verticals. But it is **NOT launch-safe today.** Two things will stop money or break trust on day one: (1) the **primary signup/login pages are dead in production** (they POST to an `/api` backend that doesn't exist — verified HTTP 405 live), and (2) a **public admin backdoor** at `/admin/bypass`. There are also ~10 fabricated-traction violations that breach your own legal rule. None are hard to fix; they just have to be fixed before you charge anyone.

---

## 1. Status at a glance (code vs live)

| Status | Area |
|--------|------|
| ✅ **Works** | Supabase store creation (StoreBuilderV3), storefront render, COD + Bank-transfer record, **Bank Pay subscription** flow, AI backend (Groq: chat/vision/generate all live-tested OK), Classifieds, Real Estate, Rides, Driver hub, Affiliate dashboard (`/earn`), Loyalty, Spin Wheel, Tickets data, most Admin monitors (real Supabase counts) |
| 🔴 **Broken / unsafe** | `/signup` + `/login` (dead `/api` backend), `/admin/bypass` public backdoor, client-forgeable ProtectedRoute, anon storefront checkout (RLS), AI Product Lister (browser OpenAI key, not set), WiPay + Google Pay + Stripe rails, Tickets "pay" mints tickets without payment |
| 🟡 **Pending external** | Real R&R bank account numbers, PayPal plan IDs + activation webhook, `VITE_AI_SERVER_URL` prod value, security headers, Cloudflare, redeploy (live build is behind code) |
| ⚪ **Stub / facade** | EmailCampaigns, ToolWorkspace, Deals, AffiliateProgram (old), ReferralProgram, MessagingCenter, Automations, ReportsAnalytics, Blog/BlogPost sample posts, several marketing landing pages with fake stats |

**Code status:** functional core, unsafe auth + payment wiring.
**Live status:** build is stale (Last-Modified Jun 24, older than latest commit) and ships **zero security headers**. A redeploy is required regardless of fixes.

---

## 2. CRITICAL launch blockers (fix before charging anyone)

| # | Blocker | Evidence | Lane |
|---|---------|----------|------|
| C1 | **Primary signup & login are dead in prod.** `/signup`→`SignupPageSimple`, `/login`→`LoginPageSimple` both call `simpleAuthService` → POST `/api/auth/*`. Live test: every `/api/*` = **HTTP 405, no backend.** New merchants cannot make an account on the main pages. | `App.tsx:73,96`; `simpleAuthService.ts:24,83`; live `curl` 405 | Core/Auth |
| C2 | **Public admin backdoor.** Visiting `/admin/bypass` writes a fake `role:'admin'` user to localStorage and drops you into the full Command Center (user mgmt, finance, system health). No auth. | `AdminBypass.tsx:11-26`; routed `App.tsx:221` | Security |
| C3 | **All route protection is forgeable.** `ProtectedRoute` → `authService.isAuthenticated()` trusts any `localStorage.user`. Devtools one-liner unlocks every "protected" dashboard. | `ProtectedRoute.tsx:15`; `authService.ts` localStorage-first | Security |
| C4 | **Anonymous storefront checkout likely fails on RLS.** `StorefrontV2` calls `storeService.createOrder` (direct `orders` insert). The repo's own `orderService` says anon direct inserts are RLS-blocked and must go through a `place-order` edge function — which isn't in the repo. Breaks the core COD revenue path for guest shoppers. | `StorefrontV2.tsx:180`; `storeService.ts:404`; `orderService.ts:12-14` | Core/Checkout |
| C5 | **Browser-exposed LLM API keys.** `ai.ts`, `aiListingOptimizer.ts`, `llmRouter.ts`, `listingOptimizer.ts` call OpenAI/Gemini/Claude/xAI/DeepSeek **directly from the browser** with `VITE_*` keys — extractable from the bundle. (Currently unset, so they also throw — see C6 — but any key you add leaks.) | `ai.ts:21,462`; `llmRouter.ts:19-55`; `aiListingOptimizer.ts:811` | AI |
| C6 | **AI Product Lister (`/products/ai-add`) 100% fails.** Headline merchant feature throws `OPENAI_API_KEY not configured` on first use (key not in env, and it's the wrong architecture anyway). The working pattern already exists: server-side Groq vision at `/ai/analyze-product-image`. | `AIProductListing.tsx:145`; `aiListingOptimizer.ts:811` | AI |
| C7 | **Bank account numbers may be placeholders.** Subscription "Pay at the Bank" shows accounts `200-456-7890` etc. + WhatsApp `+1 (868) 123-4567`. If not your real R&R Digital accounts, every paying customer wires money into the void. **Only Ray can verify.** | `subscriptionService.ts:32-37`; `PricingPage.tsx:319` | Money |
| C8 | **Tickets mint without payment.** `Tickets.tsx` shows `alert("Processing payment…")` then creates tickets in Supabase regardless of payment result. Free-ticket exploit. | `Tickets.tsx:161-174` | Money |

---

## 3. Money path (Ray-led, fully verified)

**TriniBuild gets paid (TT$300/mo subscription):**
- ✅ **Bank Pay** — real: `bank_subscription_payments` insert + Supabase Storage receipt upload, manual verify. **Your one solid paid rail.** (`subscriptionService.ts:69`, `PricingPage.tsx:62`)
- 🔴 **PayPal "Pay with Card"** — links to `plan_id=${VITE_PAYPAL_PLAN_GROWTH}`; env var **not set** → links to `undefined`. No webhook, so even a real PayPal sub never activates the user (`upgradePlanPayPal` never called). (`PricingPage.tsx:180`, `subscriptionService.ts:123`)
- 🔴 **Stripe** — dead code; unusable in T&T; reads `VITE_STRIPE_SECRET_KEY` (would leak secret in bundle). Delete. (`stripeService.ts:27`)

**Store customers pay:**
- ✅ COD + Bank transfer — real Supabase inserts (`paymentService.ts:107,137`) — _but gated by the C4 RLS issue for guests._
- 🔴 WiPay — posts `VITE_WIPAY_API_KEY` from browser (leak) and key unset (`paymentService.ts:43`).
- 🔴 Google Pay — calls `/api/process-google-pay` → 405, no backend (`paymentService.ts:81`).

**Infra fact:** no Node `/api/*` backend is deployed. Caddy serves the static SPA + the `/ai/*` FastAPI container only. Every Stripe / Google Pay / PayPal-capture / Express-auth call is dead on arrival.

---

## 4. AI suite

- ✅ **Backend is real** — `ai_server/main.py`, 7 Groq endpoints, all live-tested OK. Sliding-window rate limiting exists.
- 🔴 **Backend hardening gaps:** open CORS `*` + `allow_credentials=True`; no auth on any route; `X-Forwarded-For` trusted blindly (rate-limit bypass); client-supplied `system_prompt`/`model` on `/generate` + `/chatbot-reply` = uncapped Groq billing faucet. (`main.py:29-35,52-57,116,123`)
- 🔴 **Vision/lister key exposure** — see C5/C6.
- 🟡 **Silent fallbacks** — every `aiService` method returns a canned "Trini" reply on failure, so a down backend looks like it's working. (`ai.ts:526-572`)
- ⚪ **Billable stubs shown with pricing:** `ToolWorkspace` = "under construction"; `EmailCampaignsPage` = 100% hardcoded mock; `ToolDetail` shows `$/mo` + "Activate" for tools that go nowhere.
- 🟡 **`VITE_AI_SERVER_URL` in `.env.local` = `http://localhost:8000`** — confirm prod build injects `https://trinibuild.com/ai` or all chat silently falls to canned replies.

---

## 5. Verticals & Admin (33 vertical pages, 19 admin pages)

**REAL (launch-ready):** Tickets data, PromoterOnboarding, Events, Rides, DriverOnboarding/SignupAI/Hub, RealEstate + AgentDashboard, Classifieds, DigitalServicesHub, AffiliateDashboard (`/earn`), Loyalty, SpinWheel, SuccessStories (honest — model page), BlogGenerator, and 15/19 admin monitors (real Supabase counts, some metrics openly marked "estimate").

**STUB / facade:** Deals, AffiliateProgram (old mock), ReferralProgram, EmailCampaigns, ToolWorkspace, HelpSupport (FAQ only), Blog/BlogPost samples, JobProfile (localStorage only), Jobs "Find a Pro" tab (`proService` mock), and admin MessagingCenter / Automations / ReportsAnalytics (hardcoded).

**Admin gating:** `/admin/command-center` deliberately skips `ProtectedRoute` ("No ProtectedRoute to allow bypass" — `App.tsx:324`). Combined with C2/C3 = wide open.

---

## 6. 🚨 Fabricated-traction violations (your hard legal rule — T&T Trade Descriptions Act)

Pre-revenue, zero sales = every specific number below is fabricated. Remove or replace before launch:

1. `DriveWithUs.tsx:41-44,336` — "500+ Active Drivers", "$800 Avg Weekly Earnings", "4.9 Driver Rating", "thousands of drivers already making money".
2. `landing/FoodServicesLanding.tsx:102-115` — "200+ Food Businesses", "5K+ Daily Orders", "TT$500K+ Monthly Sales", "4.9★".
3. `landing/FoodServicesLanding.tsx:219-239` — 3 fake testimonials (Uncle Ravi / Michelle Chen / Sarah Mohammed) under "Real Trinidad Food Businesses Using TriniBuild".
4. `landing/JobsLanding.tsx:42-49` — fake "Amanda K. ★★★★★ (42 Reviews)" testimonial.
5. `landing/TicketsLanding.tsx:59` — "Trusted by 50+ Promoters".
6. `ReferralProgramPage.tsx:52-55` — "2,340+ Active Referrers", "12,450+ Total Referrals", "TT$4.2M+ Commissions Paid".
7. `ReferralProgramPage.tsx:259-264` — fake leaderboard (Rajesh M., Maria S., …).
8. `Blog.tsx:55` + `BlogPost.tsx:11,32` — fabricated "Roti King increased sales 300%" story attributed to your own name.
9. `AffiliateProgram.tsx:11-39` — mock stats + fake payout history TX-992/884/771.
10. `proService.ts:23-130` — 6 fake "pros" (Michael Scott, Sarah Jenkins…) feeding the Jobs "Find a Pro" tab.

`SuccessStoriesPage.tsx` is the gold standard you already approved — bring every page to that honesty level.

---

## 7. Recommended day-one launch scope (the safe cut)

**Sell only what works, hide the rest:**
1. **Auth:** route `/login` + `/signup` → the Supabase `Auth` page (or rewrite the Simple pages to Supabase). Add password reset (`resetPasswordForEmail`).
2. **Kill C2/C3:** delete `AdminBypass` route + file; gate admin behind a real server-side role check.
3. **Fix C4:** point `StorefrontV2` at `orderService` (edge function) or add an RLS policy for anon order inserts; test a real guest COD order end-to-end.
4. **Money:** Bank Pay (verify real accounts — C7) + COD/bank-transfer only. Hide WiPay/Google Pay/Stripe buttons. Disable ticket purchase or gate it (C8).
5. **AI:** ship Lime chat + the working Groq vision scanner (`WorkingAIDemo`). Hide the broken Product Lister, EmailCampaigns, ToolWorkspace until routed through the backend. Lock CORS + add an allowlist on `/generate`.
6. **Honesty:** strip all 10 fabricated-traction items.
7. **Live:** add security headers in Caddy, set prod `VITE_AI_SERVER_URL`, rotate the leaked Google Maps key, redeploy.

Defer (label "Coming Soon"): Deals, ReferralProgram, EmailCampaigns, paid AI tools, Jobs "Find a Pro", admin Messaging/Automations/Reports.

---

## 8. Fix-swarm lanes (proposed)

| Lane | Owner | Scope |
|------|-------|-------|
| Auth & accounts | agent | Unify on Supabase; fix /login,/signup; password reset; delete AdminBypass; server-side admin gate |
| Checkout/RLS | agent | StorefrontV2→edge function or anon RLS policy; verified guest COD order |
| Money rails | Ray + agent | Verify bank accounts; hide dead rails; gate tickets; (optional) PayPal env+webhook |
| AI hardening | agent | Move vision/lister to Groq backend; lock CORS+allowlist; remove browser keys; hide stubs |
| Honesty pass | agent | Remove 10 fabricated-traction items; replace with founding-merchant framing |
| Infra | agent | Security headers; prod env; rotate Maps key; redeploy; finish Cloudflare |

_See `LAUNCH_RISK_TRACKER.md` for the live tracker._
