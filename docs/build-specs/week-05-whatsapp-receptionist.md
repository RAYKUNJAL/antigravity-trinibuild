# Week 5 Build Spec — WhatsApp Receptionist Lite

## Goal

Build "WhatsApp Receptionist Lite" — a script, form, and lead-capture toolkit that helps Caribbean small businesses handle customer WhatsApp messages without a human on every reply. This is **NOT** a full WhatsApp Business API integration yet. It is the manual/semi-automated layer: AI-generated auto-reply scripts, FAQ builders, service menus, booking intake questions, missed-call recovery message templates, a lead intake form, a booking request dashboard, and copy-to-WhatsApp buttons that the business owner uses to paste replies fast.

The tool explicitly leaves placeholder fields (`pending_api_connection`, `api_connected`, `manual_mode`) for a future Meta WhatsApp Cloud API / Twilio integration. When that ships, `manual_mode = false` and the same tables drive real auto-replies.

This is Week 5 of the TriniBuild AI Services Marketplace. It assumes Weeks 1–4 (auth, dashboard, Supabase, Gemini service, RLS patterns, storage buckets) are complete. Reuse `geminiService.ts` and `supabaseClient.ts`.

## Features

### Setup wizard
- **Receptionist setup wizard** — 4-step setup on `/dashboard/tools/whatsapp-receptionist/setup`:
  1. Business identity: business name, WhatsApp number (E.164), industry/category, working hours.
  2. Services menu: add up to 20 services (name, short description, price, duration) → becomes the "service menu" the receptionist serves to customers.
  3. FAQs: add Q/A pairs directly or click "AI-generate FAQs" from a short business description.
  4. Booking questions: pick which questions to ask before booking (name, phone, service, preferred date/time, location, notes) — AI can suggest the question set; user toggles which to include.
  - On finish, writes one row to `receptionist_settings` (with `manual_mode = true`, `api_connected = false`, `pending_api_connection = false`) and related `faqs` and `lead_forms`.

### FAQ builder
- **FAQ builder** on `/dashboard/tools/whatsapp-receptionist/scripts` (or a tab on the main tool page) — table of FAQs (question, answer, category). Add/edit/delete/reorder. "AI-generate FAQs" button: takes a 1-2 sentence business description + category + country and returns 8–12 likely customer FAQs with answers. User edits before saving. FAQs are used as a copy-paste answer library and as the knowledge source for a future RAG-based auto-reply.

### Service menu
- A structured list of services the receptionist "offers" to a customer in a reply. Each entry: name, description (<= 200 chars), price (with currency), duration (e.g. "30 min", "1 hour", "N/A"). Stored in `receptionist_settings.service_menu` JSONB. A "Copy service menu" button formats it as a WhatsApp-friendly numbered list and copies to clipboard.

### Booking questions
- The set of questions the receptionist asks before creating a booking. Stored in `receptionist_settings.booking_questions` JSONB (array of {id, label, type: text|tel|email|date|time|select, options?, required}). The AI suggests a default set; the user toggles which to include and can add custom questions.

### Auto-reply script generator
- **AI auto-reply script generator** — button "Generate Auto-Reply Scripts" calls Gemini with the receptionist_settings + FAQs + service menu + booking questions and returns a set of ready-to-paste WhatsApp scripts for common scenarios:
  - Greeting + menu
  - "What are your hours?"
  - "How much is X?" (uses service menu)
  - "I want to book" → asks the booking questions
  - Out of hours auto-reply
  - "Thanks, we'll get back to you"
- Stored as `message_templates` rows (each with a `scenario` tag). Each template has a "Copy" button and a "Open WhatsApp" button (opens `https://wa.me/<number>?text=<encoded template>` — useful for the business owner to send themselves a test or to paste to a customer).

### Missed-call recovery
- **Missed-call recovery message templates** — AI generates 3–5 templates for the case where a customer called and didn't get through, e.g. "Hi, we saw we missed your call. How can we help? Reply here or book at <link>." Variants by tone (Friendly / Apologetic / Trinbagonian dialect / Jamaican dialect). Stored as `message_templates` with `scenario = 'missed_call'`. The user copies one to send manually after a missed call.

### Lead intake form
- **Lead intake form** — a public-facing form the business can share via a link or QR. Route `/w/:businessSlug` (public) renders a simple form built from the receptionist's `lead_forms` config: shows the booking questions + name + WhatsApp number. On submit, inserts a row into `leads` (status = 'new'). Shows a thank-you screen with "We'll reply on WhatsApp within <X> hours." The business gets a "Copy lead to WhatsApp" button on the lead dashboard so they can immediately reply with the right script.
- Note: the public lead form route `/w/:businessSlug` is a top-level public route, like `/b/:slug` from Week 2.

### Booking request dashboard
- **Leads dashboard** on `/dashboard/tools/whatsapp-receptionist/leads` — table of leads (name, phone, service requested, preferred date/time, status: new | contacted | booked | dropped | converted, created_at). Filter by status and date. Row actions: "View", "Copy lead to WhatsApp" (opens wa.me with a pre-filled reply using the lead's data + the right auto-reply script), "Mark as contacted/booked/dropped", "Delete". Bulk "Mark as contacted" with checkboxes. CSV export.

### Copy-to-WhatsApp buttons
- Everywhere a template or lead exists, a "Copy" button and an "Open WhatsApp" button are present. "Open WhatsApp" constructs `https://wa.me/<number>?text=<encodeURIComponent(text)>`. For leads, the number is the lead's WhatsApp; for templates, the number is the business's own (for testing) or a customer number field is provided.

### Future API fields (placeholders)
- `receptionist_settings.manual_mode` (boolean, default true) — when true, the receptionist is a script/form tool; when false, a future API integration will send real auto-replies.
- `receptionist_settings.api_connected` (boolean, default false).
- `receptionist_settings.pending_api_connection` (boolean, default false) — set true when the user clicks "Connect WhatsApp API" (a stub modal that explains the future integration and collects their interest).
- These three fields are surfaced in the UI as a "Connection status" card: "Manual mode (scripts only)" / "API connection: not connected / pending / connected". A "Connect WhatsApp API" button opens a modal that explains Meta WhatsApp Cloud API and Twilio are coming, captures the user's interest (sets pending_api_connection = true), and does nothing else in Week 5.

## Pages (route paths)

| Route | Purpose | Auth |
|---|---|---|
| `/dashboard/tools/whatsapp-receptionist` | Tool landing — setup status, connection status card, quick links to scripts/leads, recent leads count, "Open Setup" button | Required |
| `/dashboard/tools/whatsapp-receptionist/setup` | 4-step setup wizard | Required |
| `/dashboard/tools/whatsapp-receptionist/scripts` | Scripts/FAQs/service menu/booking questions manager + AI generation + copy-to-WhatsApp | Required |
| `/dashboard/tools/whatsapp-receptionist/leads` | Leads/booking requests dashboard with copy-to-WhatsApp and status workflows | Required |
| `/w/:businessSlug` | Public lead intake form — top-level public route | Public |

Route ordering in HashRouter: put `setup`, `scripts`, `leads` above any `:id` route if you later add one. The public `/w/:businessSlug` is top-level, not under dashboard.

## AI Outputs (what the AI generates)

Four AI features, each a separate Gemini call returning structured JSON:

### 1. FAQ generation
```json
{
  "faqs": [
    { "question": "...", "answer": "...", "category": "hours | pricing | services | location | booking | general" }
  ]
}
```
Returns 8–12 FAQs. Prompt inputs: business name, category, country, 1–2 sentence business description, service menu. Strict instruction: Caribbean-friendly tone, answers <= 300 chars, real questions a Caribbean customer would ask.

### 2. Booking questions suggestion
```json
{
  "questions": [
    { "id": "name", "label": "Your name", "type": "text", "required": true },
    { "id": "phone", "label": "WhatsApp number", "type": "tel", "required": true },
    { "id": "service", "label": "Which service?", "type": "select", "options": ["<from service menu>"], "required": true },
    { "id": "date", "label": "Preferred date", "type": "date", "required": true },
    { "id": "time", "label": "Preferred time", "type": "time", "required": false },
    { "id": "notes", "label": "Anything else?", "type": "text", "required": false }
  ]
}
```
Returns 5–8 suggested questions. User toggles which to keep and can add custom ones.

### 3. Auto-reply scripts
```json
{
  "templates": [
    { "scenario": "greeting_menu", "text": "Hi! Thanks for messaging <Business>. Here's what we offer:\n1. <service 1> - $X\n2. <service 2> - $Y\nReply with the number to book." },
    { "scenario": "hours_query", "text": "..." },
    { "scenario": "pricing_query", "text": "..." },
    { "scenario": "booking_start", "text": "..." },
    { "scenario": "out_of_hours", "text": "..." },
    { "scenario": "fallback_thanks", "text": "..." }
  ]
}
```
Returns 6 templates for the 6 scenarios. Each <= 1000 chars (WhatsApp-friendly, no weird unicode). Prompt inputs: receptionist_settings + FAQs + service menu + booking questions + country. Strict instruction: short, friendly, no aggressive upsells, end with a clear next step.

### 4. Missed-call recovery
```json
{
  "templates": [
    { "tone": "friendly", "text": "Hi <Customer?>, we saw we missed your call. Sorry about that! How can we help? Reply here or book at <link>." },
    { "tone": "apologetic", "text": "..." },
    { "tone": "trinbagonian_dialect", "text": "..." },
    { "tone": "jamaican_dialect", "text": "..." }
  ]
}
```
Returns 4 tones. <= 280 chars each. Prompt inputs: business name, country, booking link (constructed from the public `/w/<slug>` URL), optional customer name placeholder.

All calls use `gemini-2.0-flash` with `responseMimeType: 'application/json'`. Strip fences, robust parse; on failure show toast, do not crash. Each call is independent and regenerable.

## Supabase Tables (SQL)

Migration `supabase/migrations/0005_whatsapp_receptionist.sql`:

```sql
-- Receptionist settings (one per user — the configured "receptionist")
create table if not exists public.receptionist_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  business_name text not null,
  business_slug text not null unique,           -- used for the public /w/:slug lead form
  whatsapp_number text,                         -- E.164
  category text,
  country text not null default 'TT',
  working_hours jsonb,                           -- same shape as business_pages.opening_hours from Week 2
  service_menu jsonb not null default '[]',     -- [{name, description, price_cents, currency, duration}]
  booking_questions jsonb not null default '[]',-- [{id,label,type,options,required}]
  manual_mode boolean not null default true,
  api_connected boolean not null default false,
  pending_api_connection boolean not null default false,
  api_provider text,                              -- null | meta_cloud_api | twilio (future)
  setup_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists receptionist_settings_user_idx on public.receptionist_settings(user_id);
create index if not exists receptionist_settings_slug_idx on public.receptionist_settings(business_slug);

-- FAQs (many per receptionist)
create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  settings_id uuid not null references public.receptionist_settings(id) on delete cascade,
  question text not null,
  answer text not null,
  category text,                                  -- hours | pricing | services | location | booking | general
  ai_generated boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists faqs_settings_idx on public.faqs(settings_id);
create index if not exists faqs_user_idx on public.faqs(user_id);

-- Lead forms (the public form config — denormalized from settings for flexibility)
create table if not exists public.lead_forms (
  id uuid primary key default gen_random_uuid(),
  settings_id uuid not null unique references public.receptionist_settings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  form_fields jsonb not null default '[]',        -- the resolved set of booking questions to show publicly
  intro_text text,
  thank_you_text text,
  reply_within_hours int not null default 24,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lead_forms_settings_idx on public.lead_forms(settings_id);

-- Leads (one per form submission — the booking requests / customer inquiries)
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  settings_id uuid not null references public.receptionist_settings(id) on delete cascade,
  lead_form_id uuid references public.lead_forms(id) on delete set null,
  business_slug text not null,
  lead_data jsonb not null,                       -- {name, phone, service, date, time, notes, ...} per form fields
  status text not null default 'new',             -- new | contacted | booked | dropped | converted
  source text not null default 'web_form',        -- web_form | manual | future: whatsapp_api
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_user_idx on public.leads(user_id);
create index if not exists leads_settings_idx on public.leads(settings_id);
create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_created_idx on public.leads(created_at desc);

-- Message templates (the AI-generated scripts + missed-call templates + any user-saved templates)
create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  settings_id uuid not null references public.receptionist_settings(id) on delete cascade,
  scenario text not null,                         -- greeting_menu | hours_query | pricing_query | booking_start | out_of_hours | fallback_thanks | missed_call | custom
  tone text,                                       -- friendly | firm | apologetic | trinbagonian_dialect | jamaican_dialect | bajan_dialect | null
  text text not null,
  ai_generated boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists message_templates_settings_idx on public.message_templates(settings_id);
create index if not exists message_templates_scenario_idx on public.message_templates(scenario);
create index if not exists message_templates_user_idx on public.message_templates(user_id);

-- RLS
alter table public.receptionist_settings enable row level security;
alter table public.faqs enable row level security;
alter table public.lead_forms enable row level security;
alter table public.leads enable row level security;
alter table public.message_templates enable row level security;

-- Owner CRUD on all their own rows
create policy "owner crud settings" on public.receptionist_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner crud faqs" on public.faqs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner crud lead_forms" on public.lead_forms
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner crud leads" on public.leads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner crud templates" on public.message_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Public: anonymous users can INSERT leads (for the public /w/:slug form) but cannot read/list leads.
-- Allow public insert on leads ONLY when the row's business_slug matches an active lead_form.
create policy "public insert leads" on public.leads
  for insert with check (
    exists (
      select 1 from public.lead_forms lf
      join public.receptionist_settings rs on rs.id = lf.settings_id
      where lf.is_active = true
        and rs.business_slug = leads.business_slug
    )
  );

-- Public: anyone can read the active lead form config + business_slug -> settings to render the form
create policy "public read lead_forms by slug" on public.lead_forms
  for select using (
    is_active = true and
    exists (select 1 from public.receptionist_settings rs where rs.id = settings_id)
  );
create policy "public read settings slug only" on public.receptionist_settings
  for select using (setup_completed = true);   -- exposes business_name, slug, service_menu, lead form linkage; not the API flags
```

Note on public exposure: `receptionist_settings` public-read policy exposes the row but the app should only SELECT the public-facing fields (business_name, slug, service_menu, working_hours) when rendering `/w/:slug` — never select `whatsapp_number`, API flags, or user_id on the public path. The RLS allows reading the row, but the app's select must be column-limited.

Slug generation: same approach as Week 2 (lowercase business name, hyphenate, suffix on collision).

## Digital Download Version

**Product:** AI WhatsApp Receptionist Prompt Pack — **$37 USD**

A downloadable pack of the AI-generated scripts + prompts for businesses that want to run their WhatsApp receptionist manually on their own phone without a TriniBuild account. After purchase:

- A zipped bundle containing:
  - `receptionist-scripts.md` — all auto-reply scripts (greeting_menu, hours_query, pricing_query, booking_start, out_of_hours, fallback_thanks) + missed-call recovery templates across 4 tones, formatted for easy copy/paste into WhatsApp
  - `faq-library.md` — the AI-generated FAQ Q/A list, categorized
  - `booking-intake-questions.txt` — the suggested booking question set + a blank template for customization
  - `lead-intake-form.html` — a standalone static HTML lead intake form (Tailwind via CDN, posts to a Google Form or Formspree endpoint the user configures — instructions in README) so the business can collect leads on their own hosting
  - `prompt-templates.json` — the raw Gemini prompts used to generate the scripts (so a technically-minded owner can re-run them in any AI tool)
  - `whatsapp-quick-reply-setup.txt` — step-by-step instructions to set up WhatsApp Business Quick Replies with the generated scripts (so the owner can tap a quick reply instead of pasting)
  - `README.txt` — how to use the pack, how to wire the lead form to Formspree/Google Forms, how to set up WhatsApp Quick Replies
- Generation flow: same setup wizard inputs → run all 4 Gemini calls → package via JSZip → upload to `digital-downloads` bucket under `whatsapp-receptionist/<purchase_id>.zip` → return 7-day signed URL → record in `digital_purchases` (product_slug='whatsapp-receptionist-pack', amount_cents=3700) → email link + dashboard download button.
- 7-day re-download; after that re-purchase required.

## Codex Prompt

```
You are building Week 5 of the TriniBuild AI Services Marketplace: WhatsApp Receptionist Lite (script + form + lead toolkit, NOT a full WhatsApp API integration yet).

Project root: C:\Users\Banjo\OneDrive\Documents\Trinibuild\
Stack: React 18 + Vite + TypeScript + Tailwind + Supabase (Postgres + RLS) + Google Gemini (gemini-2.0-flash). HashRouter in src/App.tsx. supabaseClient at src/services/supbbaseClient.ts. authService at src/services/authService.ts. geminiService.ts exists from Weeks 2-4 — extend it.

Do the following, in order:

1. Create migration `supabase/migrations/0005_whatsapp_receptionist.sql` with the SQL from this spec's "Supabase Tables" section (receptionist_settings, faqs, lead_forms, leads, message_templates, all RLS including the public insert policy on leads and public read on lead_forms/settings). Run it; confirm tables exist. Double-check the public insert policy on leads matches a real active lead_form for the slug.

2. Extend src/services/geminiService.ts with FOUR independent functions:
   - generateFaqs(input: FaqInput): Promise<FaqOutput> — returns 8-12 FAQs.
   - suggestBookingQuestions(input): Promise<BookingQuestionOutput> — returns 5-8 suggested questions.
   - generateAutoReplyScripts(input): Promise<AutoReplyOutput> — returns 6 templates (greeting_menu, hours_query, pricing_query, booking_start, out_of_hours, fallback_thanks).
   - generateMissedCallTemplates(input): Promise<MissedCallOutput> — returns 4 tones.
   All use gemini-2.0-flash, responseMimeType 'application/json', robust parse, fence stripping, never crash on failure (toast + return empty array). The schemas are in the spec's "AI Outputs".

3. Create src/types/whatsappReceptionist.ts with ReceptionistSettings, Faq, LeadForm, Lead, MessageTemplate, LeadStatus enum (new | contacted | booked | dropped | converted), TemplateScenario enum, Tone enum, BookingQuestion, ServiceMenuItem.

4. Build pages under `src/pages/dashboard/tools/whatsapp-receptionist/`:
   - `WhatsAppReceptionistHome.tsx` — landing. Shows setup status (setup_completed?), connection status card (manual_mode / api_connected / pending_api_connection with a friendly "Manual mode (scripts only)" label), recent leads count, quick-link cards to Scripts and Leads, "Open Setup" button. "Connect WhatsApp API" button opens a modal that explains Meta WhatsApp Cloud API / Twilio are coming, sets pending_api_connection=true, does nothing else.
   - `Setup.tsx` — 4-step wizard. Step 1 business identity; step 2 services menu (add/edit/delete up to 20); step 3 FAQs (add/edit/delete OR click "AI-generate FAQs" → runs generateFaqs → prefills the table, editable); step 4 booking questions (AI "Suggest questions" → runs suggestBookingQuestions → user toggles/adds custom). On finish, insert/update receptionist_settings, insert faqs, insert/update lead_form. Set setup_completed=true, manual_mode=true, api_connected=false. Auto-generate business_slug (same algorithm as Week 2 — suffix on collision).
   - `Scripts.tsx` — manager. Tabs: FAQs (table CRUD + AI generate), Service Menu (list CRUD + "Copy service menu" button), Booking Questions (list CRUD + AI suggest), Auto-Reply Scripts ("Generate" button → runs generateAutoReplyScripts → inserts message_templates rows → renders them as cards each with Copy and "Open WhatsApp" buttons; editable), Missed-Call Templates ("Generate" → runs generateMissedCallTemplates → cards with Copy/Open WhatsApp). Each template card shows the scenario/tone, the text, a "Regenerate" per item, and a "Delete" (soft: is_active=false). "Open WhatsApp" builds https://wa.me/<number>?text=<encodeURIComponent(text)> — for templates, number = the business's own whatsapp_number (for testing) with a toggle to enter a customer number.
   - `Leads.tsx` — dashboard. Table of leads with filters (status, date). Row actions: View (drawer), "Copy lead to WhatsApp" (opens wa.me with a pre-filled reply merging the lead's data into the booking_start template), "Mark as contacted/booked/dropped", "Delete" (soft or hard — your call, hard is fine with cascades). Bulk "Mark as contacted" via checkboxes. "Export CSV" (client-side, proper quoting). Status workflow badges with color.

5. Public route: `src/pages/public/LeadForm.tsx` for `/w/:businessSlug` — fetch the active lead_form + the public-facing columns of receptionist_settings by slug (business_name, service_menu, working_hours). Render the form from lead_form.form_fields (respecting type: text/tel/email/date/time/select, required). On submit, insert a row into leads (business_slug, lead_data JSONB from the form, status='new', source='web_form'). Show a thank-you screen with the configured reply_within_hours. Validate via the public insert RLS policy (no auth needed). If slug not found or form inactive, show a friendly "this form is not available" card.

6. Wire routes in src/App.tsx (HashRouter). Order matters — put `setup`, `scripts`, `leads` above any future `:id` route. The public `/w/:businessSlug` is top-level:
   - /dashboard/tools/whatsapp-receptionist → WhatsAppReceptionistHome (protected)
   - /dashboard/tools/whatsapp-receptionist/setup → Setup (protected)
   - /dashboard/tools/whatsapp-receptionist/scripts → Scripts (protected)
   - /dashboard/tools/whatsapp-receptionist/leads → Leads (protected)
   - /w/:businessSlug → LeadForm (public, top-level)

7. Copy-to-WhatsApp buttons everywhere: helper `buildWhatsAppUrl(number, text) => \`https://wa.me/${number}?text=${encodeURIComponent(text)}\`` in src/utils/whatsapp.ts. Also a `copyToClipboard(text)` helper with a toast.

8. Future-API fields UI: in WhatsAppReceptionistHome and Setup, surface manual_mode, api_connected, pending_api_connection honestly. The "Connect WhatsApp API" modal: explains Meta WhatsApp Cloud API and Twilio are coming, captures the user's interest (sets pending_api_connection=true, optionally api_provider='meta_cloud_api'|'twilio' from a radio). Does NOT make any real API call. Add a TODO comment marking the future integration point in geminiService.ts and in a new src/services/whatsappApiService.ts stub (empty exported functions with TODO bodies — do not implement).

9. Digital download flow behind VITE_FEATURE_DIGITAL_DOWNLOADS=true:
   - "Buy AI WhatsApp Receptionist Prompt Pack ($37)" button on WhatsAppReceptionistHome opens a confirm modal.
   - On confirm, run all 4 Gemini calls with the user's current settings, package the 7 files via JSZip, upload to digital-downloads bucket under `whatsapp-receptionist/<purchase_id>.zip`, write a digital_purchases row (product_slug='whatsapp-receptionist-pack', amount_cents=3700), return 7-day signed URL, show download button + email link (stub email with TODO if no email service wired).
   - Payment MVP: "I've paid — confirm" flips paid=true; stripe_payment_intent_id column stubbed.

10. Use only Tailwind utilities. Mobile-first. Reuse lucide-react icons.

11. Do not break Weeks 1-4 routes. Run `npm run build` and `npx tsc --noEmit`; fix all errors. Manually verify: run the setup wizard for a sample salon business, AI-generate FAQs (8-12 returned), AI-suggest booking questions (5-8), AI-generate auto-reply scripts (6 scenarios), AI-generate missed-call templates (4 tones). Copy a template, open WhatsApp link. Submit the public lead form at /w/<slug> in an incognito window — a lead appears on the dashboard. Mark it contacted. Copy lead to WhatsApp. Export CSV. Click "Connect WhatsApp API" — modal opens, pending_api_connection becomes true. Buy the prompt pack (with flag on) — zip downloads with all 7 files.

Stop and report: files created, migration result, build result, errors you couldn't resolve, and a clear note that this is the Lite/manual layer and the future API integration point is stubbed.
```

## Acceptance Criteria

- [ ] A user can complete the 4-step setup wizard; on finish, `receptionist_settings`, `faqs`, and `lead_forms` rows are created with `manual_mode=true`, `api_connected=false`, `setup_completed=true`.
- [ ] "AI-generate FAQs" returns 8–12 FAQs with Caribbean-friendly answers <= 300 chars; user can edit before saving; saved FAQs appear in the Scripts tab.
- [ ] "Suggest booking questions" returns 5–8 questions; user can toggle/keep/add custom; saved set drives the public lead form fields.
- [ ] "Generate Auto-Reply Scripts" returns 6 templates (greeting_menu, hours_query, pricing_query, booking_start, out_of_hours, fallback_thanks); each <= 1000 chars; each has working Copy and "Open WhatsApp" buttons.
- [ ] "Generate Missed-Call Templates" returns 4 tones; each <= 280 chars; Copy and "Open WhatsApp" work.
- [ ] The service menu can be added/edited/deleted (up to 20 items); "Copy service menu" formats as a WhatsApp-friendly numbered list and copies to clipboard.
- [ ] The public lead form at `/w/:businessSlug` renders from the active lead_form config; submits insert a `leads` row with `status='new'`, `source='web_form'` anonymously (no auth required); shows the thank-you screen.
- [ ] If the slug is not found or the lead form is inactive, `/w/:slug` shows a friendly "not available" card; no 500 errors.
- [ ] The Leads dashboard lists leads with filters (status, date); row actions (View, Copy lead to WhatsApp, Mark as contacted/booked/dropped, Delete) all work; bulk Mark as contacted works; CSV export downloads and opens correctly.
- [ ] "Copy lead to WhatsApp" opens `https://wa.me/<lead_phone>?text=<encoded reply>` with the lead's data merged into the booking_start template.
- [ ] The "Connect WhatsApp API" modal opens, explains the future integration, captures interest, sets `pending_api_connection=true`; does NOT make any real API call.
- [ ] A `whatsappApiService.ts` stub exists with empty exported functions and TODO bodies; the future API integration point is clearly marked.
- [ ] RLS: owner can CRUD their own settings/faqs/lead_forms/leads/templates; anonymous users can INSERT into leads only when the business_slug matches an active lead_form; anonymous users cannot read/list leads or other users' data.
- [ ] Public select of `receptionist_settings` is column-limited in the app (never selects whatsapp_number, api flags, user_id on the public path) — verify by inspecting the query in LeadForm.tsx.
- [ ] Digital download (when flag on) generates the zip with all 7 files, uploads, returns a 7-day signed URL, and records the purchase.
- [ ] `npm run build` and `npx tsc --noEmit` pass with zero errors.
- [ ] No existing Week 1–4 routes are broken.
- [ ] Documentation/notes make clear that this is the Lite/manual layer and the future WhatsApp Cloud API / Twilio integration is stubbed, not implemented.
