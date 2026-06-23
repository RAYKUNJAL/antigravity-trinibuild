# Week 1 Build Spec — AI Marketplace Shell + Business Profile System

## Goal

Create the foundation where all AI tools will live. This includes the marketplace page, individual tool cards, business dashboard shell, business profile creation, and tool activation system.

## Existing Project Context

- TriniBuild is already a React + Vite + TypeScript + Tailwind + Supabase project
- Existing components: Navbar, Footer, WhatsAppWidget, ChatWidget, SEO, ProtectedRoute, etc.
- App.tsx and index.tsx are at project root
- Supabase schema exists in /supabase/full_schema.sql
- Backend folder with Prisma + Express exists at /backend

## Deliverables

### 1. AI Tools Marketplace Page (`/ai-tools`)

A public-facing page that showcases all AI tools available on TriniBuild.

Features:
- Hero section: "The Caribbean Business Operating System"
- Category filters: Get Customers, Manage Customers, Get Paid, Sell Online, Grow
- Grid of AI tool cards
- Each card shows: tool name, icon, short benefit, "Best for" tags, price, status badge (Active/Coming Soon), CTA button
- Search bar to filter tools by name
- Mobile-first responsive grid (1 col mobile, 2 col tablet, 3 col desktop)

Tool cards to create (12 tools, some marked "Coming Soon"):

| # | Tool Name | Slug | Category | Price | Status |
|---|---|---|---|---|---|
| 1 | AI Business Website Builder | website-builder | Get Customers | $10/mo | Active |
| 2 | AI Social Media Generator | content-generator | Get Customers | $9/mo | Active |
| 3 | Invoice + Cash/COD Tracker | invoice-tracker | Get Paid | $10/mo | Active |
| 4 | AI WhatsApp Receptionist | whatsapp-receptionist | Manage Customers | $19/mo | Active |
| 5 | Food Vendor Menu + Ordering | food-ordering | Sell Online | $15/mo | Coming Soon |
| 6 | Review Booster + QR Cards | review-booster | Get Customers | $10/mo | Coming Soon |
| 7 | Grant Proposal Builder | grant-builder | Grow | $19/mo | Coming Soon |
| 8 | Real Estate Listing Builder | real-estate | TriniBuild Living | $19/mo | Coming Soon |
| 9 | Event Ticketing + QR Check-In | event-ticketing | TriniBuild Events | $29/event | Coming Soon |
| 10 | Tourism Booking Kit | tourism-booking | Get Customers | $19/mo | Coming Soon |
| 11 | Inventory + Price List Builder | inventory-builder | Manage Operations | $15/mo | Coming Soon |
| 12 | AI Flyer + QR Generator | flyer-generator | Get Customers | $9/mo | Coming Soon |

### 2. AI Tool Detail Page (`/ai-tools/:slug`)

Individual landing page for each tool.

Features:
- Tool name, description, benefits
- "Best for" tags
- Pricing tiers
- Feature list with checkmarks
- Demo screenshot placeholder
- "Activate Tool" CTA (requires login + business profile)
- "Buy Template" CTA for digital download version
- FAQ section
- Related tools section

### 3. Business Dashboard Shell (`/dashboard`)

Protected route (requires auth). Main dashboard layout.

Features:
- Sidebar navigation: Overview, My Business, AI Tools, Orders, Settings
- Top bar: Business name switcher, notifications, profile dropdown
- Overview page: Active tools, recent activity, quick actions
- Mobile: Sidebar collapses to hamburger menu

Pages:
```
/dashboard                    — Overview
/dashboard/business           — Business profile settings
/dashboard/tools              — My activated tools
/dashboard/tools/:toolSlug    — Individual tool workspace
/dashboard/orders             — Digital product orders
/dashboard/settings           — Account settings
```

### 4. Business Profile Creation Flow

Multi-step wizard for creating a business profile.

Step 1: Basic Info
- Business name (required)
- Category (dropdown: Salon, Barber, Tattoo, Restaurant, Food Vendor, Mechanic, Real Estate, Tutor, Shop, Other)
- Country (default: Trinidad and Tobago)
- City/Town

Step 2: Contact
- WhatsApp number (required)
- Phone number
- Email
- Website (optional)

Step 3: Description
- Business description (textarea, with AI generate button)
- Services/products offered (tags input)
- Logo upload (Supabase Storage)

Step 4: Hours
- Opening hours (day-by-day or simple "Open from X to Y")

Step 5: Review & Publish
- Review all info
- Generate slug from business name
- Publish / Save as draft

### 5. Tool Activation System

When a user clicks "Activate Tool" on a tool detail page:
1. Check if user is logged in → if not, redirect to login
2. Check if user has a business profile → if not, redirect to profile creation
3. Show activation modal: plan selection (Free trial / Paid)
4. Create `business_tool_activations` record
5. Redirect to tool workspace at `/dashboard/tools/:toolSlug`

### 6. Supabase Schema Additions

```sql
-- AI Tools registry
CREATE TABLE IF NOT EXISTS ai_tools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  short_benefit TEXT,
  best_for TEXT[],
  price_monthly DECIMAL(10,2) DEFAULT 0,
  price_setup DECIMAL(10,2) DEFAULT 0,
  icon TEXT,
  status TEXT DEFAULT 'active', -- active, coming_soon
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business tool activations
CREATE TABLE IF NOT EXISTS business_tool_activations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  tool_id UUID REFERENCES ai_tools(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active', -- active, suspended, cancelled
  plan TEXT DEFAULT 'free_trial', -- free_trial, basic, growth, pro, agency
  settings JSONB DEFAULT '{}',
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, tool_id)
);

-- AI generations log
CREATE TABLE IF NOT EXISTS ai_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  tool_slug TEXT NOT NULL,
  prompt_type TEXT NOT NULL,
  input_json JSONB,
  output_text TEXT,
  output_json JSONB,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI prompt templates
CREATE TABLE IF NOT EXISTS ai_prompt_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_slug TEXT NOT NULL,
  prompt_type TEXT NOT NULL,
  title TEXT,
  system_prompt TEXT,
  user_prompt_template TEXT,
  output_format TEXT DEFAULT 'text', -- text, json, markdown
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Digital products
CREATE TABLE IF NOT EXISTS digital_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  file_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Digital product orders
CREATE TABLE IF NOT EXISTS digital_product_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  product_id UUID REFERENCES digital_products(id),
  payment_status TEXT DEFAULT 'pending', -- pending, paid, refunded
  delivery_status TEXT DEFAULT 'pending', -- pending, delivered
  amount DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  plan TEXT NOT NULL, -- basic, growth, pro, agency
  status TEXT DEFAULT 'active', -- active, suspended, cancelled
  started_at TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE ai_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_tool_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_product_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- ai_tools: public read
CREATE POLICY "ai_tools_public_read" ON ai_tools FOR SELECT USING (true);

-- business_tool_activations: owner only
CREATE POLICY "activations_owner_read" ON business_tool_activations FOR SELECT USING (
  EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
);
CREATE POLICY "activations_owner_insert" ON business_tool_activations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
);
CREATE POLICY "activations_owner_update" ON business_tool_activations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
);

-- ai_generations: owner only
CREATE POLICY "generations_owner_all" ON ai_generations FOR ALL USING (
  EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
);

-- ai_prompt_templates: public read
CREATE POLICY "templates_public_read" ON ai_prompt_templates FOR SELECT USING (true);

-- digital_products: public read
CREATE POLICY "products_public_read" ON digital_products FOR SELECT USING (true);

-- digital_product_orders: owner only
CREATE POLICY "orders_owner_read" ON digital_product_orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "orders_owner_insert" ON digital_product_orders FOR INSERT WITH CHECK (user_id = auth.uid());

-- subscriptions: owner only
CREATE POLICY "subs_owner_read" ON subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
);

-- activity_logs: owner only
CREATE POLICY "logs_owner_read" ON activity_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
);

-- Seed ai_tools data
INSERT INTO ai_tools (name, slug, category, description, short_benefit, best_for, price_monthly, status, sort_order) VALUES
('AI Business Website Builder', 'website-builder', 'Get Customers', 'Generate a professional business page with AI-written descriptions, SEO, and WhatsApp button.', 'Get your business online in 10 minutes', ARRAY['Salons', 'Barbers', 'Shops', 'Restaurants'], 10.00, 'active', 1),
('AI Social Media Generator', 'content-generator', 'Get Customers', 'Create 30 days of captions, reels, and WhatsApp status content in minutes.', '30 days of content in 5 minutes', ARRAY['Food Vendors', 'Beauty', 'Real Estate', 'Artists'], 9.00, 'active', 2),
('Invoice + Cash/COD Tracker', 'invoice-tracker', 'Get Paid', 'Track cash payments, bank transfers, and COD with professional invoices and receipts.', 'Professional invoices without needing online payments', ARRAY['Tradesmen', 'Vendors', 'Caterers', 'Mechanics'], 10.00, 'active', 3),
('AI WhatsApp Receptionist', 'whatsapp-receptionist', 'Manage Customers', 'Never miss another customer. Auto-reply scripts, booking intake, and lead capture.', 'Never miss another customer again', ARRAY['Salons', 'Barbers', 'Tattoo Artists', 'Mechanics', 'Clinics'], 19.00, 'active', 4),
('Food Vendor Menu + Ordering', 'food-ordering', 'Sell Online', 'Digital menu with WhatsApp ordering, pickup/delivery options, and daily specials.', 'Turn WhatsApp into your food ordering system', ARRAY['Food Vendors', 'Caterers', 'Roti Shops', 'Doubles Vendors'], 15.00, 'coming_soon', 5),
('Review Booster + QR Cards', 'review-booster', 'Get Customers', 'Collect reviews and testimonials with QR cards and automated request messages.', 'Turn happy customers into more customers', ARRAY['Restaurants', 'Salons', 'Hotels', 'Airbnb'], 10.00, 'coming_soon', 6),
('Grant Proposal Builder', 'grant-builder', 'Grow', 'Generate business plans, grant proposals, and financial projections with AI.', 'Turn your business idea into a fundable proposal', ARRAY['Farmers', 'Women-Owned', 'Startups', 'NGOs'], 19.00, 'coming_soon', 7),
('Real Estate Listing Builder', 'real-estate', 'TriniBuild Living', 'Create professional rental/sale listings with AI descriptions and lead capture.', 'List properties faster and get better leads', ARRAY['Landlords', 'Real Estate Agents', 'Property Managers'], 19.00, 'coming_soon', 8),
('Event Ticketing + QR Check-In', 'event-ticketing', 'TriniBuild Events', 'Sell tickets, generate QR codes, and check in attendees at the door.', 'Sell tickets and check people in with QR codes', ARRAY['Promoters', 'Churches', 'Schools', 'Boat Rides'], 29.00, 'coming_soon', 9),
('Tourism Booking Kit', 'tourism-booking', 'Get Customers', 'Booking system for tour operators, guest houses, and local experiences.', 'Turn tourists into booked customers', ARRAY['Tour Guides', 'Boat Tours', 'Guest Houses', 'Taxi Drivers'], 19.00, 'coming_soon', 10),
('Inventory + Price List Builder', 'inventory-builder', 'Manage Operations', 'Track stock, generate price lists, and get low-stock alerts.', 'Know what you have, what you sold, and what to restock', ARRAY['Mini Marts', 'Boutiques', 'Hardware', 'Beauty Supply'], 15.00, 'coming_soon', 11),
('AI Flyer + QR Generator', 'flyer-generator', 'Get Customers', 'Create promo flyers, QR codes, and WhatsApp captions in minutes.', 'Create a full promo campaign in minutes', ARRAY['Every Small Business'], 9.00, 'coming_soon', 12)
ON CONFLICT (slug) DO NOTHING;
```

### 7. Shared Components to Create

```
src/components/dashboard/
  DashboardLayout.tsx       — Main dashboard shell with sidebar + topbar
  Sidebar.tsx               — Navigation sidebar (collapsible on mobile)
  TopBar.tsx                — Top bar with business switcher + profile
  StatCard.tsx              — Quick stat display card
  EmptyState.tsx            — Reusable empty state component
  UpgradeCTA.tsx            — Upgrade prompt component

src/components/ai-tools/
  ToolCard.tsx              — Marketplace tool card
  ToolGrid.tsx              — Grid layout for tool cards
  ToolCategoryFilter.tsx    — Category filter tabs
  ActivationModal.tsx       — Tool activation modal
  ToolStatusBadge.tsx       — Active/Coming Soon badge

src/components/business/
  BusinessProfileWizard.tsx — Multi-step profile creation
  BusinessCard.tsx          — Business display card
  BusinessSwitcher.tsx      — Switch between businesses

src/components/forms/
  FormField.tsx             — Reusable form field (text, textarea, select)
  ImageUpload.tsx           — Image upload to Supabase Storage
  TagInput.tsx              — Tags input for services/products
  PhoneInput.tsx            — Phone number input with country code

src/components/ui/
  Button.tsx                — Primary, secondary, ghost, danger variants
  Card.tsx                  — Card container
  Modal.tsx                 — Modal/dialog
  Badge.tsx                 — Status badge
  Tabs.tsx                  — Tab navigation
  Spinner.tsx               — Loading spinner
  Toast.tsx                 — Toast notifications
```

### 8. Route Updates

Add to App.tsx routing:

```typescript
// Public routes
/ai-tools                    — AI Tools Marketplace
/ai-tools/:slug              — Tool Detail Page

// Protected routes (require auth)
/dashboard                   — Dashboard Overview
/dashboard/business          — Business Profile Settings
/dashboard/business/new      — Create Business Profile (wizard)
/dashboard/tools             — My Tools
/dashboard/tools/:toolSlug   — Tool Workspace
/dashboard/orders            — Digital Product Orders
/dashboard/settings          — Account Settings
```

## Acceptance Criteria

- [ ] `/ai-tools` page renders with all 12 tool cards
- [ ] Category filter works (Get Customers, Manage Customers, Get Paid, Sell Online, Grow)
- [ ] Search bar filters tools by name
- [ ] Tool detail page renders at `/ai-tools/:slug`
- [ ] "Activate Tool" redirects to login if not authenticated
- [ ] "Activate Tool" redirects to business profile creation if no profile
- [ ] Business profile wizard works end-to-end (5 steps)
- [ ] Dashboard layout renders with sidebar + topbar
- [ ] Sidebar collapses on mobile (hamburger menu)
- [ ] Tool activation creates record in Supabase
- [ ] All Supabase tables created with RLS policies
- [ ] Seed data inserted for 12 AI tools
- [ ] `npm run build` passes with no errors
- [ ] Mobile responsive on all new pages

## Build Instructions for Codex

```
You are working on the TriniBuild project at C:\Users\Banjo\OneDrive\Documents\Trinibuild.

This is a React + Vite + TypeScript + Tailwind + Supabase project.

TASK: Build Week 1 — AI Marketplace Shell + Business Profile System

1. Run the SQL in docs/build-specs/week-01-marketplace-shell.md against Supabase (or create a migration file in /supabase/migrations/)
2. Create the shared UI components in src/components/ui/ (Button, Card, Modal, Badge, Tabs, Spinner, Toast)
3. Create the dashboard components in src/components/dashboard/ (DashboardLayout, Sidebar, TopBar, StatCard, EmptyState, UpgradeCTA)
4. Create the AI tool components in src/components/ai-tools/ (ToolCard, ToolGrid, ToolCategoryFilter, ActivationModal, ToolStatusBadge)
5. Create the business components in src/components/business/ (BusinessProfileWizard, BusinessCard, BusinessSwitcher)
6. Create the form components in src/components/forms/ (FormField, ImageUpload, TagInput, PhoneInput)
7. Create the page components:
   - AIToolsMarketplace page at /ai-tools
   - ToolDetail page at /ai-tools/:slug
   - DashboardOverview at /dashboard
   - BusinessProfileSettings at /dashboard/business
   - BusinessProfileWizard at /dashboard/business/new
   - MyTools at /dashboard/tools
   - ToolWorkspace at /dashboard/tools/:toolSlug
   - Orders at /dashboard/orders
   - Settings at /dashboard/settings
8. Update App.tsx routing to include all new routes
9. Create a Supabase client utility in src/lib/supabase/ if one doesn't exist
10. Create an auth context/hook in src/lib/auth/ for protected routes
11. Ensure all pages are mobile-responsive with Tailwind
12. Run `npm run build` to verify no errors

IMPORTANT:
- Check the existing codebase for existing Supabase client, auth context, and reusable components before creating new ones
- Do NOT break existing routes or components
- Use Tailwind classes for all styling
- Mobile-first: design for phone, then tablet, then desktop
- Caribbean SaaS visual style: clean, modern, professional
- Use lucide-react for icons (already installed)
- Keep the existing Navbar and Footer for public pages
- Dashboard pages should have their own layout (DashboardLayout) without the public Navbar
```
