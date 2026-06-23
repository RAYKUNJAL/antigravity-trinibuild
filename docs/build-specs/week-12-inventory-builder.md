# Week 12 Build Spec — Inventory + Price List Builder

## Goal

Build an inventory and price list tool for the TriniBuild AI Services Marketplace that lets a small Caribbean business (retailer, wholesaler, manufacturer, tradesperson) manage a product catalog, track stock, compute profit margins, surface low-stock warnings, publish a public price list / catalog page with a WhatsApp inquiry button, and import/export the whole catalog as CSV. A Gemini-backed AI generator drafts product descriptions from bare facts (name, category, cost, price) so a non-writer owner can still have decent copy on their public catalog.

This is the simplest of the three week-10-to-12 tools by surface area, but the CSV import and low-stock report are the features that make it actually useful vs. a spreadsheet.

## Features

1. **Product creation** — a dashboard form capturing: product name, category (from a managed list), cost price (TTD, what the owner paid), selling price (TTD), stock quantity (integer), low stock threshold (integer; below this the product is flagged), photo URL, and description. A "Generate description" button calls Gemini with name+category+cost+price and returns 2–3 sentences of sales copy the owner can edit.
2. **Profit margin calculator** — live in the form: as cost and selling price are entered, show `profit_per_unit = selling - cost`, `margin_percent = (selling - cost) / selling * 100` rounded to 1 decimal, and a simple verdict: margin ≥ 30% green, 15–30% blue, < 15% red with "Low margin" text. No backend call; pure client math.
3. **Stock status labels** — every product shows a status chip computed from `stock_quantity` vs `low_stock_threshold`: `In stock` (green, stock > threshold), `Low stock` (amber, 0 < stock ≤ threshold), `Out of stock` (red, stock = 0).
4. **Low stock report** — a dashboard view at `/dashboard/tools/inventory/reports` that lists all products where `stock_quantity <= low_stock_threshold`, sorted by stock ascending. Columns: name, category, stock, threshold, status, suggested reorder qty (default: `max(threshold * 3, 10) - stock`). A "Export low stock CSV" button.
5. **Public catalog / price list page** — at `/catalog/:businessSlug`, a public page showing the business's published products as a grid/list with photo, name, description, selling price, and a per-product "Ask on WhatsApp" button. The business slug is derived from the owner's profile (a `business_profiles` row or a simple slug field on the owner's settings — use whatever exists; if nothing exists, add a `business_slug` column on `auth.users` metadata or a tiny `business_profiles` table). Out-of-stock products show "Out of stock" instead of a price and no WhatsApp button.
6. **WhatsApp product inquiry button** — each product card on the public catalog has a "Ask on WhatsApp" button that opens `https://wa.me/{business_phone}?text=Hi, I'm interested in {product name} (TT${price}). Is it available?` The business phone comes from the owner's profile. The message is pre-filled but editable by the customer before sending.
7. **CSV import/export** — the product list page has "Export CSV" (downloads all products with all fields) and "Import CSV" (uploads a file; client parses with PapaParse, validates headers, upserts each row via Supabase). Required headers: `name, category, cost_cents, selling_price_cents, stock_quantity, low_stock_threshold, photo_url, description`. Unknown columns are ignored. A dry-run preview shows the first 10 rows and a count of "new vs update" before the owner commits the import.
8. **AI product description generator** — per product, a button that calls Gemini with `{name, category, cost_cents, selling_price_cents}` and returns `{ description: string }` of 2–3 sentences, sales-tone, no hype beyond a single mild adjective, ending with a use-case suggestion. Owner edits before save.

## Pages (route paths)

All routes use the existing `HashRouter` in `App.tsx`.

| Route | Auth | Purpose |
|-------|------|---------|
| `/dashboard/tools/inventory` | owner | product list table + "Add product" + Export/Import CSV buttons |
| `/dashboard/tools/inventory/products` | owner | product creation/edit form (inline or modal; via `?id=...` to edit) |
| `/dashboard/tools/inventory/reports` | owner | low stock report + export |
| `/catalog/:businessSlug` | public | public catalog / price list with WhatsApp inquiry buttons |

Note: `/dashboard/tools/inventory/products` handles both create and edit (use `?id=...` or a nested `/:productId` route to edit). A single page with a list on top and an edit drawer/modal below, or a separate edit route, is fine — pick one and document it.

## AI Outputs (what the AI generates)

One Gemini call:

- **Product description** — `generateProductDescription(product)` returns `{ description: string }`, 2–3 sentences, sales-tone, Caribbean-flavored where natural (mention local use cases, e.g. "Great for a cookshop, a parlor, or a hardware counter"), no more than one mild adjective per sentence, ends with a use-case suggestion. Use `temperature: 0.6` (slightly lower than the other tools — product copy should be stable and repeatable-ish). Prompt must include product name, category, cost (as TTD), and selling price (as TTD), and instruct: "Return JSON only with key `description`. No markdown fences."

No other AI calls in this tool. The margin calculator and stock labels are pure client math.

## Supabase Tables (SQL)

```sql
-- Product categories (managed list per business)
create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (owner_id, name)
);

-- Products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category_id uuid references public.product_categories(id) on delete set null,
  category_name text,  -- denormalized snapshot for fast public listing; kept in sync by trigger
  cost_cents int not null default 0 check (cost_cents >= 0),
  selling_price_cents int not null check (selling_price_cents >= 0),
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  low_stock_threshold int not null default 5 check (low_stock_threshold >= 0),
  photo_url text,
  description text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Stock movements (audit log; every stock change inserts a row)
create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  change int not null,  -- +qty received, -qty sold/lost
  reason text not null check (reason in ('received','sale','adjustment','import','damage','return')),
  note text,
  resulting_stock int not null,  -- snapshot of products.stock_quantity after the change
  created_at timestamptz not null default now()
);

-- Business profile (slug + phone for the public catalog)
create table public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  business_name text not null,
  business_slug text not null unique,
  business_phone text not null,  -- E.164
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.product_categories enable row level security;
create policy "categories owner rw" on public.product_categories for all using (owner_id = auth.uid());
alter table public.products enable row level security;
create policy "products owner rw" on public.products for all using (owner_id = auth.uid());
-- public can read published products for a given business slug
create policy "products public read" on public.products for select
  using (status = 'published' and exists (
    select 1 from public.business_profiles bp where bp.owner_id = products.owner_id
  ));
alter table public.stock_movements enable row level security;
create policy "movements owner rw" on public.stock_movements for all using (owner_id = auth.uid());
alter table public.business_profiles enable row level security;
create policy "profile owner rw" on public.business_profiles for all using (owner_id = auth.uid());
create policy "profile public read" on public.business_profiles for select using (true);

-- A public view to fetch a business's catalog by slug without exposing owner_id
create view public.public_catalog as
  select p.id, p.name, p.category_name, p.selling_price_cents, p.stock_quantity,
         p.low_stock_threshold, p.photo_url, p.description,
         bp.business_slug, bp.business_name, bp.business_phone,
         (p.stock_quantity = 0) as out_of_stock,
         (p.stock_quantity > 0 and p.stock_quantity <= p.low_stock_threshold) as low_stock
  from public.products p
  join public.business_profiles bp on bp.owner_id = p.owner_id
  where p.status = 'published';

-- Trigger: on product insert/update, set category_name from product_categories.name
create or replace function public.fn_sync_category_name()
returns trigger language plpgsql as $$
begin
  if new.category_id is not null then
    new.category_name := (select name from public.product_categories where id = new.category_id);
  end if;
  return new;
end;$$;
create trigger trg_sync_category_name
  before insert or update on public.products
  for each row execute function public.fn_sync_category_name();

-- Trigger: on product stock update, insert a stock_movement row
create or replace function public.fn_log_stock_movement()
returns trigger language plpgsql as $$
begin
  if (new.stock_quantity is distinct from old.stock_quantity) or
     (new.stock_quantity is distinct from null and tg_op = 'INSERT') then
    insert into public.stock_movements (product_id, owner_id, change, reason, resulting_stock)
    values (new.id, new.owner_id,
            case when tg_op='INSERT' then new.stock_quantity
                 else new.stock_quantity - coalesce(old.stock_quantity,0) end,
            case when tg_op='INSERT' then 'import' else 'adjustment' end,
            new.stock_quantity);
  end if;
  return new;
end;$$;
create trigger trg_log_stock_movement
  after insert or update of stock_quantity on public.products
  for each row execute function public.fn_log_stock_movement();
```

Notes:
- All money is stored in integer cents to avoid float drift. Display divides by 100 with 2 decimals and a "TT$" prefix.
- The public catalog view `public_catalog` is the only surface the public page queries; it hides `owner_id`, `cost_cents`, and `low_stock_threshold` from the public. The WhatsApp button needs `business_phone` (exposed via the view) — that's intentional.
- `business_profiles.business_slug` is what the public route `/catalog/:businessSlug` matches. If the owner has no profile row, the public page 404s with a friendly "No catalog found" message.

## Digital Download Version

**Small Business Inventory + Price List Kit — $29 USD**

A zip sold via the existing marketplace checkout, containing standalone reusable assets for any small Caribbean business, independent of the TriniBuild platform:

- `product-description-prompt.md` — the exact Gemini prompt for product descriptions.
- `price-list-template.html` — a standalone printable price list template (open in browser, print to PDF).
- `low-stock-report-template.html` — a standalone printable low stock report template.
- `csv-import-template.csv` — the exact CSV headers and one example row, for a business to fill.
- `whatsapp-inquiry-message-templates.txt` — 5 templated WhatsApp inquiry messages for different product types.
- `margin-calculator-guide.md` — a 1-page explainer on how to compute margin % and what target to aim for by category.
- `readme.md` — how to use each asset.

The build does not implement the checkout — only the kit contents.

## Codex Prompt (detailed prompt for the Codex CLI agent)

```
You are implementing Week 12 of the TriniBuild AI Services Marketplace: an Inventory + Price List Builder.

Repo: C:\Users\Banjo\OneDrive\Documents\Trinibuild\
Stack: React + Vite + TypeScript + Tailwind + Supabase + Google Gemini. HashRouter already in App.tsx. Supabase client at services/supabaseClient.ts (named export `supabase`). Auth at services/authService.ts (`getCurrentUser()` → `{id}` or null). Gemini at services/geminiService.ts (`gemini.generateJSON(prompt, schema)` → parsed object).

DO NOT rewrite App.tsx; only add the routes below. DO NOT change supabase/auth signatures.

DO:
1. Run the SQL in "Supabase Tables" against the project's Supabase instance, including both triggers and the public_catalog view. If public.business_profiles does not yet exist in the project, create it as shown — it's new this week.
2. Add routes (lazy-loaded):
   /dashboard/tools/inventory (product list table + Add product + Export CSV + Import CSV buttons)
   /dashboard/tools/inventory/products (create + edit via ?id= or nested /:productId)
   /dashboard/tools/inventory/reports (low stock report + Export low stock CSV)
   /catalog/:businessSlug (public)
3. Create src/features/inventory/ with:
   pages/InventoryListPage.tsx
   pages/ProductFormPage.tsx
   pages/LowStockReportPage.tsx
   pages/PublicCatalogPage.tsx
   components/MarginCalculator.tsx (live cost/price → profit + margin% + verdict)
   components/StockStatusBadge.tsx (In stock / Low stock / Out of stock)
   components/CsvImportDialog.tsx (uses PapaParse; dry-run preview first 10 rows + counts; commit button)
   components/WhatsAppInquiryButton.tsx
4. services/productService.ts: createProduct, getProduct, updateProduct, deleteProduct (soft: status→archived), listMyProducts, listLowStock (stock <= threshold, ordered by stock asc), upsertFromCsv (batch upsert; use supabase .upsert on an array, handling category_name resolution via a lookup map the client builds first). Publish/archive toggle.
5. services/categoryService.ts: listMyCategories, createCategory, renameCategory, deleteCategory (if no products reference it).
6. services/businessProfileService.ts: getMyProfile, upsertMyProfile (creates/updates business_profiles row; slug must be URL-safe and unique; phone normalized to E.164 in utils/phone.ts).
7. services/geminiProductService.ts: generateProductDescription(product) → calls gemini.generateJSON with the prompt in the spec; returns { description }.
8. utils/csv.ts: exportProducts(products) builds the CSV string and triggers a download; parseCsv(file) uses PapaParse to return rows. Map headers strictly; reject rows missing required columns with a per-row error shown in the import preview.
9. utils/phone.ts: normalizeToE164(phone, defaultCountry='TT') → +1XXXXXXXXXX. Used by the WhatsApp button.
10. UI: Tailwind, match dashboard shell. Product list table columns: name, category, cost (TT$), price (TT$), stock, threshold, status badge, margin%, actions (edit, publish/archive). Low stock report: same columns + suggested reorder. Public catalog: grid of product cards, photo on top, name, description, price, "Ask on WhatsApp" button; out-of-stock cards show "Out of stock" and no button. Sticky "WhatsApp the owner" floating button on the public page using business_phone.

Money display: a util utils/money.ts formatCents(cents) → "TT$123.45". Use it everywhere; never display raw cents.

Acceptance criteria below must all pass. Commit "Week 12: inventory + price list builder" on branch week-12-inventory. Push.
```

## Acceptance Criteria

1. A logged-in owner can create a product at `/dashboard/tools/inventory/products`, entering name, category (from a managed list they can add to), cost, selling price, stock, low stock threshold, photo URL, and description. The margin calculator updates live as cost/price change and shows the correct verdict color.
2. The "Generate description" button returns 2–3 sentences of sales copy the owner can edit before saving. Regenerate produces different text.
3. The product list at `/dashboard/tools/inventory` shows all the owner's products with correct stock status badges and margin%. The owner can publish a product (status → `published`), archive it (→ `archived`), or edit it.
4. A published product appears on the public catalog at `/catalog/:businessSlug` only if the owner has a `business_profiles` row with that slug. The card shows photo, name, description, price, and a "Ask on WhatsApp" button that opens `https://wa.me/{normalized_business_phone}?text={encoded_message}` with the product name and price in the message.
5. An out-of-stock product shows "Out of stock" on the public catalog and no WhatsApp button. A low-stock product still shows its price and WhatsApp button (low stock is an internal concern, not a public one).
6. The low stock report at `/dashboard/tools/inventory/reports` lists every product where `stock_quantity <= low_stock_threshold`, ordered by stock ascending, with a suggested reorder qty. "Export low stock CSV" downloads that subset.
7. "Export CSV" on the product list downloads all products with the required headers. "Import CSV" opens a dialog, parses the file with PapaParse, shows a dry-run preview of the first 10 rows and a "N new, M update" count, and on commit upserts all rows. A row missing required columns is shown as an error in the preview and is skipped on commit.
8. Changing a product's `stock_quantity` (via edit or CSV import) inserts a `stock_movements` row with the correct `change`, `reason`, and `resulting_stock` snapshot. The trigger fires on both insert and update.
9. The `public_catalog` view is the only query the public catalog page runs; it does not expose `owner_id`, `cost_cents`, or `low_stock_threshold` to the public. A visitor cannot read another business's products or any owner's full `products` row.
10. RLS: an owner cannot read another owner's products, categories, stock movements, or business profile. A public visitor can read `business_profiles` and the `public_catalog` view only.
11. Money is always displayed via `formatCents` as "TT$X.YY"; at no point in the UI are raw cents shown to a human.
