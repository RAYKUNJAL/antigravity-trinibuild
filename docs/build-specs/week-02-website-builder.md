# Week 2 Build Spec — AI Business Website Builder

## Goal

Build an AI-powered single-page business website builder for Caribbean small businesses (sole traders, food vendors, salons, auto repair, retail shops). The user enters basic business info through an intake wizard; Google Gemini AI generates professional website copy (tagline, description, about, services, SEO); the user edits and publishes a public business page at `/b/:businessSlug`. The page includes WhatsApp CTA, Google Maps embed, opening hours, photo gallery, and a QR code linking to the live page.

This is Week 2 of the TriniBuild AI Services Marketplace. It assumes Week 1 (auth, dashboard shell, Supabase client, routing) is complete.

## Features

### Core
- **Business intake wizard** — 4-step form: (1) business name + category dropdown [Food/Vendor, Salon/Beauty, Auto Repair, Retail Shop, Professional Services, Health/W Wellness, Fitness, Other]; (2) location (address text, city, country dropdown [TT, JA, BB, Guyana, other Caribbean]); (3) contact (WhatsApp number with country code, phone, email, website); (4) services (add up to 10 service names + optional base price in TTD/JMD/BBD). Each step validates before next.
- **AI business description generator** — "Generate Copy" button calls Gemini with the intake data + selected Caribbean context (country, local slang/tone toggle). Returns structured JSON (see AI Outputs). User reviews in editor, can regenerate per field.
- **Services section** — editable list: service name, description, price, optional "starting from" flag. Reorder by drag or up/down arrows.
- **WhatsApp CTA button** — floating button on public page, opens `https://wa.me/<number>?text=<encoded greeting>`. Greeting text is AI-generated and editable.
- **Google Maps embed** — user pastes a Google Maps share link or lat/lng; page embeds an `<iframe>` with the maps embed URL. Validate the URL starts with `https://www.google.com/maps/embed`.
- **Opening hours** — weekly grid (Mon–Sun), each day: open time, close time, or "Closed". Stored as JSON in `business_pages.opening_hours`.
- **Photo gallery** — upload up to 12 images to Supabase Storage bucket `business-photos`. Show grid on public page, lightbox on click. Images tied to business_page via `page_id`.
- **SEO title + meta description** — AI-generated, editable, rendered into `<title>` and `<meta name="description">` on public page. Also generate Open Graph tags (`og:title`, `og:description`, `og:image` from first gallery photo).
- **QR code for business page** — generate QR PNG encoding the public URL `https://<app-domain>/b/<slug>` using a client-side QR library (e.g. `qrcode` npm). Downloadable PNG, also shown on dashboard preview.
- **Publish / unpublish** — toggle `business_pages.is_published`. Unpublished pages return a 404-style "This business page is not yet published" screen on the public route.

### Editor page
- Left: live preview iframe of the public page (updates on save).
- Right: tabbed editor — Sections tab (hero, about, services, gallery, hours, map, CTA), SEO tab (title, meta, OG), Settings tab (slug, publish toggle, theme color picker from a preset palette of 8 Caribbean-themed colors).
- Save button writes to `business_pages` + `page_sections` + `page_seo`.
- Auto-save every 30s if changes exist (debounced).

## Pages (route paths)

| Route | Purpose | Auth |
|---|---|---|
| `/dashboard/tools/website-builder` | Tool landing — list of user's business pages, "Create New" button, recent pages cards | Required |
| `/dashboard/tools/website-builder/editor` | Intake wizard → AI generate → editor for a single business page. Query param `?id=<page_id>` opens existing page in editor; no param starts wizard. | Required |
| `/b/:businessSlug` | Public business page. If `is_published=false` or slug not found, show "not published/not found" state. | Public |

All dashboard routes are children of the existing HashRouter `App.tsx` layout. Reuse the existing `DashboardLayout` shell from Week 1. Public route `/b/:businessSlug` is a top-level route, not under dashboard.

## AI Outputs (what the AI generates)

Single Gemini call with a structured prompt returns JSON:

```json
{
  "tagline": "Short one-line business tagline, Caribbean-friendly tone",
  "business_description": "2-3 sentence hero description for the top of the page",
  "about_section": "1 paragraph (~80-120 words) about the business, its story/roots",
  "service_descriptions": [
    { "service_name": "...", "description": "1-2 sentence description" }
  ],
  "seo_title": "<= 60 chars, includes business name + city + keyword",
  "seo_meta_description": "<= 160 chars, includes services + location + CTA",
  "whatsapp_greeting_text": "Friendly greeting a customer sees when clicking the WhatsApp button, e.g. 'Hi! I saw <Business Name> online and I'd like to...'"
}
```

Prompt must include: business name, category, country/city, services list, selected tone (Professional / Warm & Friendly / Trinbagonian dialect / Jamaican dialect / Bajan dialect — user picks). Use `gemini-2.0-flash` via the existing Gemini service. Parse JSON robustly (strip markdown fences, try/catch, fallback to raw text per field on parse failure). Store AI outputs across `page_sections` (type=hero/about/services) and `page_seo`.

User can click "Regenerate" on any single field — a secondary prompt re-asks for just that field using the existing context as input.

## Supabase Tables (SQL)

Run these migrations in Supabase SQL editor (or as a migration file `supabase/migrations/0002_business_pages.sql`):

```sql
-- Business pages (one per published business website)
create table if not exists public.business_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null,
  category text not null,
  country text not null default 'TT',
  city text,
  address text,
  whatsapp_number text,        -- E.164 e.g. "+1868XXXXXXX"
  phone text,
  email text,
  website text,
  business_slug text not null unique,
  theme_color text default '#00A859',
  opening_hours jsonb,          -- {"mon":{"open":"09:00","close":"17:00"},"tue":...}
  map_embed_url text,
  is_published boolean not null default false,
  status text not null default 'draft',  -- draft | generating | published | archived
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_pages_user_idx on public.business_pages(user_id);
create index if not exists business_pages_slug_idx on public.business_pages(business_slug);

-- Page sections (one business page has many sections)
create table if not exists public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.business_pages(id) on delete cascade,
  section_type text not null,         -- hero | about | services | gallery | hours | map | cta
  content jsonb not null,             -- schema depends on section_type (see below)
  sort_order int not null default 0,
  ai_generated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists page_sections_page_idx on public.page_sections(page_id);

-- Section content schemas (documented, enforced in app, not DB):
-- hero:      {"tagline": "...", "business_description": "...", "headline_image_url": "..."}
-- about:     {"heading": "About Us", "body": "..."}
-- services:  {"items": [{"name","description","price","starting_from"}]}
-- gallery:   {"items": [{"image_url","caption"}]}
-- hours:     {"days": [{"day","open","close","closed"}]}
-- map:       {"embed_url": "...", "caption": "Find us"}
-- cta:       {"whatsapp_number","whatsapp_greeting_text","button_label"}

-- Page SEO (one-to-one with business page)
create table if not exists public.page_seo (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null unique references public.business_pages(id) on delete cascade,
  seo_title text,
  meta_description text,
  og_title text,
  og_description text,
  og_image_url text,
  keywords text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Storage bucket for gallery photos
-- Run via Supabase Storage API or SQL:
insert into storage.buckets (id, name, public) values ('business-photos', 'business-photos', true)
  on conflict (id) do nothing;

-- RLS policies
alter table public.business_pages enable row level security;
alter table public.page_sections enable row level security;
alter table public.page_seo enable row level security;

-- Owner can CRUD their own rows
create policy "owner crud business_pages" on public.business_pages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner crud page_sections" on public.page_sections
  for all using (
    exists (select 1 from public.business_pages p
            where p.id = page_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.business_pages p
            where p.id = page_id and p.user_id = auth.uid())
  );
create policy "owner crud page_seo" on public.page_seo
  for all using (
    exists (select 1 from public.business_pages p
            where p.id = page_id and p.user_id = auth.uid())
  );

-- Public read: anyone can view published business pages + their sections + seo (for /b/:slug)
create policy "public read published business_pages" on public.business_pages
  for select using (is_published = true);
create policy "public read sections of published pages" on public.page_sections
  for select using (
    exists (select 1 from public.business_pages p
            where p.id = page_id and p.is_published = true)
  );
create policy "public read seo of published pages" on public.page_seo
  for select using (
    exists (select 1 from public.business_pages p
            where p.id = page_id and p.is_published = true)
  );

-- Storage policies for business-photos bucket
create policy "owner upload photos" on storage.objects for insert
  with check (bucket_id = 'business-photos' and auth.uid() is not null);
create policy "public read photos" on storage.objects for select
  using (bucket_id = 'business-photos');
create policy "owner delete own photos" on storage.objects for delete
  using (bucket_id = 'business-photos' and auth.uid() = owner);
```

Slug generation: lowercase business name, spaces→hyphens, strip non-alphanumerics, append 4-char random suffix if collision. Uniqueness enforced by DB unique constraint — on collision, retry with suffix.

## Digital Download Version

**Product:** Caribbean Business Website Copy Kit — **$27 USD**

A self-service digital download for users who want the AI-generated copy without building/hosting the page on TriniBuild. After paying (Stripe or manual payment in MVP), user gets:

- A zipped bundle containing:
  - `copy.md` — all AI-generated copy (tagline, hero description, about, services with descriptions, SEO title, meta description, WhatsApp greeting) in clean Markdown
  - `seo.html` — ready-to-paste `<title>`, `<meta>`, `<og:*>` tags
  - `index.html` — a static, single-file HTML template pre-filled with the generated copy, Tailwind via CDN, responsive, with placeholder slots for Google Maps embed URL and 4 photo URLs. User swaps in their own.
  - `whatsapp-cta.txt` — the `https://wa.me/...` URL + greeting, ready to paste into any link
  - `qrcode-business.png` — QR code PNG encoding the URL the user chooses to host at (input field in download flow)
  - `README.txt` — instructions: how to edit index.html, where to host (Netlify drop, GitHub Pages), how to share QR
- Generation flow: same intake wizard → same Gemini call → package assets server-side (or client-side via JSZip + qrcode canvas) → upload zip to Supabase Storage bucket `digital-downloads` → return signed URL valid 7 days → email link to user + show download button on dashboard.
- Record purchase in a `digital_purchases` table (user_id, product_slug='website-copy-kit', amount_cents=2700, download_url, created_at, expires_at). Re-download allowed for 7 days; after that, re-purchase required.
- MVP payment: manual confirmation by admin (a `paid` boolean toggle) is acceptable for Week 2 if Stripe not yet wired; structure the table to support a `stripe_payment_intent_id` text column for future.

## Codex Prompt

```
You are building Week 2 of the TriniBuild AI Services Marketplace: an AI Business Website Builder.

Project root: C:\Users\Banjo\OneDrive\Documents\Trinibuild\
Stack: React 18 + Vite + TypeScript + Tailwind CSS + Supabase (Postgres + Storage + RLS) + Google Gemini (gemini-2.0-flash). HashRouter is already set up in src/App.tsx. Supabase client is at src/services/supabaseClient.ts. Auth service at src/services/authService.ts returns the current user via a useAuth hook or similar.

Do the following, in order:

1. Create the Supabase migration file `supabase/migrations/0002_business_pages.sql` with the SQL provided in this spec's "Supabase Tables" section — creates business_pages, page_sections, page_seo, the business-photos storage bucket, and all RLS policies. Run it (or paste into Supabase SQL editor) and confirm tables exist via `supabase.from('business_pages').select('*').limit(1)`.

2. Add a Gemini service at `src/services/geminiService.ts` if one does not already exist. It must export `generateBusinessCopy(input: BusinessCopyInput): Promise<BusinessCopyOutput>` that:
   - Builds the prompt with the user-selected Caribbean tone (Professional | Warm & Friendly | Trinbagonian dialect | Jamaican dialect | Bajan dialect).
   - Calls gemini-2.0-flash with `responseMimeType: 'application/json'` and the JSON schema from the spec's "AI Outputs".
   - Strips markdown fences if present, JSON-parses, and on parse failure returns a fallback object with raw text in the failing fields and `null` elsewhere — never throws.
   - Also export `regenerateField(fieldName, context)` for single-field regenerations.

3. Build pages under `src/pages/dashboard/tools/website-builder/`:
   - `WebsiteBuilderHome.tsx` — lists user's business_pages (cards: name, slug, status, published toggle, "Edit" button, "View public" link). Empty state with "Create your first business page" CTA.
   - `Editor.tsx` — the 4-step intake wizard, then "Generate Copy" calls geminiService, then the split editor (left preview iframe, right tabs: Sections / SEO / Settings). Auto-save 30s debounced. Handles `?id=` query param to load existing page.
   - `PublicBusinessPage.tsx` under `src/pages/public/` — renders `/b/:businessSlug`. Fetches business_pages + page_sections + page_seo by slug. If not found or not published, show a friendly "not available" card. Renders hero, about, services grid, gallery with lightbox, opening hours table, Google Maps iframe, floating WhatsApp CTA button, and injects SEO tags via `react-helmet-async` (install if missing). QR code PNG shown on a small "Share this page" widget.

4. Wire routes in `src/App.tsx` (HashRouter):
   - `/dashboard/tools/website-builder` → WebsiteBuilderHome (protected)
   - `/dashboard/tools/website-builder/editor` → Editor (protected)
   - `/b/:businessSlug` → PublicBusinessPage (public, top-level)

5. Gallery upload: in Editor, a dropzone accepting up to 12 images (<= 5MB each, jpg/png/webp). Upload to `business-photos` bucket under path `<page_id>/<uuid>.<ext>`. Store returned public URLs into a gallery section's content.items. Add a "remove" button that deletes the storage object and the section entry.

6. QR code: in Editor Settings tab, render a QR PNG of the public URL using the `qrcode` npm package (`QRCode.toDataURL(url)`). Provide a "Download QR PNG" button.

7. Theme color: Settings tab has a palette of 8 Caribbean-themed swatches; selection writes to business_pages.theme_color; PublicBusinessPage uses it for hero background and CTA button color.

8. Build the digital-download flow behind a feature flag (`VITE_FEATURE_DIGITAL_DOWNLOADS=true`):
   - A "Buy Copy Kit ($27)" button on WebsiteBuilderHome opens a modal.
   - On confirm, generate the zip client-side with JSZip: copy.md, seo.html, index.html (Tailwind CDN, pre-filled), whatsapp-cta.txt, qrcode-business.png, README.txt.
   - Upload zip to `digital-downloads` bucket, store a row in `digital_purchases`, return signed URL. Show download button. (Payment can be a "I've paid — confirm" button that flips `paid=true` for MVP, or stub the Stripe step with a TODO comment.)

9. Use only Tailwind utility classes for styling. Mobile-first responsive. Use existing lucide-react icons already in the project; add new ones if needed.

10. Type everything. Create `src/types/websiteBuilder.ts` with BusinessPage, PageSection, PageSeo, BusinessCopyInput, BusinessCopyOutput, BusinessPageStatus enums.

11. Do not break existing auth or dashboard routes. After building, run `npm run build` and `npx tsc --noEmit` and fix all errors. Then manually verify: create a page via wizard, generate copy, edit, publish, visit `/b/<slug>` in an incognito window — the page loads, WhatsApp button opens wa.me, QR scans to the URL.

Stop and report a summary of files created, the migration result, the build result, and any errors you could not resolve.
```

## Acceptance Criteria

- [ ] A user can complete the 4-step intake wizard without errors; each step validates.
- [ ] Clicking "Generate Copy" returns structured JSON from Gemini within 10s on a normal connection; on Gemini failure the app shows a toast and does not crash.
- [ ] The editor's live preview reflects edits within 1 second of save.
- [ ] A user can upload up to 12 photos; they appear in the public gallery with a working lightbox.
- [ ] A user can paste a valid Google Maps embed URL; the public page shows the embedded map.
- [ ] Opening hours render correctly on the public page (closed days show "Closed").
- [ ] The WhatsApp CTA button on `/b/:slug` opens `https://wa.me/<number>?text=<encoded greeting>` in a new tab.
- [ ] SEO title, meta description, and Open Graph tags are present in the public page's `<head>` (verifiable via view-source).
- [ ] A downloadable QR code PNG encodes the correct public URL and scans to that URL.
- [ ] Publishing a page makes `/b/:slug` publicly viewable; unpublishing makes it show the "not published" state.
- [ ] RLS policies verified: user A cannot read/edit user B's unpublished pages; anonymous users can read published pages but cannot write.
- [ ] The digital download bundle (when feature flag on) contains all 6 files and opens correctly in a browser.
- [ ] `npm run build` and `npx tsc --noEmit` pass with zero errors.
- [ ] No existing Week 1 routes (login, dashboard home, profile) are broken.
