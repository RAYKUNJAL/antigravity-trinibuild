# Week 11 Build Spec — Tourism Booking Kit

## Goal

Build a tourism booking tool for the TriniBuild AI Services Marketplace that lets a tour operator create tour listings, generate AI-written descriptions and itineraries, accept booking requests from guests (including a WhatsApp confirmation flow), publish a guest FAQ and a simple waiver template, and manage bookings from the dashboard. This is a request-and-confirm model, not instant purchase — the operator reviews each booking request and confirms via WhatsApp or email before taking payment, which matches how most small Caribbean tour operators actually work.

## Features

1. **Tour listing builder** — a dashboard form that captures: tour name, slug, location (beach/attraction/starting point), duration (hours), price in TTD per guest, capacity (max guests per departure), full itinerary (multi-step: stop name, duration, description), included items (checkbox list: transportation, lunch, snorkel gear, guide, photos), safety notes, pickup options (list of named pickup points with times), tour photos (URLs), and tour category (land, water, cultural, adventure).
2. **AI tour description generator** — a button that sends the tour's bare facts (name, location, category, duration, included items, safety notes) to Gemini and receives a 2–3 paragraph marketing description suitable for the public tour page. Operator can edit before publishing.
3. **AI itinerary generator** — a button that, given a tour name, location, duration, and category, returns a structured itinerary as a JSON array of `{stop_name, duration_minutes, description}`. Operator reviews and edits each stop before saving.
4. **Booking request form** — on the public tour page, a guest fills: name, phone (with WhatsApp flag), email, number of guests, preferred date, preferred pickup option, and a free-text "special requests" field. Submit creates a `tour_bookings` row with status `pending`. No payment is taken at submit time.
5. **WhatsApp confirmation message generator** — when an operator approves a booking, the system generates a WhatsApp-ready confirmation message string: "Hi {guest_name}, your booking for {tour_name} on {date} for {guests} guests is confirmed. Pickup: {pickup_point} at {pickup_time}. Total: TT${total}. Reply to confirm or ask questions." A "Send via WhatsApp" button opens `https://wa.me/{phone}?text={encoded_message}`.
6. **Guest FAQ generator** — a button that sends the tour facts to Gemini and returns 6–8 Q&A pairs as JSON: `[{question, answer}]`. These render on the public tour page under a "FAQ" section and are stored in `tour_faqs`.
7. **Simple waiver template generator** — generates a short liability/acknowledgment waiver paragraph tailored to the tour category (e.g. water tours mention swimming ability; adventure tours mention physical fitness). Stored in `tour_waivers` as a template string the operator can edit. The public page shows a "Download waiver" link that renders the template as a printable PDF.
8. **Booking management** — operator sees all bookings for a tour in `/dashboard/tools/tourism/bookings`, with status badges (`pending`, `confirmed`, `declined`, `cancelled`, `completed`). Can approve (→ `confirmed`), decline (→ `declined`), or mark completed after the tour runs. Approving triggers the WhatsApp message generator.

## Pages (route paths)

All routes use the existing `HashRouter` in `App.tsx`.

| Route | Auth | Purpose |
|-------|------|---------|
| `/dashboard/tools/tourism` | operator | list operator's tours, "Create tour" button |
| `/dashboard/tools/tourism/tours` | operator | tour listing builder (create/edit) + itinerary editor + FAQ/waiver generators |
| `/dashboard/tools/tourism/bookings` | operator | booking requests table, approve/decline, WhatsApp send |
| `/tour/:tourSlug` | public | public tour page: photos, AI description, itinerary, included items, FAQ, waiver download, booking request form |

Note: `/dashboard/tools/tourism/tours` handles both list and create/edit (use query param `?id=...` or a nested route `/:tourId` to edit an existing tour). Keep it simple — a single page with a list on the left and editor on the right, or a list page plus an editor modal/route, is fine; pick one and document it in the code.

## AI Outputs (what the AI generates)

Three separate Gemini calls, each returning JSON:

1. **Tour description** — `generateTourDescription(tour)` returns `{ description: string }` where `description` is 2–3 paragraphs, Caribbean-flavored marketing copy, 80–200 words. Use `temperature: 0.7`. Prompt must include tour name, location, category, duration, and included items.
2. **Itinerary** — `generateItinerary(tour)` returns `{ stops: [{stop_name, duration_minutes, description}] }` with 4–7 stops that sum to roughly the tour's duration. Prompt must include tour name, location, duration, and category.
3. **FAQ** — `generateFAQ(tour)` returns `{ faqs: [{question, answer}] }` with 6–8 pairs covering: what to bring, pickup, group size, weather policy, refund policy, fitness level, food/drink, accessibility. Prompt must include tour name, duration, included items, and safety notes.

The waiver is generated by a fourth call, `generateWaiver(tour)`, returning `{ waiver_text: string }` — a single paragraph, 100–200 words, referencing the tour category's specific risks. Stored as editable template text.

All Gemini calls go through the existing `services/geminiService.ts` `gemini.generateJSON(prompt, schema)` helper. Prompts must instruct: "Return JSON only, no markdown fences, with the exact keys listed."

## Supabase Tables (SQL)

```sql
-- Tours
create table public.tours (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  location text not null,
  category text not null check (category in ('land','water','cultural','adventure')),
  duration_hours numeric not null check (duration_hours > 0),
  price_cents int not null check (price_cents >= 0),
  capacity int not null check (capacity > 0),
  description text,
  itinerary jsonb not null default '[]'::jsonb,  -- [{stop_name, duration_minutes, description}]
  included_items text[] not null default '{}',
  safety_notes text,
  pickup_options jsonb not null default '[]'::jsonb,  -- [{point, time}]
  photo_urls text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tour bookings (request-and-confirm model)
create table public.tour_bookings (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  guest_name text not null,
  guest_phone text not null,
  guest_email text,
  guests int not null check (guests > 0 and guests <= 20),
  preferred_date date not null,
  pickup_option jsonb,  -- {point, time} chosen from tour.pickup_options
  special_requests text,
  status text not null default 'pending' check (status in ('pending','confirmed','declined','cancelled','completed')),
  total_cents int,  -- set when confirmed: guests * tour.price_cents
  confirmation_message text,  -- the generated WhatsApp message, stored for audit
  confirmed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tour FAQs
create table public.tour_faqs (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  question text not null,
  answer text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Tour waivers (one editable template per tour)
create table public.tour_waivers (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null unique references public.tours(id) on delete cascade,
  waiver_text text not null,
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.tours enable row level security;
create policy "tours owner rw" on public.tours for all using (owner_id = auth.uid());
alter table public.tour_bookings enable row level security;
-- owner can read/update bookings for their tours; public can insert
create policy "bookings owner read" on public.tour_bookings for select
  using (exists (select 1 from public.tours t where t.id = tour_id and t.owner_id = auth.uid()));
create policy "bookings owner update" on public.tour_bookings for update
  using (exists (select 1 from public.tours t where t.id = tour_id and t.owner_id = auth.uid()));
create policy "bookings public insert" on public.tour_bookings for insert with check (
  exists (select 1 from public.tours t where t.id = tour_id and t.status = 'published')
);
alter table public.tour_faqs enable row level security;
create policy "faqs owner rw" on public.tour_faqs for all
  using (exists (select 1 from public.tours t where t.id = tour_id and t.owner_id = auth.uid()));
-- public can read FAQs for published tours
create policy "faqs public read" on public.tour_faqs for select
  using (exists (select 1 from public.tours t where t.id = tour_id and t.status = 'published'));
alter table public.tour_waivers enable row level security;
create policy "waivers owner rw" on public.tour_waivers for all
  using (exists (select 1 from public.tours t where t.id = tour_id and t.owner_id = auth.uid()));
create policy "waivers public read" on public.tour_waivers for select
  using (exists (select 1 from public.tours t where t.id = tour_id and t.status = 'published'));
```

Notes:
- `itinerary` and `pickup_options` are `jsonb` arrays; the client reads/writes them as typed arrays via a small Zod schema in `services/tourService.ts`.
- Capacity check on booking insert: a `before insert` trigger that rejects if non-cancelled bookings for `(tour_id, preferred_date)` already sum to `>= tours.capacity`. Return a 400-friendly error message the client surfaces as "That date is full — try another date."

## Digital Download Version

**Caribbean Tour Operator Booking Kit — $49 USD**

A zip sold via the existing marketplace checkout, containing standalone reusable assets for any Caribbean tour operator, independent of the TriniBuild platform:

- `tour-description-prompt.md` — the exact Gemini prompt for tour descriptions.
- `itinerary-generator-prompt.md` — the itinerary prompt.
- `faq-generator-prompt.md` — the FAQ prompt.
- `waiver-templates/` — 4 pre-written waiver templates (water, land, cultural, adventure) as editable `.md` files.
- `booking-confirmation-whatsapp-template.txt` — the message template with `{{guest_name}}` etc. placeholders.
- `booking-request-form-template.html` — a standalone printable/emailable booking request form.
- `door-list-template.html` — a guest manifest template for the operator to print the day of the tour.
- `readme.md` — how to use each asset.

The build does not implement the checkout — only the kit contents.

## Codex Prompt (detailed prompt for the Codex CLI agent)

```
You are implementing Week 11 of the TriniBuild AI Services Marketplace: a Tourism Booking Kit.

Repo: C:\Users\Banjo\OneDrive\Documents\Trinibuild\
Stack: React + Vite + TypeScript + Tailwind + Supabase + Google Gemini. HashRouter already in App.tsx. Supabase client at services/supabaseClient.ts (named export `supabase`). Auth at services/authService.ts (`getCurrentUser()` → `{id}` or null). Gemini at services/geminiService.ts (`gemini.generateJSON(prompt, schema)` → parsed object).

DO NOT rewrite App.tsx; only add the routes below. DO NOT change supabase/auth signatures.

DO:
1. Run the SQL in "Supabase Tables" against the project's Supabase instance. Add the capacity trigger on tour_bookings insert.
2. Add routes (lazy-loaded):
   /dashboard/tools/tourism (list of operator's tours)
   /dashboard/tools/tourism/tours (builder: create + edit via ?id= or nested /:tourId; itinerary editor inline; generate-description, generate-itinerary, generate-faq, generate-waiver buttons)
   /dashboard/tools/tourism/bookings (bookings table across all of operator's tours; approve/decline/complete actions; "Send via WhatsApp" link on confirmed)
   /tour/:tourSlug (public: photos, AI description, itinerary, included items, FAQ, waiver download, booking request form)
3. Create src/features/tourism/ with:
   pages/TourismListPage.tsx
   pages/TourBuilderPage.tsx
   pages/BookingsPage.tsx
   pages/PublicTourPage.tsx
   components/ItineraryEditor.tsx (add/remove/reorder stops; each stop has name, duration_minutes, description)
   components/PickupOptionsEditor.tsx
   components/BookingRequestForm.tsx
   components/FAQSection.tsx
   components/WaiverDownload.tsx (renders tour_waivers.waiver_text to a printable view; use window.print or a tiny PDF lib already in repo if present, else just a printable HTML view)
4. services/tourService.ts: createTour, getTourBySlug, getTourById, updateTour, listMyTours, publishTour, archiveTour. Use a Zod schema for the itinerary/pickup_options jsonb arrays.
5. services/bookingService.ts: createBooking (public insert), listBookingsForOperator (join tours), approveBooking (status→confirmed, set total_cents = guests * tour.price_cents, generate confirmation_message), declineBooking, completeBooking, cancelBooking.
6. services/geminiTourService.ts: generateTourDescription, generateItinerary, generateFAQ, generateWaiver — each calls gemini.generateJSON with the prompts in the spec and returns the typed shapes.
7. WhatsApp send: a util utils/whatsapp.ts that builds the wa.me URL from phone + message. Phone must be normalized to E.164 (strip leading 0, prefix +1 for TT numbers if missing country code).
8. UI: Tailwind, match dashboard shell. Booking status badges: pending=yellow, confirmed=green, declined=red, cancelled=gray, completed=indigo. Public tour page: hero with first photo, description, itinerary as a vertical timeline, included items as checkmark chips, FAQ as accordion, waiver as a "Download waiver" link opening a printable view, booking form in a card on the right (sticky on desktop).

Acceptance criteria below must all pass. Commit "Week 11: tourism booking kit" on branch week-11-tourism. Push.
```

## Acceptance Criteria

1. A logged-in operator can create a tour at `/dashboard/tools/tourism/tours`, fill all fields, run the AI generators for description, itinerary, FAQ, and waiver, edit each output, and publish the tour. Publishing flips `tours.status` to `published` and makes `/tour/:slug` render.
2. The public tour page shows: hero photo, AI-generated (operator-edited) description, itinerary as a vertical timeline, included items as checkmark chips, pickup options, FAQ accordion, waiver download link, and a booking request form.
3. A non-logged-in guest can submit a booking request from the public page; it lands in `tour_bookings` with status `pending`. If the chosen date is at capacity, the form shows "That date is full — try another date."
4. The operator sees the booking at `/dashboard/tools/tourism/bookings` with a `pending` badge. Approving it sets status to `confirmed`, computes `total_cents = guests * tour.price_cents`, generates and stores a `confirmation_message`, and shows a "Send via WhatsApp" button that opens `https://wa.me/{normalized_phone}?text={encoded_message}`.
5. Declining sets status to `declined`; completing (after tour runs) sets `completed`. Both are operator actions from the bookings page.
6. The FAQ generator returns 6–8 Q&A pairs; they render as an accordion on the public page and persist in `tour_faqs`.
7. The waiver generator returns a category-appropriate paragraph; it persists in `tour_waivers` and the public "Download waiver" link opens a printable view of it.
8. RLS: an operator cannot read another operator's tours, bookings, FAQs, or waivers. A public visitor can insert into `tour_bookings` only for published tours, and can read `tour_faqs` and `tour_waivers` only for published tours. A public visitor cannot read any operator's `tours` row in full (only the public-facing fields are exposed via a view or RLS select on published tours — implement a `public_tours` view or a select policy that restricts columns).
9. The itinerary editor lets the operator add, remove, and reorder stops; the total duration of stops is shown and warns (does not block) if it diverges from `tours.duration_hours` by more than 20%.
10. All three AI generators return valid JSON the first time and on regenerate produce different text; a generation failure surfaces a toast and does not corrupt the form.
