# Week 7 Build Spec — Review Booster + QR Review Cards

## Goal

Build a review-generation tool that helps Trinidad & Tobago small businesses collect more 5-star Google reviews and turn happy customers into public testimonials — while privately capturing unhappy feedback before it goes public. Vendors get a shareable review page (linked from a printable QR card), a private feedback form, a public testimonial wall, and AI-generated review-request messages and social posts.

## Features

### Vendor (authenticated) side
- **Review request generator** — vendor enters customer context (name, what they bought, channel: WhatsApp/SMS/email); AI writes a short, friendly review-request message with a link to `/r/:businessSlug`. Copy or send directly.
- **QR code review card** — generate a QR code that resolves to `/r/:businessSlug`; download as PNG/SVG and print as a counter card / table tent / receipt sticker.
- **Google review link field** — vendor pastes their Google Business review URL; the public review page's "Leave a Google Review" button deep-links there.
- **Private feedback form** — on the public review page, customers who had a bad experience are routed to a private form (not public) so the vendor can follow up before a public negative review is posted.
- **Public testimonial display** — vendor curates approved positive feedback into a testimonial wall embedded on the public review page and optionally on their main site.
- **Negative feedback capture** — a dashboard inbox for private feedback (low ratings or complaint text) with status (new, responded, resolved).
- **Review request schedule text** — vendor can save a reusable scheduled SMS/WhatsApp reminder template for post-visit follow-up.
- **Testimonial social post generator** — AI turns an approved testimonial into a ready-to-post Facebook/Instagram/WhatsApp caption (with hashtags and emojis, T&T flavor).

### Public side
- **Public review page** at `/r/:businessSlug` — shows business name, a "Leave a Google Review" CTA (deep-link), a quick star-rating selector, and two paths:
  - **Happy path (4–5 stars):** → Google review link + option to leave a public testimonial.
  - **Unhappy path (1–3 stars):** → private feedback form (name optional, contact optional, message required). Never shown publicly.
- **Testimonial wall** — approved testimonials displayed publicly with first name + star rating + date.

## Pages (route paths)

| Route | Auth | Purpose |
|---|---|---|
| `/dashboard/tools/review-booster` | vendor | Overview — rating stats, recent feedback, quick links |
| `/dashboard/tools/review-booster/qr-cards` | vendor | QR code generator + downloadable card designs |
| `/dashboard/tools/review-booster/testimonials` | vendor | Approve/reject testimonials, generate social posts, view private feedback inbox |
| `/r/:businessSlug` | public | Review page + star gate + testimonial form / private feedback form |

Dashboard routes nested under existing `HashRouter` + `authService`. Public route is standalone.

## AI Outputs (what the AI generates)

1. **Review request message** — Input: business name, customer name, item/service, channel. Output: 1 short message (<=160 chars for SMS, <=300 for WhatsApp) with the `/r/:slug` link and a friendly T&T-toned ask. Provide 2 variants.
2. **Testimonial social post** — Input: approved testimonial text + business name. Output: a Facebook/Instagram/WhatsApp caption (<=500 chars) with hashtags, emojis, and a call to follow/visit. One-click copy.

## Supabase Tables (SQL)

```sql
-- Per-business review configuration
create table public.review_settings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.profiles(id) on delete cascade,
  business_slug text not null unique,
  google_review_url text,
  thank_you_message text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Outbound review request log (optional tracking)
create table public.review_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.profiles(id) on delete cascade,
  customer_name text,
  customer_contact text,
  channel text check (channel in ('whatsapp','sms','email')),
  message_text text not null,
  sent_at timestamptz,
  status text not null default 'draft' check (status in ('draft','sent','clicked','reviewed')),
  created_at timestamptz not null default now()
);

-- Private (unhappy) feedback — never public
create table public.private_feedback (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.profiles(id) on delete cascade,
  customer_name text,
  customer_contact text,
  rating int check (rating between 1 and 5),
  message text not null,
  status text not null default 'new' check (status in ('new','responded','resolved')),
  vendor_response text,
  created_at timestamptz not null default now()
);

-- Public testimonials (curated/approved)
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.profiles(id) on delete cascade,
  author_name text not null,
  rating int not null check (rating between 1 and 5),
  body text not null,
  source text check (source in ('google','direct','imported')),
  is_approved boolean not null default false,
  is_published boolean not null default false,
  social_post text,
  created_at timestamptz not null default now()
);
```

RLS:
- `review_settings`: vendor CRUD where `business_id = auth.uid()`; public `select` where `is_active = true` (by slug).
- `review_requests`: vendor-only CRUD via `business_id`.
- `private_feedback`: public `insert` (for active businesses), vendor `select/update` via `business_id`; no public `select`.
- `testimonials`: public `select` where `is_published = true`; vendor full CRUD via `business_id`.

## Digital Download Version

**Product:** Google Review Booster Kit
**Price:** $27 USD
**Deliverables (zip):**
- Printable QR review cards (3 designs: counter tent, receipt sticker, table card) — PDF + Canva template
- QR code generator cheat sheet (how to point a QR at `/r/:slug`)
- 25 review-request message templates (WhatsApp + SMS + email, T&T tone)
- "Bad review recovery" script PDF (what to say when a customer is unhappy)
- Testimonial social post prompt library
- 7-day review campaign playbook PDF
- Follow-up schedule templates

Listed in `/downloads`; purchase yields a 72-hour signed download link.

## Codex Prompt (detailed prompt for the Codex CLI agent)

```
You are building the "Review Booster + QR Review Cards" feature for TriniBuild (React + Vite + TypeScript + Tailwind + Supabase + Google Gemini).

Reuse:
- services/supabaseClient.ts, services/authService.ts (current profile with .id and .business_slug)
- services/geminiService.ts (extend; do not recreate the Gemini client)
- HashRouter in App.tsx

Tasks:
1. Run the SQL from the build spec to create: review_settings, review_requests, private_feedback, testimonials. Apply RLS per spec.
2. services/reviewService.ts: getReviewSettingsBySlug, getReviewSettingsForVendor, upsertReviewSettings, createReviewRequest, listReviewRequests, insertPrivateFeedback, listPrivateFeedback, updatePrivateFeedbackStatus, submitTestimonial, listTestimonialsForVendor, approveTestimonial, publishTestimonial, deleteTestimonial.
3. services/reviewAiService.ts: generateReviewRequest({businessName, customerName, item, channel}) → returns {variant1, variant2}; generateSocialPost({testimonial, businessName}) → returns caption string. Guard with try/catch + toast.
4. QR code: use a client-side QR library (e.g. qrcode.react) to render the QR pointing at /r/:slug (use the public site base URL). Provide PNG + SVG download.
5. Pages:
   - pages/tools/ReviewBoosterOverview.tsx — rating distribution, counts (requests sent, feedback received, testimonials published), recent private feedback.
   - pages/tools/ReviewQrCards.tsx — QR preview, business name field, Google review URL field, download PNG/SVG, printable card preview (3 layouts).
   - pages/tools/Testimonials.tsx — two tabs: "Testimonials" (approve/publish/delete, "Generate Social Post" button, copy button) and "Private Feedback" (inbox with status workflow).
   - pages/public/PublicReview.tsx (route /r/:businessSlug) — business header, Google review CTA, 5-star selector; if >=4 → testimonial form + Google link; if <=3 → private feedback form. Approved testimonial wall below.
6. Styling: Tailwind, match existing dashboard components, mobile-first public page.
7. Loading + error states everywhere (skeletons + toasts). No inline Supabase calls in components — go through services.
8. TypeScript strict, no any. Keep Gemini API key off the client bundle.

Acceptance: all routes load, vendor configures review settings + Google link, public page star-gates correctly, testimonials approve/publish, private feedback reaches the vendor inbox, AI generates request messages and social posts.
```

## Acceptance Criteria

1. **Review settings** — Vendor sets their Google review URL and an optional thank-you message; settings persist and are readable by the public page.
2. **QR card** — Vendor can generate a QR code for `/r/:businessSlug` and download it as PNG and SVG.
3. **Public review page** — `/r/:businessSlug` loads without auth, shows the business name and Google review CTA.
4. **Star gate** — Selecting 4–5 stars routes to the testimonial form + Google review link; selecting 1–3 stars routes to the private feedback form. The private form is never displayed in the happy path.
5. **Private feedback** — A submitted private feedback entry appears in the vendor's "Private Feedback" inbox with status `new`. Vendor can mark `responded` or `resolved` and save a response.
6. **Testimonials** — A submitted (happy-path) testimonial lands as `is_approved=false`. Vendor can approve, publish, generate a social post, copy it, or delete. Published testimonials show on the public testimonial wall.
7. **AI review request** — Generator produces 2 message variants from business + customer context; copy-to-clipboard works.
8. **AI social post** — Generates a caption from an approved testimonial; copy works.
9. **RLS** — Private feedback is never publicly readable; testimonials only public when `is_published=true`; vendors can't access other businesses' data.
10. **Mobile** — Public review page is responsive.
