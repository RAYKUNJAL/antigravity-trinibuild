# Week 10 Build Spec — Event Ticketing + QR Check-In

## Goal

Build a self-service event ticketing tool for the TriniBuild AI Services Marketplace that lets a vendor (event organizer) create an event, define ticket types, sell or reserve tickets, generate a unique QR code per ticket, and check attendees in by scanning/validating that QR code at the door. The organizer gets a public-facing event page (shareable link), an attendee list, and an export-ready door list. A Gemini-backed AI generator drafts promotional captions for the event so the organizer can post to Instagram, Facebook, and WhatsApp Status without writing copy.

This is a Caribbean-first product: cash-on-delivery and "pay at the door" tickets must be first-class flows, not afterthoughts, because a large share of local buyers do not pay online before pickup.

## Features

1. **Event page builder** — a multi-section form inside the dashboard that captures: event name, slug (auto-suggested from name, editable, URL-safe), date, start time, end time (optional), venue name, venue address, event description (long text), organizer name, organizer phone, organizer email, event banner image URL, and capacity (max total attendees across all ticket types).
2. **Ticket type builder** — under each event, the organizer can add N ticket types. Each ticket type has: name (e.g. "General", "VIP", "Door"), price in TTD (0 or free allowed), quantity available, description (optional), and a "cash accepted" flag (when true, buyers can reserve without paying online).
3. **Manual ticket creation** — organizer can create a ticket directly for a walk-in/phone buyer: enter attendee name, phone, email, ticket type, and a status (`reserved`, `cash_pending`, `paid`, `cancelled`). This is how offline sales get logged.
4. **Ticket statuses** — the canonical lifecycle is: `reserved` (held, unpaid, auto-expires after 15 min if not confirmed) → `cash_pending` (organizer confirmed a cash/door sale) → `paid` (online payment confirmed) → `checked_in` (validated at door) → `cancelled` (voided by organizer or buyer). Status transitions must be enforced server-side via Supabase RLS + a status check constraint.
5. **QR code generation** — every ticket gets a deterministic QR code encoding a payload of `{ticket_id, signature}` where `signature` is a short HMAC of the ticket_id using a project secret. The QR is rendered as an SVG/PNG on the ticket confirmation page and downloadable by the buyer. Re-generation is not needed; the code is stable for the life of the ticket.
6. **Check-in page** — a door operator opens `/dashboard/tools/events/:id/checkin`, sees a camera-backed QR scanner (or a manual "enter ticket ID" fallback). On scan, the client validates the signature locally first (rejects forgeries fast), then queries Supabase for the ticket. If the ticket is `paid` or `cash_pending` and not already `checked_in`, it flips to `checked_in` and shows a green "WELCOME {attendee_name}" toast. If already checked in, shows a red "DUPLICATE ENTRY" toast. If the ticket is `reserved` or `cancelled`, shows "NOT VALID — status: X".
7. **Attendee list + export** — organizer sees a table of all tickets for the event with columns: attendee name, phone, ticket type, status, check-in time. A "Export CSV" button downloads the full list. A "Door list (PDF)" button renders a printable door list.
8. **Vendor booth registration form** — a public form at `/event/:eventSlug` (a tab on the public page) where a booth vendor applies: vendor name, business name, phone, email, booth type (food, craft, service, other), requested booth count, special requests. Submissions land in `vendor_applications` and the organizer sees them in a "Booth vendors" tab in the dashboard.
9. **AI event promo caption generator** — a button "Generate promo captions" in the event builder. Sends the event name, date, venue, and description to Gemini, which returns 3 short captions (one each for Instagram, Facebook, WhatsApp Status) plus 1 longer "event blurb" paragraph. Organizer can copy any of them or regenerate.

## Pages (route paths)

All routes use the existing `HashRouter` in `App.tsx`. Add these as children of the dashboard layout (protected) and as public top-level routes.

| Route | Auth | Purpose |
|-------|------|---------|
| `/dashboard/tools/events` | vendor | list organizer's events, "Create event" button |
| `/dashboard/tools/events/new` | vendor | event builder form (step 1: event details) |
| `/dashboard/tools/events/:id` | vendor | edit event + ticket type management + booth vendor list |
| `/dashboard/tools/events/:id/attendees` | vendor | attendee table + CSV/PDF export |
| `/dashboard/tools/events/:id/checkin` | vendor (door op) | QR scanner check-in page |
| `/event/:eventSlug` | public | public event page: hero, description, ticket types, buy form, booth vendor tab |

## AI Outputs (what the AI generates)

The Gemini call for promo captions returns **4 text fields**:

1. `instagram_caption` — ≤ 2200 chars, emoji-rich, 5–10 hashtags at the end (Caribbean-flavored: #TriniEvents, #CaribbeanVibes, plus event-specific tags from the event name).
2. `facebook_caption` — 1–3 short paragraphs, friendly tone, no hashtags beyond 2.
3. `whatsapp_status` — ≤ 136 chars (WhatsApp Status text limit), punchy, one emoji max.
4. `event_blurb` — 1 paragraph, 60–120 words, suitable for a press release or email newsletter intro.

The generator must be non-deterministic enough to differ on regenerate, but deterministic enough that the same event twice in a row doesn't return garbage. Use `temperature: 0.7`. The prompt to Gemini must include the event name, date, venue, and description verbatim, plus the instruction "Return JSON with keys instagram_caption, facebook_caption, whatsapp_status, event_blurb."

## Supabase Tables (SQL)

```sql
-- Events
create table public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  event_date date not null,
  start_time time not null,
  end_time time,
  venue_name text not null,
  venue_address text,
  description text,
  organizer_name text not null,
  organizer_phone text,
  organizer_email text,
  banner_image_url text,
  capacity int not null check (capacity > 0),
  status text not null default 'draft' check (status in ('draft','published','cancelled','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ticket types
create table public.ticket_types (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  price_cents int not null default 0 check (price_cents >= 0),
  quantity_available int not null check (quantity_available > 0),
  description text,
  cash_accepted boolean not null default true,
  created_at timestamptz not null default now()
);

-- Tickets (one row per issued ticket)
create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  ticket_type_id uuid not null references public.ticket_types(id) on delete restrict,
  attendee_name text not null,
  attendee_phone text,
  attendee_email text,
  status text not null default 'reserved' check (status in ('reserved','cash_pending','paid','checked_in','cancelled')),
  qr_signature text not null,
  reserved_at timestamptz not null default now(),
  paid_at timestamptz,
  checked_in_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Attendees (denormalized person record, useful when one person buys multiple tickets)
create table public.attendees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

-- Check-ins (audit log of every scan, including duplicate attempts)
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  scanned_by uuid references auth.users(id),
  result text not null check (result in ('admitted','duplicate','invalid_status','signature_mismatch')),
  scanned_at timestamptz not null default now()
);

-- Vendor booth applications
create table public.vendor_applications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  vendor_name text not null,
  business_name text,
  phone text not null,
  email text,
  booth_type text not null check (booth_type in ('food','craft','service','other')),
  booth_count int not null default 1 check (booth_count > 0 and booth_count <= 10),
  special_requests text,
  status text not null default 'pending' check (status in ('pending','approved','declined')),
  created_at timestamptz not null default now()
);

-- RLS: events are owner-scoped; tickets/checkins/vendor_applications inherit via event_id
alter table public.events enable row level security;
create policy "events owner rw" on public.events for all using (owner_id = auth.uid());
alter table public.ticket_types enable row level security;
create policy "ticket_types via event" on public.ticket_types for all
  using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = auth.uid()));
alter table public.tickets enable row level security;
-- public can insert tickets (a buyer reserving); owner can read/update; RLS policy below
create policy "tickets owner read" on public.tickets for select
  using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = auth.uid()));
create policy "tickets owner update" on public.tickets for update
  using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = auth.uid()));
-- public insert allowed only when event.status='published' and within capacity
create policy "tickets public insert" on public.tickets for insert with check (
  exists (select 1 from public.events e
          where e.id = event_id and e.status = 'published'
          and e.id = ticket_type.event_id)  -- simplified; enforce capacity in a trigger
);
alter table public.checkins enable row level security;
create policy "checkins owner" on public.checkins for all
  using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = auth.uid()));
alter table public.vendor_applications enable row level security;
create policy "vendor_apps owner read" on public.vendor_applications for select
  using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = auth.uid()));
create policy "vendor_apps public insert" on public.vendor_applications for insert with check (true);
```

Notes:
- `qr_signature` is a server-side HMAC. Generate it in a Postgres function (`public.fn_issue_ticket`) that inserts the ticket and computes `hmac-sha256(ticket_id, '<PROJECT_SECRET>')::hex` truncated to 12 chars. Call this function from the client (RPC) instead of inserting into `tickets` directly, so the signature is never exposed to the client.
- Capacity enforcement: a `before insert` trigger on `tickets` that counts non-cancelled tickets for the event and rejects if `>= events.capacity`.

## Digital Download Version

**Caribbean Event Promo + Ticketing Kit — $39 USD**

After completing this build, package a zip of reusable assets that a vendor can download and use offline for any future Caribbean event, independent of the TriniBuild platform:

- `event-promo-caption-prompt.md` — the exact Gemini prompt used by the generator, so a vendor can paste it into any LLM.
- `ticket-qr-template.svg` — a blank QR ticket SVG with placeholder fields (`{{attendee_name}}`, `{{event_name}}`, `{{date}}`, `{{qr_payload}}`).
- `door-list-template.html` — a standalone printable door list template (no build step, just open in browser).
- `booth-vendor-application-template.html` — a standalone vendor application form that prints to PDF.
- `cash-pending-workflow-guide.pdf` — a 2-page explainer on how the `cash_pending` → `paid`/`checked_in` flow works and why.
- `readme.md` — how to use each asset.

This kit is sold via the existing marketplace checkout (Stripe) and delivered as a single zip. The build spec does not need to implement the checkout — only the kit contents listed above.

## Codex Prompt (detailed prompt for the Codex CLI agent)

```
You are implementing Week 10 of the TriniBuild AI Services Marketplace: an Event Ticketing + QR Check-In tool.

Repo: C:\Users\Banjo\OneDrive\Documents\Trinibuild\
Stack: React + Vite + TypeScript + Tailwind + Supabase + Google Gemini. HashRouter is already in App.tsx. Supabase client is at services/supabaseClient.ts (named export `supabase`). Auth is at services/authService.ts (gives you `getCurrentUser()` returning `{ id }` or null). Gemini is accessed via services/geminiService.ts (named export `gemini` with a method `generateJSON(prompt, schema)` returning a parsed object).

DO NOT:
- rewrite App.tsx from scratch; only add the routes listed below as children of the existing dashboard layout.
- change the Supabase client or auth service signatures.
- add new dependencies beyond: qrcode.react (for QR rendering), html5-qrcode (for the door scanner), and clsx (if not already present).

DO:
1. Run the SQL in the "Supabase Tables" section against the project's Supabase instance via `supabase db execute` (or paste into the Supabase SQL editor). Create the function `public.fn_issue_ticket(p_event_id uuid, p_ticket_type_id uuid, p_attendee_name text, p_attendee_phone text, p_attendee_email text, p_status text default 'reserved')` that inserts a ticket and returns the ticket row with `qr_signature` computed as `hmac-sha256(ticket_id, current_setting('app.ticket_secret'))::text` truncated to 12 chars. Set `app.ticket_secret` via `alter database <name> set app.ticket_secret = '<random_32_char_hex>'`.
2. Add routes (all lazy-loaded with React.lazy + Suspense):
   /dashboard/tools/events (list)
   /dashboard/tools/events/new (builder)
   /dashboard/tools/events/:id (edit + ticket types + booth vendors tab)
   /dashboard/tools/events/:id/attendees (table + export)
   /dashboard/tools/events/:id/checkin (QR scanner)
   /event/:eventSlug (public)
3. Create pages/EventsListPage.tsx, pages/EventBuilderPage.tsx, pages/EventDetailPage.tsx, pages/AttendeesPage.tsx, pages/CheckinPage.tsx, pages/PublicEventPage.tsx. Put all under src/features/events/.
4. Create services/eventService.ts with: createEvent, getEventBySlug, getEventById, updateEvent, listMyEvents, addTicketType, listTicketTypes, issueTicket (RPC to fn_issue_ticket), listAttendees, checkInTicket (update status + insert checkin row), listVendorApplications, approveVendorApplication. Use the existing `supabase` client. All owner-scoped queries must filter by owner_id = current user.
5. Create services/qrService.ts with: signTicketId(ticketId) client-side (must match server HMAC — load the secret from env VITE_TICKET_SECRET for dev only; in prod the client only validates signatures it received from the server, never re-signs), validatePayload(payload) which splits {ticket_id, signature}, looks up the ticket, and returns {valid, ticket, reason}.
6. Create services/geminiPromoService.ts with: generatePromoCaptions(event) that calls `gemini.generateJSON(...)` with the prompt in the spec and returns {instagram_caption, facebook_caption, whatsapp_status, event_blurb}.
7. UI: Tailwind, match the existing dashboard shell styling. Ticket status uses colored badges: reserved=yellow, cash_pending=blue, paid=green, checked_in=indigo, cancelled=red. The public event page hero uses the banner image; below it, ticket types render as cards with a "Reserve" button. Cash-accepted types show a "Reserve (pay at door)" button instead of "Buy now".
8. The check-in page: use html5-qrcode to scan, decode the QR text payload, call qrService.validatePayload, then eventService.checkInTicket. Toast on each result.
9. CSV export: a button that queries listAttendees and triggers a client-side CSV download (no server endpoint needed). Use a tiny util in utils/csv.ts.

Acceptance criteria below must all pass before you stop. Commit with message "Week 10: event ticketing + QR check-in" on a branch `week-10-events`. Push the branch.
```

## Acceptance Criteria

1. A logged-in vendor can create an event at `/dashboard/tools/events/new`, save it as draft, then publish it. Publishing flips `events.status` to `published` and makes the public page at `/event/:slug` render.
2. The public event page shows the banner, name, date, venue, description, ticket types, a "Reserve"/"Buy now" form, and a "Become a booth vendor" tab. A non-logged-in visitor can reserve a ticket (status `reserved`) and a booth vendor can submit an application.
3. Each issued ticket has a `qr_signature` computed server-side; the public/ticket confirmation page renders a QR encoding `{ticket_id, signature}`. The QR is scannable by a standard phone QR reader and decodes to that JSON-ish string.
4. At `/dashboard/tools/events/:id/checkin`, scanning a valid `paid` or `cash_pending` ticket flips it to `checked_in` and inserts a `checkins` row with `result='admitted'`. Scanning the same ticket again returns `result='duplicate'` and does NOT flip status. Scanning a `reserved` or `cancelled` ticket returns `result='invalid_status'` and does not flip. Scanning a ticket with a bad signature returns `result='signature_mismatch'` and does not flip.
5. The organizer's attendee page lists all tickets with correct status badges and exports a CSV with columns: attendee_name, phone, email, ticket_type, status, checked_in_at.
6. The organizer can manually create a ticket for a walk-in buyer with status `cash_pending`, and that ticket immediately gets a QR and is check-in-eligible.
7. The "Generate promo captions" button returns 4 fields and any one can be copied to clipboard; regenerate produces different text.
8. A booth vendor application submitted from the public page appears in the organizer's "Booth vendors" tab with status `pending`; the organizer can approve/decline it.
9. RLS: a vendor cannot read another vendor's events, tickets, checkins, or vendor applications. A public visitor can only insert into `tickets` and `vendor_applications`; they cannot read other vendors' data.
10. Capacity is enforced: once non-cancelled tickets reach `events.capacity`, new reservations are rejected with a clear "Sold out" message on the public page.
