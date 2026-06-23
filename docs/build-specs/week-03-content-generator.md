# Week 3 Build Spec — AI Social Media Content Generator

## Goal

Build an AI social media content generator for Caribbean small businesses. The user picks their business type and a Caribbean event/cultural context, and Google Gemini generates a batch of ready-to-post content: 10 captions, 10 hooks, 5 reel scripts, a 30-day content calendar, hashtag sets, and CTA suggestions. Content is organized in a calendar view, a saved library, and a generator history. The tool supports a "Caribbean event mode" that adapts copy to cultural moments (Carnival, Christmas, Easter, Divali, Eid, Emancipation, Independence, Crop Over, Jamaica Carnival).

This is Week 3 of the TriniBuild AI Services Marketplace. It assumes Weeks 1–2 (auth, dashboard shell, Supabase client, routing, Gemini service, RLS patterns) are complete. Reuse `geminiService.ts` from Week 2.

## Features

### Core generation
- **Business context input** — business name, category (same dropdown list as Week 2), target platforms (multi-select: Instagram, Facebook, WhatsApp Status, TikTok/Reels), brand voice (Professional / Warm / Bold / Trinbagonian dialect / Jamaican dialect / Bajan dialect), and optional product/service list.
- **Caribbean event mode** — dropdown of cultural events: Carnival (TT), Jamaica Carnival, Crop Over (Barbados), Christmas, Easter, Divali, Eid, Emancipation Day (Aug 1), Independence Day (TT Aug 31 / JA Aug 6 / BB Nov 30). Selecting one (or "None / Evergreen") changes the prompt to weave in relevant themes, foods, colors, slang, hashtags. Optional date range so calendar aligns to the event window.
- **Generate button** — one Gemini call returns structured JSON (see AI Outputs). Shows a loading state (≤ 15s typical). On success, all outputs are saved to `content_generations` and rendered in tabs: Captions, Hooks, Reel Scripts, Calendar, Hashtags, CTAs.
- **Regenerate section** — each tab has a "Regenerate" button that re-runs Gemini for just that section using the existing context as input.

### Content types (the 9 explicitly supported)
1. Instagram caption (with emoji, <= 2200 chars, hashtag block at end)
2. Facebook post (longer-form, <= 5000 chars, friendly tone)
3. WhatsApp status (<= 139 chars, punchy)
4. Reel script (30–60s, shot-by-shot: hook, b-roll, voiceover text, on-screen text, CTA)
5. Promo offer (offer text + terms + urgency line + CTA)
6. Daily special ("Today only" style post)
7. Product launch (teaser + reveal + specs + CTA)
8. Testimonial post (quote + framing + CTA)
9. Limited-time offer (countdown-style + terms + CTA)

Each generated item has a "type" tag and the user can filter the saved library by type.

### Calendar
- **30-day content calendar** — AI proposes one post per day for 30 days, each with: date, content type, platform, caption/short text, suggested hashtag set, suggested image prompt (a short description of what image to pair). Rendered as a month grid (reuse a lightweight calendar lib or build a simple CSS grid). Each day cell is clickable → opens the full caption in a side drawer with "Copy" and "Save to Library" buttons.
- **Calendar page** `/dashboard/tools/content-generator/calendar` — full-screen 30-day grid view, filter by platform, "Export to CSV" and "Copy all" buttons.

### Saved library
- **Save to library** — any generated caption/hook/script can be starred into the long-term `content_library` table. Library page `/dashboard/tools/content-generator/saved` shows a filterable (by type, by event, by date) grid of saved items, each with copy button, edit (inline), delete, and "Mark as used" (sets `used_on_post = true`).

### History
- Tool landing page `/dashboard/tools/content-generator` shows recent generations (cards: date, business, event mode, count of items) and a "New Generation" button.

### Copy to clipboard
- Every generated text block has a one-click "Copy" button (uses `navigator.clipboard.writeText` with a fallback to a hidden textarea + `document.execCommand('copy')`). Toast on success.

## Pages (route paths)

| Route | Purpose | Auth |
|---|---|---|
| `/dashboard/tools/content-generator` | Tool landing — recent generations, "New Generation" CTA, quick filters | Required |
| `/dashboard/tools/content-generator/calendar` | 30-day calendar grid view | Required |
| `/dashboard/tools/content-generator/saved` | Saved library — filterable grid | Required |

The "New Generation" flow opens as a modal or inline panel on the tool landing page (not a separate route). After generation, results render in tabs on the same page (state-driven, not route-driven). Optionally support a query `?gen_id=<id>` to deep-link to a past generation's results.

All dashboard routes are children of the existing HashRouter `App.tsx` DashboardLayout from Week 1.

## AI Outputs (what the AI generates)

Single Gemini call with structured prompt returns JSON:

```json
{
  "captions": [
    {
      "type": "instagram_caption" | "facebook_post" | "whatsapp_status" | "promo_offer" | "daily_special" | "product_launch" | "testimonial_post" | "limited_time_offer",
      "platform": "instagram" | "facebook" | "whatsapp" | "tiktok",
      "text": "...",
      "hashtag_set": ["#carnival2026", "#trinifood", ...],
      "image_prompt": "Short description of what image to pair"
    }
  ],
  "hooks": [
    { "text": "1-line scroll-stopping hook", "platform": "tiktok" | "instagram_reel" }
  ],
  "reel_scripts": [
    {
      "title": "...",
      "duration_seconds": 30,
      "shots": [
        { "shot": 1, "type": "hook" | "broll" | "voiceover" | "onscreen_text" | "cta", "direction": "...", "text": "..." }
      ]
    }
  ],
  "calendar": [
    {
      "day": 1, "date": "2026-07-01",
      "content_type": "instagram_caption" | "whatsapp_status" | ...,
      "platform": "...",
      "text": "...",
      "hashtag_set": [...],
      "image_prompt": "..."
    }
  ],
  "hashtag_sets": [
    { "name": "Carnival Food Vendor", "tags": ["#carnival", "#trinifood", ...] }
  ],
  "cta_suggestions": [
    { "text": "DM to order", "platform": "instagram" },
    { "text": "WhatsApp us: <number>", "platform": "whatsapp" }
  ]
}
```

Counts: exactly **10 captions** (mix of types), **10 hooks**, **5 reel scripts**, **30 calendar days**, **3–5 hashtag sets**, **4–6 CTA suggestions**. Validate counts in code; if Gemini returns fewer, show a "regenerate" hint and pad with empty slots the user can manually fill.

Prompt must include: business name, category, platforms, brand voice, event mode (+ date range if set), explicit instruction to weave in Caribbean context (foods, slang, cultural references appropriate to the event), and a hard instruction to return valid JSON matching the schema with the exact counts above.

Use `gemini-2.0-flash` with `responseMimeType: 'application/json'`. Strip fences if present; on parse failure, retry once with a stricter "return only JSON" preface; on second failure, show a toast and save the raw text in `content_generations.raw_response` for debugging.

## Supabase Tables (SQL)

Migration `supabase/migrations/0003_content_generator.sql`:

```sql
-- Content generations (one per "Generate" click — the raw batch output)
create table if not exists public.content_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null,
  category text,
  platforms text[] not null default '{}',
  brand_voice text,
  event_mode text not null default 'evergreen',  -- evergreen | carnival_tt | jamaica_carnival | crop_over | christmas | easter | divali | eid | emancipation | independence
  event_date_start date,
  event_date_end date,
  captions jsonb not null default '[]',
  hooks jsonb not null default '[]',
  reel_scripts jsonb not null default '[]',
  calendar jsonb not null default '[]',
  hashtag_sets jsonb not null default '[]',
  cta_suggestions jsonb not null default '[]',
  raw_response text,
  model text not null default 'gemini-2.0-flash',
  created_at timestamptz not null default now()
);

create index if not exists content_generations_user_idx on public.content_generations(user_id);
create index if not exists content_generations_created_idx on public.content_generations(created_at desc);

-- Content calendar (the 30-day grid — denormalized from a generation for fast calendar queries)
create table if not exists public.content_calendar (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references public.content_generations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  day int not null,
  scheduled_date date not null,
  content_type text not null,
  platform text not null,
  text text not null,
  hashtag_set text[] not null default '{}',
  image_prompt text,
  status text not null default 'planned',  -- planned | posted | skipped
  created_at timestamptz not null default now()
);

create index if not exists content_calendar_user_idx on public.content_calendar(user_id);
create index if not exists content_calendar_date_idx on public.content_calendar(scheduled_date);
create index if not exists content_calendar_generation_idx on public.content_calendar(generation_id);

-- Content library (curated/starred items the user keeps long-term)
create table if not exists public.content_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  generation_id uuid references public.content_generations(id) on delete set null,
  item_type text not null,         -- instagram_caption | facebook_post | whatsapp_status | reel_script | promo_offer | daily_special | product_launch | testimonial_post | limited_time_offer | hook
  platform text,
  text text not null,
  hashtag_set text[] not null default '{}',
  image_prompt text,
  event_mode text,
  notes text,
  used_on_post boolean not null default false,
  used_on_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_library_user_idx on public.content_library(user_id);
create index if not exists content_library_type_idx on public.content_library(item_type);
create index if not exists content_library_event_idx on public.content_library(event_mode);

-- RLS
alter table public.content_generations enable row level security;
alter table public.content_calendar enable row level security;
alter table public.content_library enable row level security;

create policy "owner crud generations" on public.content_generations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner crud calendar" on public.content_calendar
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner crud library" on public.content_library
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

## Digital Download Version

**Product:** 30-Day Caribbean Business Content Calendar — **$17–$29 USD** (tiered: $17 evergreen, $23 single-event, $29 multi-event bundle)

A digital download for users who want a ready-made Caribbean-aware content calendar without logging into the dashboard repeatedly. After purchase:

- A zipped bundle containing:
  - `30-day-calendar.md` — the full 30-day calendar as a Markdown table (day, date, type, platform, caption, hashtags, image prompt)
  - `30-day-calendar.csv` — same data as CSV (Day,Date,Content Type,Platform,Text,Hashtags,Image Prompt)
  - `captions.md` — all 10 captions grouped by type with hashtags
  - `hooks.md` — all 10 hooks
  - `reel-scripts.md` — all 5 reel scripts formatted as shot lists
  - `hashtag-sets.txt` — newline-separated hashtag sets, ready to copy
  - `ctas.txt` — CTA suggestions
  - `event-context.md` — a short write-up of the chosen Caribbean event and suggested posting cadence around it
  - `README.txt` — how to use the calendar, how to adapt captions to their business
- Generation flow: same inputs as the in-app generator → same Gemini call → package via JSZip server-side or client-side → upload to Supabase Storage bucket `digital-downloads` under `content-calendar/<purchase_id>.zip` → return signed URL valid 7 days → email link + dashboard download button.
- Record purchase in `digital_purchases` (user_id, product_slug='content-calendar', variant='evergreen|single-event|multi-event', amount_cents, download_url, created_at, expires_at). 7-day re-download; after that re-purchase required.
- For multi-event bundle ($29): run the generator 3 times (one per chosen event) and include all 3 calendars in the zip with a top-level `event-<slug>/` folder per event.

## Codex Prompt

```
You are building Week 3 of the TriniBuild AI Services Marketplace: an AI Social Media Content Generator with Caribbean cultural event mode.

Project root: C:\Users\Banjo\OneDrive\Documents\Trinibuild\
Stack: React 18 + Vite + TypeScript + Tailwind + Supabase + Google Gemini (gemini-2.0-flash). HashRouter in src/App.tsx. Supabase client at src/services/supabaseClient.ts. Auth via src/services/authService.ts. A geminiService.ts should exist from Week 2 — extend it; do not duplicate.

Do the following, in order:

1. Create migration `supabase/migrations/0003_content_generator.sql` with the SQL from this spec's "Supabase Tables" section (content_generations, content_calendar, content_library + RLS). Run it and confirm tables exist.

2. Extend src/services/geminiService.ts with `generateContent(input: ContentGenInput): Promise<ContentGenOutput>` that:
   - Builds the prompt with business context + selected platforms + brand voice + event_mode (+ date range).
   - Uses the 9 supported content types (Instagram caption, Facebook post, WhatsApp status, Reel script, Promo offer, Daily special, Product launch, Testimonial post, Limited-time offer).
   - Calls gemini-2.0-flash with responseMimeType: 'application/json' and the JSON schema from "AI Outputs".
   - Enforces counts: 10 captions, 10 hooks, 5 reel scripts, 30 calendar days, 3-5 hashtag sets, 4-6 CTAs. If the response has fewer of any, retry once with a stricter preface. On second failure, save raw_response and surface a toast; do not crash.
   - Strips markdown fences if present; robust JSON parse.
   - Also export `regenerateSection(sectionName, context)` for per-section regeneration (captions | hooks | reel_scripts | calendar | hashtag_sets | cta_suggestions).

3. Build pages under `src/pages/dashboard/tools/content-generator/`:
   - `ContentGeneratorHome.tsx` — recent generations list (cards: date, business, event_mode, item counts), "New Generation" button opening the input panel as a modal or inline card. After generation, render results in 6 tabs (Captions, Hooks, Reel Scripts, Calendar, Hashtags, CTAs). Support `?gen_id=` to load a past generation.
   - `Calendar.tsx` — full 30-day grid. Build a CSS grid month view (no heavy lib needed); each cell shows day number, content_type icon, truncated text; click opens a right-side drawer with full text, hashtags, image prompt, "Copy" and "Save to Library" and "Mark as posted" buttons. Filter by platform. "Export CSV" and "Copy all" buttons.
   - `SavedLibrary.tsx` — filterable grid (filters: item_type, event_mode, date range, used_on_post). Each card: type badge, text preview, hashtags chips, copy button, inline edit (textarea), delete, "Mark as used" toggle.

4. Wire routes in src/App.tsx (HashRouter):
   - /dashboard/tools/content-generator → ContentGeneratorHome (protected)
   - /dashboard/tools/content-generator/calendar → Calendar (protected)
   - /dashboard/tools/content-generator/saved → SavedLibrary (protected)

5. When a generation completes, write one row to content_generations (with all JSONB fields) and bulk-insert 30 rows to content_calendar (one per day). "Save to Library" inserts one row to content_library. "Mark as posted" updates content_calendar.status or content_library.used_on_post.

6. Copy-to-clipboard on every text block: navigator.clipboard.writeText with a hidden-textarea + execCommand fallback for older browsers. Show a toast on success and on failure.

7. Build the digital-download flow behind feature flag VITE_FEATURE_DIGITAL_DOWNLOADS=true:
   - "Buy 30-Day Calendar" button on ContentGeneratorHome opens a modal with 3 tiers ($17 evergreen, $23 single-event, $29 multi-event).
   - On confirm, run the generator (1× for $17/$23, 3× for $29 multi-event), package the 8–9 files listed in the spec via JSZip, upload to digital-downloads bucket, write digital_purchases row, return signed URL valid 7 days, show download button + email link (stub the email with a TODO if no email service wired).
   - Payment: MVP can use a "I've paid — confirm" button flipping paid=true, with a stripe_payment_intent_id text column stubbed for later.

8. Type everything. Create src/types/contentGenerator.ts with ContentGenInput, ContentGenOutput, ContentItem, ReelScript, CalendarDay, HashtagSet, CtaSuggestion, ContentType enum (9 values), EventMode enum (10 values).

9. Use only Tailwind utilities. Mobile-first. Reuse lucide-react icons.

10. Do not break Weeks 1-2 routes. Run npm run build and npx tsc --noEmit; fix all errors. Manually verify: generate content for a "Food Vendor" with event_mode "carnival_tt", confirm 10 captions / 10 hooks / 5 reel scripts / 30 calendar days, save 2 items to library, view them on /saved, copy a caption to clipboard, mark a calendar day as posted.

Stop and report: files created, migration result, build result, errors you couldn't resolve.
```

## Acceptance Criteria

- [ ] A user can fill the generation input form (business name, category, platforms, brand voice, event mode, optional date range) and click Generate.
- [ ] The Gemini call returns within 15s on a normal connection; on failure a toast shows and the app does not crash; raw_response is saved on parse failure.
- [ ] Exactly 10 captions, 10 hooks, 5 reel scripts, 30 calendar days are returned; if counts are short, a regenerate hint is shown.
- [ ] Captions correctly span the 9 content types when requested; each caption has the right `type` tag and platform.
- [ ] Event mode visibly affects copy: a Carnival-mode generation references Carnival foods/colors/hashtags; a Christmas-mode references Christmas themes; evergreen has none.
- [ ] The 30-day calendar renders as a grid; each day is clickable; the drawer shows full text + hashtags + image prompt; Copy and Save to Library work.
- [ ] Calendar "Export CSV" downloads a CSV with columns Day, Date, Content Type, Platform, Text, Hashtags, Image Prompt; "Copy all" copies the calendar as Markdown to clipboard.
- [ ] Saved library page filters by type, event, date, and used status; inline edit, delete, and Mark as Used all work.
- [ ] Every text block has a working Copy button with a toast.
- [ ] RLS: user A cannot read user B's generations, calendar, or library rows.
- [ ] Digital download (when flag on) generates the zip with all files, uploads, returns a 7-day signed URL, and records the purchase.
- [ ] `npm run build` and `npx tsc --noEmit` pass with zero errors.
- [ ] No existing Week 1–2 routes are broken.
