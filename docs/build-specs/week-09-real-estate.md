# Week 9 Build Spec — Real Estate Listing Builder

## Goal

Build an AI-assisted real estate listing tool for Trinidad & Tobago landlords and agents. Users create property listings (for rent or sale) via a wizard, generate polished AI listing descriptions and short Facebook/WhatsApp versions, publish a public property page with a WhatsApp inquiry button, collect tenant pre-screening responses and viewing requests, and manage leads from a dashboard.

## Features

### Landlord / agent (authenticated) side
- **Property listing wizard** — multi-step form capturing:
  - Listing type (rental / sale)
  - Address (street, town, region)
  - Price (TTD/month for rentals; TTD total for sale) + security deposit (rentals)
  - Bedrooms, bathrooms
  - Amenities (checkbox grid: AC, parking, laundry, pool, gym, furnished, pets allowed, utilities included, internet, security)
  - House rules (free text + common-rule toggles: no smoking, no pets, quiet hours)
  - Photos (multiple upload to Supabase Storage, drag-to-reorder, first photo = cover)
  - Availability date + status (available, under application, let/sold)
- **AI listing description generator** — from the wizard data, Gemini writes a full property description (200–350 words) in an appealing, T&T-appropriate tone.
- **AI short Facebook/WhatsApp listing** — a condensed version (<=280 chars) with key specs + price + location + CTA, ready to paste into a FB post or WhatsApp status.
- **Public property page** at `/property/:propertySlug` — gallery, specs, description, amenities, rules, availability, location text, WhatsApp inquiry button, tenant pre-screening form, viewing request form.
- **WhatsApp inquiry button** — pre-fills a WhatsApp message to the landlord with property name + a standard inquiry; opens `wa.me/<landlordPhone>`.
- **Tenant pre-screening form** — public form on the listing page: name, phone, email, employment status, monthly income, desired move-in date, number of occupants, pets, smoking, references count. Submitted data goes to the lead dashboard.
- **Viewing request form** — public form: name, phone, preferred date, preferred time, message. Saved to `viewing_requests`.
- **Lead dashboard** at `/dashboard/tools/real-estate/leads` — list of leads across all the landlord's properties, filterable by property and status (new, contacted, viewing scheduled, approved, rejected). Each lead shows pre-screening answers + any viewing requests.
- **Listings dashboard** at `/dashboard/tools/real-estate/listings` — all the landlord's listings with status, views count (optional), edit, and link to public page.

### Public side
- **Public property page** at `/property/:propertySlug` — no auth. Full gallery, description, specs, amenities, rules, availability, WhatsApp inquiry, pre-screening form, viewing request form.

## Pages (route paths)

| Route | Auth | Purpose |
|---|---|---|
| `/dashboard/tools/real-estate` | vendor | Overview — listing count, lead count, recent leads, quick CTAs |
| `/dashboard/tools/real-estate/listings` | vendor | Listings dashboard — list, edit, publish, copy public link |
| `/dashboard/tools/real-estate/leads` | vendor | Lead dashboard — filterable lead list with pre-screening + viewing requests |
| `/property/:propertySlug` | public | Public property page — gallery, description, inquiry, forms |

Dashboard routes nested under existing `HashRouter` + `authService`. Public route standalone (no auth).

## AI Outputs (what the AI generates)

1. **Full listing description** — Input: all wizard fields (type, address, beds/baths, price, deposit, amenities, rules, availability). Output: 200–350 word engaging description, T&T tone, mentions key amenities and location appeal. Vendor approves before publish.
2. **Short FB/WhatsApp listing** — Input: same wizard data. Output: <=280 char post: "🟢 For [Rent/Sale]: [X] bed [Y] bath in [Location] — $[Price]. [1 highlight]. WhatsApp [link/CTA]." Copy-to-clipboard.

## Supabase Tables (SQL)

```sql
-- Property listings
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.profiles(id) on delete cascade,
  property_slug text not null unique,
  listing_type text not null check (listing_type in ('rental','sale')),
  street text,
  town text,
  region text,
  price numeric(12,2) not null,
  deposit numeric(12,2),
  bedrooms int,
  bathrooms int,
  amenities jsonb not null default '[]'::jsonb,
  rules jsonb not null default '[]'::jsonb,
  rules_text text,
  description text,
  short_description text,
  availability_date date,
  status text not null default 'available' check (status in ('available','under_application','let','sold')),
  landlord_phone text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Property photos (ordered)
create table public.property_photos (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  url text not null,
  caption text,
  display_order int not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

-- Leads (pre-screening submissions)
create table public.property_leads (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  business_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  employment_status text,
  monthly_income numeric(12,2),
  desired_move_in date,
  occupant_count int,
  has_pets boolean,
  is_smoker boolean,
  references_count int default 0,
  message text,
  status text not null default 'new' check (status in ('new','contacted','viewing_scheduled','approved','rejected')),
  created_at timestamptz not null default now()
);

-- Viewing requests
create table public.viewing_requests (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  business_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  phone text not null,
  preferred_date date,
  preferred_time text,
  message text,
  status text not null default 'requested' check (status in ('requested','confirmed','completed','cancelled')),
  created_at timestamptz not null default now()
);
```

RLS:
- `properties`: vendor CRUD where `business_id = auth.uid()`; public `select` where `is_published = true`.
- `property_photos`: vendor CRUD via parent property ownership; public `select` via published parent.
- `property_leads`: public `insert` (for published properties), vendor `select/update` via `business_id`; no public `select`.
- `viewing_requests`: public `insert` (for published properties), vendor `select/update` via `business_id`; no public `select`.

## Digital Download Version

**Product:** Rental Listing + Tenant Screening Kit
**Price:** $49 USD
**Deliverables (zip):**
- Rental listing template (Word + Google Docs) with T&T-friendly sections
- Short-form listing templates for Facebook Marketplace + WhatsApp Status (10 variants)
- Tenant pre-screening questionnaire (printable PDF + Google Form template)
- Tenant reference check call script (PDF)
- Viewing scheduling template (Google Calendar invite text + WhatsApp confirmation template)
- Rental application form (printable PDF)
- Move-in / move-out inspection checklist (printable PDF)
- Security deposit log sheet (Excel + Google Sheets)
- Fair-housing / T&TEC / WASA transfer checklist PDF
- AI listing description prompt library (8 prompts by property type)

Listed in `/downloads`; purchase yields a 72-hour signed download link.

## Codex Prompt (detailed prompt for the Codex CLI agent)

```
You are building the "Real Estate Listing Builder" for TriniBuild (React + Vite + TypeScript + Tailwind + Supabase + Google Gemini).

Reuse:
- services/supabaseClient.ts, services/authService.ts (profile with .id and .business_slug)
- services/geminiService.ts (extend; do not recreate Gemini client)
- HashRouter in App.tsx

Tasks:
1. Run the SQL from the build spec to create: properties, property_photos, property_leads, viewing_requests. Apply RLS per spec.
2. services/realEstateService.ts with typed functions: listProperties, getProperty, getPropertyBySlug, createProperty, updateProperty, deleteProperty, publishProperty, addPhoto, updatePhotoOrder, deletePhoto, setCoverPhoto, submitLead, listLeads, updateLeadStatus, submitViewingRequest, listViewingRequests, updateViewingStatus.
3. services/realEstateAiService.ts: generateListingDescription(property) → 200–350 word description; generateShortListing(property) → <=280 char FB/WhatsApp post. Guard with try/catch + toast.
4. Photo storage: Supabase Storage bucket 'property-photos'; upload returns public URL; support multiple upload, drag-reorder, set cover.
5. Pages:
   - pages/tools/RealEstateOverview.tsx — counts (listings, leads, new leads, viewings), recent leads, quick CTAs.
   - pages/tools/RealEstateListings.tsx — listings table/cards with status, edit, publish toggle, copy public link, delete. "New Listing" opens the wizard.
   - pages/tools/RealEstateLeads.tsx — leads table filterable by property + status; each lead row expands to show full pre-screening answers + linked viewing requests; status workflow buttons; "Open in WhatsApp" button per lead.
   - pages/tools/PropertyWizard.tsx (modal or route) — multi-step: type → address/price/deposit → beds/baths/amenities → rules → photos → availability → AI generate (description + short) → review → save/publish.
   - pages/public/PublicProperty.tsx (route /property/:propertySlug) — gallery (cover + thumbnails), price, specs, amenities chips, rules, description, availability badge, WhatsApp inquiry button (wa.me with prefilled message), tenant pre-screening form, viewing request form. Mobile-first.
6. WhatsApp inquiry message: "Hi, I'm interested in [listing_type] [beds]bd/[baths]ba at [address/town] listed for $[price]. Is it still available?"
7. Styling: Tailwind, match existing dashboard components, mobile-first public page. Gallery with lightbox optional.
8. Loading + error states everywhere (skeletons + toasts). No inline Supabase in components.
9. TypeScript strict, no any. Keep Gemini API key off the client bundle.

Acceptance: landlord creates a listing via the wizard, generates AI descriptions, uploads photos, publishes; public page displays and accepts leads + viewing requests; leads appear in the dashboard with status workflow; WhatsApp inquiry and lead-contact buttons work.
```

## Acceptance Criteria

1. **Wizard** — Landlord completes the multi-step wizard; all fields persist to `properties`; photos upload to Supabase Storage and persist to `property_photos` with order + cover flag.
2. **AI description** — "Generate Description" produces a 200–350 word listing description from wizard data; vendor can accept and save. "Generate Short Listing" produces a <=280 char copy-paste post.
3. **Listings dashboard** — Landlord sees all their listings with status; can edit, publish/unpublish, copy the public link, delete.
4. **Public property page** — `/property/:propertySlug` loads without auth for a published property; shows gallery, price, specs, amenities, rules, description, availability.
5. **WhatsApp inquiry** — Button opens `wa.me/<landlordPhone>` with a prefilled inquiry message including property type, beds/baths, location, and price.
6. **Pre-screening form** — Public form submits to `property_leads`; required fields (name, phone) enforced; submission succeeds without auth.
7. **Viewing request** — Public form submits to `viewing_requests`; preferred date/time captured.
8. **Lead dashboard** — Leads appear with pre-screening answers; filterable by property and status; status can advance `new → contacted → viewing_scheduled → approved/rejected`; "Open in WhatsApp" per lead works.
9. **RLS** — Public can only read published properties and their photos; can only insert leads/viewing-requests for published properties; vendors cannot access other vendors' listings or leads. No public read on leads/viewing-requests.
10. **Mobile** — Public property page is responsive and usable on a phone.
