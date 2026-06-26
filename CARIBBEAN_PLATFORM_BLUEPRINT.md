# TriniBuild — Caribbean Platform Blueprint
_Authored: 2026-06-26 | Ray Kunjal / R&R Digital Solutions_

> **The mission:** Build the platform that lets any Caribbean person with a phone and a product become a business. As beautiful and simple as Instagram. As powerful as Shopify. Built by us, for us.

---

## 1. The Honest Diagnosis: Where We Are Today

Before we build, let's be ruthlessly honest about what TriniBuild actually is right now vs what it needs to be.

### What works (genuinely)
- ✅ Store builder wizard (4 steps, saves to Supabase)
- ✅ 6 premium templates
- ✅ COD + Bank Pay subscription (real money rails)
- ✅ PayPal subscriptions (just wired — sandbox)
- ✅ AI backend (Groq: chat, vision, blog generation — live-tested)
- ✅ Classifieds, Real Estate, Rides, Tickets (real Supabase data)
- ✅ Affiliate system, Loyalty, Spin Wheel

### The core problem in one sentence
**We have 80+ pages built for 20 different verticals, and we can't reliably sign up a single merchant.**

The primary `/signup` and `/login` pages POST to a backend that doesn't exist. The admin has a public backdoor. The plan tier table has no data. The storefront doesn't show the AI chatbot. Feature gates aren't enforced. 10 pages have fabricated stats.

### The strategic risk
Right now TriniBuild is wide but shallow. An un-technical business owner in Arima or Kingston who lands on the site will be confused by the breadth, find something broken, and leave. We are building a million-dollar brand. That brand is earned by ONE experience working perfectly, not 20 working partially.

---

## 2. The Architecture of a Caribbean Commerce OS

Stop thinking of TriniBuild as a website builder. Think of it as the **operating system for Caribbean commerce** — the layer between a Caribbean entrepreneur and their customer, for everything they need to run a business online.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CARIBBUILD / TRINIBUILD                          │
│              "The Caribbean Commerce Operating System"              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  MERCHANT LAYER                                                     │
│  ─────────────────────────────────────────────────────────────     │
│  ① Store (sell products/services, COD, bank pay, PayPal, WiPay)   │
│  ② AI Chatbot (trained on their business — customer service)       │
│  ③ WhatsApp Commerce (orders, notifications, broadcasts)           │
│  ④ Dashboard (orders, revenue, customers — simple + beautiful)     │
│  ⑤ AI Coach (tells them what to fix, what to stock, when to post)  │
│                                                                     │
│  CUSTOMER LAYER                                                     │
│  ─────────────────────────────────────────────────────────────     │
│  ① Browse stores by island, category, location                     │
│  ② Buy with Caribbean payment methods (no US card required)        │
│  ③ Track COD orders via WhatsApp                                   │
│  ④ Leave reviews, earn loyalty points                              │
│                                                                     │
│  ISLAND LAYER (the expansion model)                                 │
│  ─────────────────────────────────────────────────────────────     │
│  ① Trinidad & Tobago (pilot — live now)                            │
│  ② Jamaica (next — WiPay already live there)                       │
│  ③ Barbados, Guyana, Eastern Caribbean (WiPay already there)       │
│  ④ OECS countries (XCD currency, shared platform)                  │
│                                                                     │
│  PLATFORM REVENUE                                                   │
│  ─────────────────────────────────────────────────────────────     │
│  ① Subscriptions (Pro TT$300 / Premium TT$600 per month)          │
│  ② COD delivery commission (per order)                             │
│  ③ AI tools usage (per generation above plan limit)               │
│  ④ Marketplace commission (% of sales)                             │
│  ⑤ WhatsApp API pass-through (per message above free tier)        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. The One Non-Negotiable: Beautiful Onboarding

This is the make-or-break feature for a million-dollar Caribbean brand. The target user is:
- A 45-year-old woman in Tunapuna who makes sewn goods and sells on WhatsApp
- A 22-year-old man in Kingston who resells sneakers from Instagram DMs  
- A restaurant owner in Bridgetown who has no website and no tech knowledge

**She / He needs to go from "I heard about TriniBuild" to "I have a live store taking orders" in under 5 minutes.**

### The Magic Onboarding Flow (what to build)

```
STEP 1 — Welcome (30 seconds)
┌─────────────────────────────────────────┐
│  🇹🇹  Welcome to TriniBuild             │
│                                         │
│  What's your name?  [First name]        │
│  Which island?      [Dropdown — T&T,    │
│                      Jamaica, Barbados, │
│                      Grenada, other]    │
│                                         │
│  What do you sell?  [I make clothes]    │
│                     [I sell food]       │
│                     [I offer services]  │
│                     [Something else]    │
│                                         │
│         [Let's build your store →]      │
└─────────────────────────────────────────┘

STEP 2 — Name your store (1 minute)
┌─────────────────────────────────────────┐
│  What's your store called?              │
│  [________________________]             │
│                                         │
│  ✨ AI suggests: "Sunshine Threads"     │
│     based on: clothing in T&T           │
│                                         │
│  Pick your vibe:                        │
│  🌺 Island Fresh   🖤 Uptown Clean      │
│  🎨 Bold & Bright  🌿 Natural & Organic │
│                                         │
│         [This looks good →]             │
└─────────────────────────────────────────┘

STEP 3 — Store goes live (30 seconds)
┌─────────────────────────────────────────┐
│  ✅ Your store is LIVE!                 │
│                                         │
│  🔗 trinibuild.com/store/sunshine-      │
│     threads                             │
│                                         │
│  [Copy link]  [Share on WhatsApp]       │
│                                         │
│  Next: Add your first product →         │
└─────────────────────────────────────────┘

STEP 4 — First product (AI-assisted, 2 minutes)
┌─────────────────────────────────────────┐
│  Add your first product                 │
│                                         │
│  📸 [Take/Upload a photo]               │
│                                         │
│  ✨ AI reads the photo and fills in:    │
│     Name: "Handmade Floral Blouse"      │
│     Price: TT$250 (you adjust)          │
│     Description: "Beautiful handmade..." │
│                                         │
│  [Looks good, publish it!]              │
└─────────────────────────────────────────┘

STEP 5 — First customer path (shown, not built yet)
"Your store is ready. Share this link with 
 your first customer to get your first order."
[WhatsApp share button — pre-written message]
```

**THIS is the 5-minute magic.** After this, the merchant has:
- A live store URL they can share
- Their first product listed  
- A WhatsApp share link ready to go
- An email telling them what to do next

---

## 4. The 15 Features We're Missing for a Caribbean-First Platform

Ranked by impact on a paying merchant:

### TIER 1 — Launch blockers (fix in the next 7 days)
1. **Working auth** — `/signup` and `/login` must use Supabase, not a dead Express backend. Non-negotiable before first paid merchant.
2. **Plan tier seeding** — `plan_tiers` table must have Free/Pro/Premium rows in Supabase or the pricing page shows nothing.
3. **Store chatbot on storefronts** — `StorefrontV2` must mount `<ChatWidget mode="vendor" vendorContext={store}>`. The whole bot training feature is useless if the bot never appears for customers.
4. **Feature gates enforced** — Pro merchants must actually get Pro features; free users must actually hit the wall. Right now everyone gets everything (or nothing).
5. **Kill the fake stats** — 10 pages with fabricated traction. Legal risk. Brand risk. Gone before launch.

### TIER 2 — Core product gaps (weeks 2–4)
6. **Beautiful guided onboarding** — The 5-step magic flow described above. This is the brand.
7. **AI-assisted product add** — Photo → AI fills name, description, suggested price. This is the feature that makes non-technical merchants love you. The backend already works (`/ai/analyze-product-image`). Wire it to the product creation modal.
8. **WhatsApp ordering** — Every Caribbean business runs on WhatsApp. When an order is placed on a store: auto-send a WhatsApp message to the merchant with order details. When COD is dispatched: customer gets a WhatsApp update. Use Twilio (or free WhatsApp Business API for low volume). This is table stakes in T&T.
9. **Merchant dashboard, simplified** — The current dashboard (`/store-builder`) is too complex for non-technical users. Build a mobile-first "Today" view: revenue today, orders today, 1 action to take. Think Shopify Home, not an admin panel.
10. **Bot training made simple** — Replace the raw textarea in `StoreBotSettings` with a guided wizard: "What do you sell? → What are your hours? → What's your return policy? → What makes you special?" AI assembles the prompt. Merchant never sees raw text.

### TIER 3 — Caribbean-specific features (weeks 4–8)
11. **Island selector** — Every store should know which island it's on. This determines: currency display, delivery zones, payment methods shown (WiPay Jamaica shows in JMD, WiPay T&T shows in TTD). This is the architecture that lets you expand.
12. **WiPay multi-island** — WiPay now operates in T&T, Jamaica, Barbados, Guyana, Eastern Caribbean. When a merchant signs up in Jamaica, WiPay shows in JMD. This is the fastest Caribbean expansion lever you have.
13. **COD tracking via WhatsApp** — Customer receives WhatsApp updates as their order moves from "confirmed" → "out for delivery" → "delivered". Merchants confirm delivery from their phone. Zero app needed.
14. **AI business coach** — After 30 days, merchant's dashboard shows: "You have 3 products but your top Caribbean stores have 15+. Add 5 more to increase discovery." Real insights from real data. This reduces churn.
15. **Multi-island marketplace** — A single browsing experience where a customer can find businesses across islands. Search "Barbadian hot sauce" and find a real store. This becomes the Caribbean Amazon moment.

---

## 5. The Island Expansion Architecture

Every line of code written from now must be written with island-awareness baked in. Here's the model:

```typescript
// Every store has an island
interface Store {
  island: 'tt' | 'jm' | 'bb' | 'gy' | 'lc' | 'gd' | 'vc' | 'ag' | 'other';
  currency: 'TTD' | 'JMD' | 'BBD' | 'GYD' | 'XCD' | 'USD';
  payment_methods: ('cod' | 'bank_transfer' | 'wipay' | 'paypal' | 'wam')[];
  delivery_zones: string[]; // parishes, counties, districts
}

// Pricing adapts per island  
const ISLAND_CONFIG = {
  tt: { currency: 'TTD', wipay_region: 'tt', pro_price_local: 300, premium_price_local: 600 },
  jm: { currency: 'JMD', wipay_region: 'jm', pro_price_local: 6500, premium_price_local: 13000 },
  bb: { currency: 'BBD', wipay_region: 'bb', pro_price_local: 88, premium_price_local: 176 },
  gy: { currency: 'GYD', wipay_region: 'gy', pro_price_local: 9000, premium_price_local: 18000 },
}
// All billed in USD via PayPal (same backend), displayed in local currency
// Pro = USD$44/mo regardless of island. Customer sees their local equivalent.
```

**The expansion playbook:**
1. T&T pilot → prove the model, get 50 paying merchants
2. Jamaica → same platform, `island: 'jm'`, JMD display, WiPay JM
3. Barbados → `island: 'bb'`, BBD display, WiPay BB
4. Eastern Caribbean → `island: 'lc'|'gd'|'vc'|'ag'`, XCD, WiPay EC
5. Guyana → `island: 'gy'`, GYD, WiPay GY
6. Belize, Suriname → later (different payment landscape)

**This requires zero new infrastructure.** It's config, currency display, and payment routing. The Supabase backend is already multi-tenant. The React frontend just needs island-awareness.

---

## 6. The Payments Reality for the Caribbean

| Island | Primary Merchant Payment | Available Now |
|--------|-------------------------|--------------|
| Trinidad & Tobago | COD + Bank Pay + PayPal | ✅ (just built) |
| Trinidad & Tobago | WiPay T&T | 🟡 (needs API key) |
| Trinidad & Tobago | WAM | ⏳ (awaiting permission) |
| Jamaica | WiPay Jamaica (JMD + USD) | 🟡 (needs JM merchant account) |
| Barbados | WiPay Barbados | 🟡 |
| Eastern Caribbean | WiPay EC (XCD) | 🟡 |
| All islands | PayPal (subscription billing) | ✅ (sandbox, flip to live) |
| All islands | Bank transfer | ✅ (manual, always works) |

**The strategy:** PayPal works everywhere now. WiPay follows per island as you sign merchant accounts. WAM when permission comes. Bank transfer is the backup that never fails.

---

## 7. The Build Sequence (What to Actually Do)

### Week 1 — Make it work for first merchants (T&T pilot)
- [ ] Fix `/signup` and `/login` → Supabase auth
- [ ] Delete `/admin/bypass`
- [ ] Seed `plan_tiers` + `user_plan_subscriptions` in Supabase
- [ ] Add bot columns to `stores` table: `bot_name`, `bot_persona`, `bot_system_prompt`
- [ ] Mount `<ChatWidget>` on `StorefrontV2` with vendor context
- [ ] Strip 10 fake-stat pages (replace with honest "Coming soon" framing)
- [ ] Gate bot settings to Pro+ plan
- [ ] Verify: end-to-end guest can sign up → create store → add product → receive COD order

### Week 2 — Make it beautiful
- [ ] Build the Magic Onboarding Flow (5 steps, described above)
- [ ] Mobile-first "Today" dashboard: revenue, orders, 1 action
- [ ] Replace `StoreBotSettings` raw textarea with guided bot training wizard
- [ ] AI product scan wired into product creation modal (photo → AI fills form)
- [ ] WhatsApp order notification to merchant on every new order

### Week 3 — Solidify the platform
- [ ] Add `island` field to store creation flow
- [ ] Island-aware currency display throughout
- [ ] Plan features clearly shown in dashboard ("You're on Free — upgrade to unlock...")
- [ ] PayPal flip from sandbox to live (test 3 real subscriptions first)
- [ ] Security headers on live site
- [ ] Finish Cloudflare

### Week 4–6 — Caribbean-ready
- [ ] WiPay integration (proper — server-side via Supabase edge function, not browser)
- [ ] COD WhatsApp tracking (merchant confirms → customer gets WhatsApp)
- [ ] Jamaica as second island in store creation flow
- [ ] Pricing displayed in local currency per island
- [ ] AI Business Coach: "You have 3 products. Top stores in your category have 15+"

### Month 2–3 — Growth features
- [ ] Multi-island marketplace browse page
- [ ] AI auto-build: type a business name → AI drafts the store
- [ ] Review system (real, no fake stars)
- [ ] Referral program (working backend, not mock)
- [ ] WhatsApp broadcast to customer list

### Month 4–6 — Scale
- [ ] Barbados + Eastern Caribbean islands
- [ ] WAM payment integration (if permission received)
- [ ] Outbound AI team: scrape local businesses → auto-generate preview stores → email to claim
- [ ] Native mobile app (PWA first, then React Native)
- [ ] Multi-vendor marketplace commission system

---

## 8. The Brand Principles (What Makes This a Million-Dollar Company)

**1. "We built this for us."**
Every other platform (Shopify, WooCommerce, Wix) was built for North America then modified for the Caribbean. We build Caribbean-first. The AI knows what a "doubles vendor" is. The bot can say "check back on Saturday after Carnival." The templates look like Caribbean businesses, not American ones.

**2. "You can do this on your phone, right now."**
If a merchant needs a laptop to set up their store, we've failed. Every critical flow — onboarding, adding products, checking orders, responding to customers — must work on a basic Android phone on a 3G connection in Chaguanas or Montego Bay.

**3. "Your first sale in 24 hours."**
That's the promise. Onboard today, share your store link, get an order by tomorrow. Everything we build must serve this promise. If a feature doesn't directly contribute to a merchant getting their first sale faster, it's a distraction.

**4. "We grow when you grow."**
Free forever for the basics. Charge only when we're clearly adding value. Never hide the upgrade path — make it obvious what paid unlocks and why it matters. Show merchants their money: "This month your store did TT$4,200 in orders. Upgrade to Pro for TT$300 and unlock [specific feature] to do TT$6,000 next month."

**5. "The Caribbean is not a market. It's a culture."**
The AI speaks Trini, Bajan, Jamaican. The templates look like Caribbean businesses. The default photos are Caribbean people. The success stories (when we have real ones) are from our community. You don't feel like you're using an American platform that tolerates you. You feel like this was made for you.

---

## 9. The Metrics That Tell You You're Building a Million-Dollar Brand

| Metric | Week 4 Target | Month 6 Target | Year 1 Target |
|--------|---------------|----------------|---------------|
| Stores created | 50 | 500 | 5,000 |
| Paying subscribers | 5 | 50 | 500 |
| MRR (USD) | $220 | $2,200 | $22,000 |
| Islands active | 1 (T&T) | 2 (T&T + JM) | 5 |
| Orders processed | 20 | 500 | 10,000 |
| Onboarding time (avg) | <8 min | <5 min | <3 min |
| NPS (merchant satisfaction) | — | 50+ | 70+ |

---

## 10. What NOT to Build (Now)

Every hour spent on these is an hour not spent on the above:

- ❌ A custom rides/taxi app (Uber exists, partnerships are better)
- ❌ A jobs board from scratch (LinkedIn exists in T&T, compete with value not features)
- ❌ A full real estate platform (too regulated, too complex for now)
- ❌ A digital gaming reseller (low margin, high complexity)
- ❌ A full email marketing platform (integrate Mailchimp/Resend, don't rebuild it)
- ❌ A news/blog platform (content is a growth tool, not a product)
- ❌ Admin Command Center features that no paying merchant will ever touch

These aren't bad ideas. They're ideas for Year 2 when you have 500 paying merchants and a team. Right now every one of these is a distraction from the 5-minute magic onboarding that makes someone's life better today.

---

## 11. First Decisions You Need to Make

Before we write another line of code, Ray — these are the calls only you can make:

1. **The pricing** — TT$300/mo Pro and TT$600/mo Premium. Is that right for launch? (We need this to seed the database.)
2. **The bank accounts** — Confirm `subscriptionService.ts:32-37` has real R&R accounts. This is where Bank Pay subscriptions go.
3. **PayPal live** — You have the sandbox. When do you want to flip to live billing?
4. **Island 2** — Jamaica or Barbados first? (Determines which WiPay merchant account to open next.)
5. **WhatsApp number** — Do you have a WhatsApp Business number for TriniBuild notifications? This is the fastest growth lever you have.
6. **The brand name across islands** — Is it "TriniBuild" in Jamaica, or does it get a new name ("CaribBuild"? "IslandBuild"?) as you expand?

---

_This document is the north star. Every feature request, every code change, every design decision — run it against this blueprint. If it doesn't serve a Caribbean merchant getting their first sale, it can wait._

_Next step: Confirm the 6 decisions above, then dispatch fix-swarm on Week 1 items._
