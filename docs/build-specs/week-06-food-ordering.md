# Week 6 Build Spec — Food Vendor Menu + Ordering System

## Goal

Build a complete menu builder and ordering system that lets Trinidad & Tobago food vendors (doubles, roti, bake & shark, home cooks, etc.) create a digital menu, generate AI-written descriptions, publish a public menu page with a WhatsApp ordering button, and manage incoming orders from a dashboard. The public menu must be shareable via a simple link and pre-fill a WhatsApp message with the customer's selected items, quantities, and pickup/delivery preference. Vendors manage order status through a Kanban-style pipeline with COD/cash confirmation.

## Features

### Vendor (authenticated) side
- **Menu builder with categories** — create categories (e.g. "Breakfast", "Lunch Specials", "Drinks", "Sides") and reorder them. Each category has a name, optional icon/emoji, and a display order.
- **Add / edit menu item** with fields:
  - Name
  - Price (TTD)
  - Photo (upload to Supabase Storage)
  - Description
  - Ingredients (comma or newline separated)
  - Availability toggle (in stock / sold out)
  - Fulfillment options (pickup, delivery, both)
  - Prep time (minutes)
- **AI menu description generator** — send the item name + ingredients + vendor context to Gemini, receive a polished, mouth-watering description in Trinidadian-friendly English. One-click apply.
- **Daily special generator** — AI suggests a "Daily Special" combo (item + price + promo blurb) based on the current menu, weekday, and optionally a promo theme. Vendor can publish it to the public menu banner.
- **Orders dashboard** with statuses: `new`, `confirmed`, `preparing`, `ready`, `completed`, `cancelled`. Drag-to-update or button-to-advance. Shows customer name, phone, items, total, fulfillment type, notes, and timestamp.
- **COD / cash confirmation** — orders default to "cash on delivery/pickup". Vendor confirms receipt of cash when marking `completed`, recording the amount collected.
- **Public menu link** — `/menu/:businessSlug` — shareable, no login required.

### Customer (public) side
- **Public menu page** at `/menu/:businessSlug` — shows vendor branding, categories, items with photos/prices, sold-out badges, daily special banner.
- **Customer order form** — add items to a cart with quantity selectors, enter name + phone number, choose pickup or delivery (if offered), add notes, see running total.
- **WhatsApp order button** — on submit, builds a pre-formatted WhatsApp message (`https://wa.me/<vendorPhone>?text=<encoded order>`) containing: vendor name, each item + qty + line total, order total, customer name, phone, fulfillment type, notes, and a timestamp. Opens WhatsApp with the message pre-filled. Also saves the order to Supabase so the vendor sees it in the dashboard.
- No payment gateway — cash on delivery/pickup only at this stage.

## Pages (route paths)

| Route | Auth | Purpose |
|---|---|---|
| `/dashboard/tools/food-ordering` | vendor | Landing/overview for the food ordering tool — stats, quick links, recent orders |
| `/dashboard/tools/food-ordering/menu` | vendor | Menu builder — manage categories and items |
| `/dashboard/tools/food-ordering/orders` | vendor | Orders dashboard — pipeline of orders by status |
| `/menu/:businessSlug` | public | Customer-facing menu + order form + WhatsApp checkout |

All dashboard routes are nested under the existing `HashRouter` layout and require the existing `authService` session. Public route is standalone (no auth).

## AI Outputs (what the AI generates)

All AI calls go through a thin `services/geminiService.ts` wrapper around Google Gemini.

1. **Menu item description** — Input: item name, ingredients, price, vendor cuisine type. Output: 1–3 sentence appetizing description, Trinidadian-friendly tone, under 200 chars. Vendor approves before save.
2. **Daily special** — Input: full menu (names + prices), weekday, optional theme. Output: `{ specialName, includedItems, suggestedPrice, promoBlurb }` JSON. Promo blurb is 1–2 sentences, social-shareable.

## Supabase Tables (SQL)

```sql
-- Vendor menus (one per business profile)
create table public.menus (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.profiles(id) on delete cascade,
  business_slug text not null unique,
  vendor_phone text,
  currency text not null default 'TTD',
  daily_special jsonb,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Menu categories
create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.menus(id) on delete cascade,
  name text not null,
  icon text,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Individual menu items
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.menu_categories(id) on delete cascade,
  menu_id uuid not null references public.menus(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null,
  photo_url text,
  description text,
  ingredients text,
  is_available boolean not null default true,
  supports_pickup boolean not null default true,
  supports_delivery boolean not null default false,
  prep_time_minutes int default 15,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Customer orders
create table public.food_orders (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.menus(id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  fulfillment text not null check (fulfillment in ('pickup','delivery')),
  notes text,
  status text not null default 'new' check (status in ('new','confirmed','preparing','ready','completed','cancelled')),
  total numeric(10,2) not null default 0,
  cash_collected numeric(10,2),
  whatsapp_sent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Line items per order
create table public.food_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.food_orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  item_name text not null,
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  line_total numeric(10,2) not null
);

-- RLS: vendors can CRUD their own menu (matched by business_id = auth.uid());
-- public can SELECT published menus and INSERT orders for published menus.
-- See project RLS pattern in existing tables.
```

Enable Row Level Security on all tables. Policy pattern:
- `menus`: vendor `select/insert/update/delete` where `business_id = auth.uid()`; public `select` where `is_published = true`.
- `menu_categories`, `menu_items`: vendor access via join to `menus.business_id`; public `select` via published parent menu.
- `food_orders`: public `insert` (for published menus), vendor `select/update` via `menu.business_id`; no public `select`.
- `food_order_items`: cascaded access through parent order.

## Digital Download Version

**Product:** Food Vendor WhatsApp Ordering Kit
**Price:** $39 USD
**Deliverables (zip):**
- Printable "Order on WhatsApp" QR table tent / counter card (PDF, Canva-editable template)
- WhatsApp order message template (copy-paste, with placeholders)
- Menu item description prompt library (10 prompts tuned for T&T cuisine)
- Daily special social post templates (7 days)
- Setup guide PDF: "From kitchen to online orders in 30 minutes"
- Cash handling log sheet (printable PDF)
- Sold-out sign printables

Listed in the existing marketplace `/downloads` flow; purchase triggers a signed download link valid 72 hours.

## Codex Prompt (detailed prompt for the Codex CLI agent)

```
You are building the "Food Vendor Menu + Ordering System" feature for the TriniBuild AI Services Marketplace (React + Vite + TypeScript + Tailwind + Supabase + Google Gemini).

Existing code to reuse:
- Supabase client at services/supabaseClient.ts
- Auth service at services/authService.ts (returns current user profile with .id and .business_slug)
- HashRouter routing in App.tsx — add nested routes under /dashboard/tools/food-ordering and a public route /menu/:businessSlug
- Gemini wrapper at services/geminiService.ts (extend it; do not recreate the client)

Tasks:
1. Run the SQL in the build spec to create tables: menus, menu_categories, menu_items, food_orders, food_order_items. Apply RLS per the spec.
2. Create services/foodService.ts with typed functions: getMenuBySlug, getMenuForVendor, upsertMenu, addCategory, updateCategory, deleteCategory, addMenuItem, updateMenuItem, deleteMenuItem, toggleAvailability, generateDailySpecial (calls Gemini), createOrder, getOrdersForVendor, updateOrderStatus, confirmCashCollected.
3. Create services/foodAiService.ts: generateItemDescription(item, vendorContext) and generateDailySpecial(menu, weekday, theme). Use Gemini, return typed JSON, guard with try/catch and a user-friendly toast on failure.
4. Build pages:
   - pages/tools/FoodOrderingOverview.tsx (route /dashboard/tools/food-ordering) — stats cards (items count, today's orders, new orders), recent orders list, CTA buttons.
   - pages/tools/MenuBuilder.tsx (route /dashboard/tools/food-ordering/menu) — category list with drag reorder, item editor modal/drawer with all fields, "Generate Description" button calling Gemini, photo upload to Supabase Storage bucket 'menu-photos', availability toggle, daily special generator panel.
   - pages/tools/OrdersDashboard.tsx (route /dashboard/tools/food-ordering/orders) — Kanban columns for the 6 statuses, order cards with item summary + total + customer + fulfillment, advance/cancel buttons, cash confirmation modal on completion.
   - pages/public/PublicMenu.tsx (route /menu/:businessSlug) — fetch menu by slug, render categories + items + photos + sold-out badges + daily special banner, cart with qty selectors, customer order form (name, phone, fulfillment, notes), "Order on WhatsApp" button that builds wa.me link and saves the order. Mobile-first layout.
5. Use Tailwind for all styling. Match the existing dashboard card/button styles. Mobile-first for the public menu.
6. Wire routes in App.tsx. Guard dashboard routes with the existing auth check.
7. Handle loading and error states for every async call (skeletons + toasts).
8. Do NOT add a payment gateway — cash on delivery/pickup only.

Constraints:
- TypeScript strict, no any.
- All Supabase queries go through services, not inline in components.
- Gemini calls must be server-safe: never leak the API key to the client bundle — call via the existing backend route pattern used elsewhere in the project.
- Public menu must work without auth.

Acceptance: all routes load, vendor can build a menu and generate AI descriptions, public menu displays and a WhatsApp order creates a dashboard entry, order status pipeline works end to end.
```

## Acceptance Criteria

1. **Menu creation** — A logged-in vendor can create a menu, add categories, add items with all spec fields, upload a photo, and save. Item persists in Supabase and appears on the public menu.
2. **AI description** — "Generate Description" on a menu item returns a Gemini-generated description that the vendor can accept and save. Fails gracefully with a toast if Gemini errors.
3. **Daily special** — Vendor can generate a daily special; it renders as a banner on the public menu.
4. **Public menu** — `/menu/:businessSlug` loads without auth, shows categories and items with photos, prices in TTD, sold-out badges for unavailable items.
5. **Customer order** — Customer adds items to cart, enters name + phone + fulfillment + notes, sees a total, and the "Order on WhatsApp" button opens `wa.me/<vendorPhone>` with a pre-filled, correctly encoded order message. Order is also saved to `food_orders` + `food_order_items`.
6. **Orders dashboard** — Vendor sees new orders appear in the `new` column. Can advance through `confirmed → preparing → ready → completed` and cancel to `cancelled`. Status changes persist.
7. **Cash confirmation** — Marking an order `completed` prompts a cash-collected confirmation; amount is stored on the order.
8. **RLS** — A vendor cannot read/modify another vendor's menu or orders. Public can only read published menus and insert orders for published menus.
9. **Mobile** — Public menu is responsive and usable on a phone.
10. **No payment gateway** — No Stripe/card integration; cash only.
