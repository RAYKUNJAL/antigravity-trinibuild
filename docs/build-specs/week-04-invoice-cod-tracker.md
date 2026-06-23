# Week 4 Build Spec — Invoice + Cash/COD Tracker

## Goal

Build an invoice and cash/COD (cash on delivery) payment tracker for Caribbean small businesses. Caribbean commerce runs heavily on cash, bank transfers, and COD — not Stripe. This tool lets a user create a customer, build an invoice with line items (qty, price, discount, tax), send or print the invoice, record payments across multiple methods (cash, bank transfer, partial), upload payment screenshots as proof, generate WhatsApp payment reminder text via AI, and view daily/monthly sales summaries and export CSV.

This is Week 4 of the TriniBuild AI Services Marketplace. It assumes Weeks 1–3 (auth, dashboard, Supabase, Gemini service, RLS patterns, storage buckets) are complete. Reuse `geminiService.ts` and `supabaseClient.ts`.

## Features

### Core
- **Create invoice** — form with: customer selector (existing or "add new" inline), invoice number (auto `INV-YYYYMM-NNNN` or custom), issue date, due date, currency dropdown (TTD, JMD, BBD, USD, GYD), line items (description, qty, unit price, discount % or flat, tax %), notes, terms. Live totals: subtotal, total discount, total tax, grand total. Up to 50 line items.
- **Add customer** — modal: name, phone (WhatsApp preferred), email, address, customer type (individual | business), tax ID optional, notes. Reusable across invoices.
- **Line items** — each: description (text), qty (decimal allowed), unit_price (decimal), discount (flat amount or %, toggle), tax_rate (%). Per-line subtotal = qty * unit_price - discount + tax. Reorder, delete, duplicate.
- **Payment statuses (10)** — `draft`, `sent`, `cash_pending`, `cash_paid`, `bank_transfer_pending`, `bank_transfer_confirmed`, `partial_paid`, `overdue`, `cancelled`, `refunded`. Status transitions are controlled (see state machine below). Status badge color-coded on invoice cards and detail.
- **Payment recording** — a "Record Payment" panel on invoice detail: amount, method (cash | bank_transfer | other), date, reference (e.g. bank transfer ref), notes, **payment screenshot upload** (image <= 5MB, jpg/png/webp/pdf) stored in Supabase Storage bucket `payment-screenshots`. Multiple payments allowed; sum vs grand total drives status (full → cash_paid/bank_transfer_confirmed, partial → partial_paid).
- **Printable invoice page** — `/dashboard/tools/invoices/:id` has a "Print" button that opens a print-optimized view (or a dedicated route `/dashboard/tools/invoices/:id/print`) with the business's name/logo (from user profile), invoice meta, line items table, totals, payment history, QR code (optional) encoding the invoice URL. Uses `window.print()` with a `@media print` stylesheet.
- **Receipt page** — when a payment is recorded, a "View Receipt" button opens a receipt view (or route `/dashboard/tools/invoices/:id/receipt/:paymentId`) showing the business name, "Received with thanks", amount, method, date, invoice number, customer name, signature line. Printable via `window.print()`.
- **WhatsApp payment reminder text generator** — button "Generate WhatsApp Reminder" calls Gemini with invoice context (number, customer name, amount due, days overdue, currency, country) and returns a friendly Caribbean-toned reminder message ready to paste into WhatsApp. Has tone options (Friendly / Firm / Trinbagonian dialect / Jamaican dialect). Includes a "Copy" button and a "Open WhatsApp" button that opens `https://wa.me/<customer_phone>?text=<encoded>`.
- **Daily/monthly sales summary** — Reports page `/dashboard/tools/invoices/reports` with:
  - Daily summary card: total invoiced today, total collected today (by method), outstanding today.
  - Monthly summary: invoiced, collected (cash vs bank vs other), outstanding, overdue count, partial count, refunds. Bar chart (reuse a lightweight chart lib or build with divs/SVG).
  - Filters: date range, currency, status. "Export CSV" button per summary.
- **CSV export** — exports invoices (all fields + computed totals) and exports payments (invoice_id, amount, method, date, reference) as CSV. Also a "customer export" CSV. Downloads via a client-side CSV builder (no server needed).

### Status state machine
- `draft` → `sent` (user clicks "Send/Mark as Sent")
- `sent` → `cash_pending` | `bank_transfer_pending` (user picks expected method)
- `cash_pending` → `cash_paid` (full cash payment recorded) | `partial_paid` (partial recorded)
- `bank_transfer_pending` → `bank_transfer_confirmed` (full) | `partial_paid` (partial) | back to `bank_transfer_pending` (still under-confirmed)
- any non-cancelled status → `overdue` (auto-marked when due_date < today and not fully paid) — but keep the prior method status for history
- any status → `cancelled` (user action, with reason)
- `cash_paid` | `bank_transfer_confirmed` → `refunded` (user action, with refund amount + reason)
- `overdue` → `cash_paid` | `bank_transfer_confirmed` | `partial_paid` (payment recorded after overdue)
- Illegal transitions blocked in UI and validated in a helper `canTransition(from, to)`.

## Pages (route paths)

| Route | Purpose | Auth |
|---|---|---|
| `/dashboard/tools/invoices` | Tool landing — invoice list (filter by status/customer/date), stats summary header, "New Invoice" button | Required |
| `/dashboard/tools/invoices/new` | Create invoice form | Required |
| `/dashboard/tools/invoices/:id` | Invoice detail — view/edit invoice, record payments, see payment history, generate WhatsApp reminder, print, receipt links, status transitions | Required |
| `/dashboard/tools/invoices/:id/print` | Print-optimized invoice view | Required |
| `/dashboard/tools/invoices/:id/receipt/:paymentId` | Printable receipt for a specific payment | Required |
| `/dashboard/tools/invoices/reports` | Daily/monthly sales summaries, charts, CSV export | Required |

Note: in HashRouter, the `:id` routes must be ordered so static segments (`new`, `reports`) match before the dynamic `:id`. Put `new` and `reports` routes above `:id` in the route table to avoid `:id` swallowing "new"/"reports" as an id.

## AI Outputs (what the AI generates)

This tool has exactly one AI feature: **WhatsApp payment reminder text generation**. Single Gemini call returns:

```json
{
  "reminder_messages": [
    { "tone": "friendly", "text": "Hi <Customer Name>, just a gentle reminder that invoice <INV-...> for <amount> is due on <date>. Let us know if you need more time. Thanks!" },
    { "tone": "firm", "text": "..." },
    { "tone": "trinbagonian_dialect", "text": "..." },
    { "tone": "jamaican_dialect", "text": "..." }
  ]
}
```

Returns 4 tones. User picks one to copy/open in WhatsApp. Prompt includes: business name, customer name, invoice number, amount due (with currency), issue/due dates, days overdue (computed), country (for dialect), and any partial payment history. Strict instruction: keep it under 300 chars, no aggressive threats, Caribbean-friendly, end with a clear next step (pay via cash/bank transfer / reply to confirm / call us).

Use `gemini-2.0-flash` with `responseMimeType: 'application/json'`. Strip fences, robust parse; on failure show toast, do not crash, allow manual text entry as fallback.

## Supabase Tables (SQL)

Migration `supabase/migrations/0004_invoices.sql`:

```sql
-- Customers (reusable across invoices)
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text,                       -- WhatsApp preferred, E.164
  email text,
  address text,
  customer_type text not null default 'individual',  -- individual | business
  tax_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_user_idx on public.customers(user_id);

-- Invoices
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  invoice_number text not null,
  issue_date date not null default current_date,
  due_date date not null,
  currency text not null default 'TTD',      -- TTD | JMD | BBD | USD | GYD
  status text not null default 'draft',       -- draft | sent | cash_pending | cash_paid | bank_transfer_pending | bank_transfer_confirmed | partial_paid | overdue | cancelled | refunded
  subtotal_cents bigint not null default 0,
  discount_total_cents bigint not null default 0,
  tax_total_cents bigint not null default 0,
  grand_total_cents bigint not null default 0,
  amount_paid_cents bigint not null default 0,
  amount_due_cents bigint not null default 0,
  notes text,
  terms text,
  expected_payment_method text,               -- cash | bank_transfer | other (when transitioning to *_pending)
  cancel_reason text,
  refund_amount_cents bigint not null default 0,
  refund_reason text,
  overdue_marked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, invoice_number)
);

create index if not exists invoices_user_idx on public.invoices(user_id);
create index if not exists invoices_status_idx on public.invoices(status);
create index if not exists invoices_customer_idx on public.invoices(customer_id);
create index if not exists invoices_issue_date_idx on public.invoices(issue_date);
create index if not exists invoices_due_date_idx on public.invoices(due_date);

-- Invoice items (line items)
create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  qty numeric(12,3) not null default 1,
  unit_price_cents bigint not null default 0,
  discount_type text not null default 'flat',   -- flat | percent
  discount_value_cents bigint not null default 0,   -- if percent, store as basis points (e.g. 10% = 1000) in a separate column? Keep simple: store discount_cents as flat amount, and discount_percent numeric separately
  discount_percent numeric(5,2) not null default 0,
  tax_percent numeric(5,2) not null default 0,
  line_subtotal_cents bigint not null default 0,   -- qty*unit_price - discount + tax, precomputed for speed
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Cleaner: replace discount columns with a single discount JSONB if you prefer. Above is explicit and typed.

create index if not exists invoice_items_invoice_idx on public.invoice_items(invoice_id);

-- Payments (one invoice has many payments — supports partial, multiple methods)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_cents bigint not null default 0,
  method text not null,                       -- cash | bank_transfer | other
  payment_date date not null default current_date,
  reference text,                              -- bank transfer ref / check number / etc
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists payments_invoice_idx on public.payments(invoice_id);
create index if not exists payments_user_idx on public.payments(user_id);
create index if not exists payments_date_idx on public.payments(payment_date);

-- Payment screenshots (proof of payment — Caribbean businesses commonly WhatsApp a screenshot of the bank transfer)
create table if not exists public.payment_screenshots (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,                 -- e.g. payment-screenshots/<invoice_id>/<payment_id>/<uuid>.png
  file_name text,
  mime_type text,
  file_size_bytes bigint,
  uploaded_at timestamptz not null default now()
);

create index if not exists payment_screenshots_payment_idx on public.payment_screenshots(payment_id);

-- Storage bucket
insert into storage.buckets (id, name, public) values ('payment-screenshots', 'payment-screenshots', false)
  on conflict (id) do nothing;  -- PRIVATE: only owner reads via signed URL

-- RLS
alter table public.customers enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.payment_screenshots enable row level security;

create policy "owner crud customers" on public.customers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner crud invoices" on public.invoices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner crud items" on public.invoice_items
  for all using (
    exists (select 1 from public.invoices i where i.id = invoice_id and i.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.invoices i where i.id = invoice_id and i.user_id = auth.uid())
  );
create policy "owner crud payments" on public.payments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner crud screenshots" on public.payment_screenshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage policies — private bucket, owner-only read/write, public read disabled
create policy "owner upload payment screenshots" on storage.objects for insert
  with check (bucket_id = 'payment-screenshots' and auth.uid() is not null);
create policy "owner read own screenshots" on storage.objects for select
  using (bucket_id = 'payment-screenshots' and auth.uid() = owner);
create policy "owner delete own screenshots" on storage.objects for delete
  using (bucket_id = 'payment-screenshots' and auth.uid() = owner);
```

All money is stored as integer cents to avoid float errors. Currency display formats by currency code (use `Intl.NumberFormat` with the right locale, e.g. `en-TT` for TTD, `en-JM` for JMD, `en-BB` for BBD).

## Digital Download Version

**Product:** Cash/COD Invoice + Receipt System — **$29 USD**

A downloadable self-hosted version for businesses that want to run invoices offline or on their own system without a TriniBuild account. After purchase:

- A zipped bundle containing:
  - `invoice-system.html` — a single-file static HTML invoice + receipt generator (runs offline, opens in any browser). Includes: customer form, line items, totals, status dropdown (all 10 statuses), payment recording, receipt view, print buttons, CSV export of invoices and payments, all client-side with `localStorage` persistence. Tailwind via CDN. QR code via a CDN'd qrcode lib. No backend needed.
  - `invoice-template.html` — a printable A4 invoice template (fill-in-the-blank fields, then print)
  - `receipt-template.html` — a printable A4 receipt template
  - `whatsapp-reminder-templates.txt` — 12 pre-written Caribbean-toned WhatsApp payment reminder templates across 4 tones and 3 urgency levels, ready to copy
  - `csv-sample-invoices.csv` and `csv-sample-payments.csv` — sample import formats
  - `README.txt` — how to use the offline HTML tool, how to import CSVs, how to print to PDF
- Generation flow: pre-bake the static HTML and templates at build time (they don't need AI per purchase) → on purchase, just upload the prebuilt zip to `digital-downloads` bucket under `invoice-system/<purchase_id>.zip`, return signed URL valid 7 days, record in `digital_purchases` (product_slug='invoice-cod-system', amount_cents=2900). Email link + dashboard download button.
- 7-day re-download; after that re-purchase required.

## Codex Prompt

```
You are building Week 4 of the TriniBuild AI Services Marketplace: an Invoice + Cash/COD Tracker.

Project root: C:\Users\Banjo\OneDrive\Documents\Trinibuild\
Stack: React 18 + Vite + TypeScript + Tailwind + Supabase (Postgres + Storage + RLS) + Google Gemini (gemini-2.0-flash). HashRouter in src/App.tsx. supabaseClient at src/services/supabaseClient.ts. authService at src/services/authService.ts. geminiService.ts exists from Weeks 2-3 — extend it.

Do the following, in order:

1. Create migration `supabase/migrations/0004_invoices.sql` with the SQL from this spec's "Supabase Tables" section (customers, invoices, invoice_items, payments, payment_screenshots, private payment-screenshots bucket, all RLS policies). Money is integer cents everywhere. Run it; confirm tables exist.

2. Extend src/services/geminiService.ts with `generateWhatsAppReminders(input: ReminderInput): Promise<ReminderOutput>` that:
   - Builds the prompt with business name, customer name, invoice number, amount due (+currency), issue/due dates, days overdue, country, partial payment history.
   - Calls gemini-2.0-flash with responseMimeType: 'application/json' and the schema in "AI Outputs" (4 tones: friendly, firm, trinbagonian_dialect, jamaican_dialect).
   - Strips fences, robust parse; on failure shows toast and exposes a manual textarea fallback — never crashes.
   - Hard instruction: each message <= 300 chars, Caribbean-friendly, clear next step, no threats.

3. Create src/types/invoices.ts with Customer, Invoice, InvoiceItem, Payment, PaymentScreenshot, InvoiceStatus enum (10 values), CurrencyCode enum (TTD | JMD | BBD | USD | GYD), PaymentMethod enum, LineDiscountType enum. Also a `canTransition(from, to)` function enforcing the state machine in this spec.

4. Create a money helper src/utils/money.ts: centsToFormatted(cents, currency) using Intl.NumberFormat with the right locale; parseCurrencyInput to cents; arithmetic in cents only.

5. Build pages under `src/pages/dashboard/tools/invoices/`:
   - `InvoicesHome.tsx` — list with filters (status, customer, date range, currency), summary header (totals invoiced / collected / outstanding for current filter), "New Invoice" button, row click → detail.
   - `NewInvoice.tsx` — the create form. Customer selector + inline "add new customer" modal. Line items table with add/remove/reorder/duplicate, per-line discount (flat/percent toggle) and tax%. Live totals panel. Save as draft or Save & Send (sets status=sent). Auto-generate invoice number `INV-YYYYMM-NNNN` (query the user's max sequence for the month and increment).
   - `InvoiceDetail.tsx` — view/edit invoice, status badge with transition buttons (only valid transitions enabled via canTransition). "Record Payment" panel: amount, method, date, reference, notes, screenshot upload (multi-file allowed). Payment history table with "View Receipt" per payment and "View Screenshot" (signed URL). "Generate WhatsApp Reminder" button → modal showing 4 tones, each with Copy and "Open WhatsApp" (opens https://wa.me/<phone>?text=<encoded>). "Print Invoice" button.
   - `PrintInvoice.tsx` at route `/dashboard/tools/invoices/:id/print` — A4-optimized printable view; calls window.print() on mount with a small "Print" button; @media print stylesheet.
   - `Receipt.tsx` at route `/dashboard/tools/invoices/:id/receipt/:paymentId` — printable receipt ("Received with thanks", amount, method, date, invoice #, customer, signature line); window.print().
   - `Reports.tsx` at route `/dashboard/tools/invoices/reports` — daily summary card, monthly summary card, bar chart of collected by method (cash/bank/other) over the selected range, overdue count, partial count, refunds. Date range + currency + status filters. "Export CSV" for invoices, payments, and customers.

6. Wire routes in src/App.tsx (HashRouter). CRITICAL: put `new` and `reports` routes ABOVE the `:id` route so `:id` doesn't swallow them. Order:
   - /dashboard/tools/invoices → InvoicesHome (protected)
   - /dashboard/tools/invoices/new → NewInvoice (protected)
   - /dashboard/tools/invoices/reports → Reports (protected)
   - /dashboard/tools/invoices/:id → InvoiceDetail (protected)
   - /dashboard/tools/invoices/:id/print → PrintInvoice (protected)
   - /dashboard/tools/invoices/:id/receipt/:paymentId → Receipt (protected)

7. Screenshot upload: dropzone on the Record Payment panel, accept jpg/png/webp/pdf <= 5MB. Upload to private bucket `payment-screenshots` under `<invoice_id>/<payment_id>/<uuid>.<ext>`. Insert payment_screenshots row. "View Screenshot" opens the image in a lightbox using a signed URL from supabase.storage.from('payment-screenshots').createSignedUrl(path, 3600).

8. Status auto-marking: a cron-free approach — when InvoicesHome or InvoiceDetail loads, run a client-side check: any invoice with status in (sent, cash_pending, bank_transfer_pending, partial_paid) and due_date < today and amount_due_cents > 0 → update status to overdue (and set overdue_marked_at = now()). Wrap in a try/catch; this is best-effort. Also expose a manual "Mark as Overdue" action.

9. CSV export: client-side. Build CSV strings with proper quoting (escape quotes, commas, newlines), download via Blob + URL.createObjectURL. Three exports: invoices, payments, customers.

10. Digital download flow behind VITE_FEATURE_DIGITAL_DOWNLOADS=true:
    - "Buy Cash/COD Invoice System ($29)" button on InvoicesHome opens a confirm modal.
    - On confirm, upload the prebuilt zip (it should be committed under `src/digital-downloads-assets/invoice-cod-system.zip` at build time) to the digital-downloads bucket under `invoice-system/<purchase_id>.zip`, write a digital_purchases row (product_slug='invoice-cod-system', amount_cents=2900), return a 7-day signed URL, show download button + email link (stub email with TODO if no email service).
    - Payment MVP: "I've paid — confirm" flips paid=true; stripe_payment_intent_id column stubbed.

11. Use only Tailwind utilities. Mobile-first. Reuse lucide-react icons. Add `qrcode` npm package for the optional invoice QR (encoding the invoice URL).

12. Do not break Weeks 1-3 routes. Run `npm run build` and `npx tsc --noEmit`; fix all errors. Manually verify: create a customer, create a 3-line-item invoice with discount + tax, save as draft, mark sent, mark cash_pending, record a partial cash payment (with screenshot) → status partial_paid, record the remainder → status cash_paid, generate a WhatsApp reminder, open WhatsApp link, print the invoice, view the receipt, visit /reports and check the monthly summary, export CSVs.

Stop and report: files created, migration result, build result, errors you couldn't resolve.
```

## Acceptance Criteria

- [ ] A user can add a customer (with WhatsApp phone) and reuse them across invoices.
- [ ] A user can create an invoice with ≥ 1 line item; per-line discount (flat or %) and tax % compute correctly; grand total is correct to the cent.
- [ ] Invoice number auto-generates as `INV-YYYYMM-NNNN` and increments per user per month; manual override allowed; uniqueness enforced.
- [ ] All 10 statuses are present; transitions follow the state machine; invalid transitions are disabled in UI and rejected by `canTransition`.
- [ ] Invoices past due_date with amount due > 0 are auto-marked overdue on next page load; the prior method status is preserved in history.
- [ ] A user can record multiple payments against one invoice (partial → full); sum of payments vs grand total drives status correctly.
- [ ] Payment screenshots upload to the private `payment-screenshots` bucket; only the owner can view via signed URL; anonymous/public read is blocked (verify RLS).
- [ ] "Generate WhatsApp Reminder" returns 4 tones; each <= 300 chars; "Copy" and "Open WhatsApp" buttons work; `https://wa.me/<phone>?text=<encoded>` opens correctly.
- [ ] Print invoice produces a clean A4 layout via `window.print()`; @media print hides nav/sidebar.
- [ ] Receipt view for a specific payment shows "Received with thanks", amount, method, date, invoice #, customer, signature line; printable.
- [ ] Reports page shows daily and monthly summaries; bar chart of collected by method; filters work; CSV exports of invoices, payments, and customers download and open correctly in Excel/Google Sheets.
- [ ] Money is handled as integer cents everywhere; no float arithmetic; display uses `Intl.NumberFormat` with correct locale per currency.
- [ ] RLS: user A cannot read/edit user B's customers, invoices, items, payments, or screenshots.
- [ ] Route ordering: `/invoices/new` and `/invoices/reports` resolve correctly, not as `:id` = "new"/"reports".
- [ ] Digital download (when flag on) serves the prebuilt zip with a 7-day signed URL and records the purchase.
- [ ] `npm run build` and `npx tsc --noEmit` pass with zero errors.
- [ ] No existing Week 1–3 routes are broken.
