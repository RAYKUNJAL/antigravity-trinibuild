# TriniBuild AI Services Marketplace — Master Build Plan

## Vision

TriniBuild becomes **"The Caribbean Business Operating System"** — a single platform where underserved Caribbean small businesses access AI-powered tools to get online, get discovered, answer customers, take bookings, track cash payments, create content, collect reviews, sell products, manage events, apply for funding, and grow faster.

## Core Architecture Principle

**One platform. Many tools. One business profile. Multiple upsells. Recurring revenue.**

Every business creates a TriniBuild Business Profile first. Then each AI tool attaches to that profile. A salon owner comes for the AI receptionist, then adds booking, invoices, content generator, and review booster. That's the ecosystem lock-in.

## Tech Stack (Already In Place)

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 6 + TypeScript 5.8 |
| Styling | Tailwind CSS 3.4 |
| Backend | Supabase (Auth, Database, Storage, RLS) |
| AI | Google Gemini (@google/genai) + OpenAI wrapper |
| Maps | Leaflet / React-Leaflet |
| Charts | Recharts |
| Payments | PayPal (existing), Braintree (planned), Cash/COD (native) |

## Brand Architecture

```
TriniBuild
├── TriniBuild AI          — All AI-powered business tools
├── TriniBuild Pay / COD   — Cash, invoice, payment tracking
├── TriniBuild Go          — Delivery, courier, rideshare (later)
├── TriniBuild Living      — Real estate rentals/sales
├── TriniBuild Events      — Ticketing and event pages
└── Callyuh AI             — Voice/WhatsApp receptionist (powered by TriniBuild)
```

## Agent Team Setup

Based on the Goose/Paperclip build-room framework:

| Agent | Role | Responsibilities |
|---|---|---|
| **Codex** | Repo Integration & Final Build | Code generation, edits, validation, go/no-go |
| **Goose** | Bounded Local Execution | Feature implementation in assigned lanes |
| **Paperclip** | Orchestration | Board state, tickets, budgets, heartbeats, audit trail |
| **Hermes Swarm** | Parallel Dispatch | Multiple delegate_task agents for concurrent workstreams |

## 12-Week Rollout Schedule

| Week | Product | Category | Priority |
|---|---|---|---|
| 1 | AI Marketplace Shell + Business Profile System | Foundation | CRITICAL |
| 2 | AI Business Website Builder | Get Customers | HIGH |
| 3 | AI Social Media Content Generator | Get Customers | HIGH |
| 4 | Invoice + Cash/COD Tracker | Get Paid | HIGH |
| 5 | WhatsApp Receptionist Lite | Manage Customers | HIGH |
| 6 | Food Vendor Menu + Ordering System | Sell Online | MEDIUM |
| 7 | Review Booster + QR Review Cards | Get Customers | MEDIUM |
| 8 | Grant / Loan / Business Plan Builder | Grow / Get Funding | MEDIUM |
| 9 | Real Estate Listing Builder | TriniBuild Living | MEDIUM |
| 10 | Event Ticketing + QR Check-In | TriniBuild Events | MEDIUM |
| 11 | Tourism Booking Kit | Get Customers | LOW |
| 12 | Inventory + Price List Builder | Manage Operations | LOW |

## Tool Categories (Dashboard Organization)

```
GET CUSTOMERS
├── AI Website Builder
├── AI Social Media Generator
├── Google Business SEO Kit
├── Review Booster
└── Flyer + QR Generator

MANAGE CUSTOMERS
├── AI WhatsApp Receptionist
├── Booking System
├── CRM
├── Missed Call Recovery
└── Follow-up Automations

GET PAID / TRACK SALES
├── Cash/COD Invoice Tracker
├── Receipt Generator
├── Payment Screenshot Tracker
└── Sales Reports

SELL ONLINE
├── Food Ordering System
├── Digital Menu Builder
├── Product Listing Builder
└── Marketplace Storefront

GROW / GET FUNDING
├── Business Plan Builder
├── Grant Proposal Builder
├── Loan Application Kit
└── Financial Projection Builder
```

## Monetization Model

| Tier | Price | Includes |
|---|---|---|
| Free | $0 | Business profile, 10 listings, WhatsApp button, basic marketplace |
| Digital Downloads | $17–$97 | Prompt packs, templates, guides, checklists |
| SaaS Basic | $10/mo | 1 AI tool, basic features |
| SaaS Growth | $19/mo | 3 AI tools, enhanced features |
| SaaS Pro | $49/mo | All AI tools, advanced features |
| SaaS Agency | $99/mo | Multi-business, white-label |
| Done-For-You Setup | $99–$499 | Full business setup and automation |

## Database Schema (Shared Tables)

```sql
-- Core tables (build first)
businesses (id, owner_id, name, slug, category, country, city, whatsapp, phone, email, description, logo_url, status, created_at, updated_at)
ai_tools (id, name, slug, category, description, price_monthly, price_setup, status, created_at)
business_tool_activations (id, business_id, tool_id, status, plan, settings_json, activated_at, created_at)
ai_generations (id, business_id, tool_slug, prompt_type, input_json, output_text, output_json, created_by, created_at)
ai_prompt_templates (id, tool_slug, prompt_type, title, system_prompt, user_prompt_template, output_format, status, created_at)
customers (id, business_id, name, phone, whatsapp, email, notes, created_at)
orders (id, business_id, customer_id, source, status, total, payment_status, created_at)
digital_products (id, title, slug, category, description, price, file_url, status, created_at)
digital_product_orders (id, user_id, product_id, payment_status, delivery_status, created_at)
subscriptions (id, business_id, plan, status, started_at, current_period_end, created_at)
activity_logs (id, business_id, user_id, action, details_json, created_at)
```

## Shared AI Wrapper

```typescript
type AIGenerationRequest = {
  businessId?: string;
  toolSlug: string;
  promptType: string;
  input: Record<string, any>;
};

async function generateAIContent(request: AIGenerationRequest) {
  // 1. Validate user access
  // 2. Load prompt template from ai_prompt_templates
  // 3. Inject business context
  // 4. Call selected model (Gemini/OpenAI)
  // 5. Save generation to ai_generations
  // 6. Return structured output
}
```

## Weekly Agent Workflow

| Day | Agent | Task |
|---|---|---|
| Monday | Product Architect | Feature spec, user flow, DB tables, acceptance criteria |
| Tuesday | Backend Agent | Supabase tables, policies, API functions, validation |
| Wednesday | Frontend Agent | Pages, forms, dashboard UI, mobile design |
| Thursday | AI Prompt Agent | Prompt templates, generation logic, save/regenerate/copy |
| Friday | QA Agent | Lint, build, mobile checks, auth tests, CRUD tests, RLS |
| Saturday | Launch Agent | Sales page, product card, pricing, demo content |
| Sunday | Review + Merge | Merge to main, deploy, prep next week |

## MVP Feature Set (Per Tool)

Every tool only needs:
1. Setup wizard
2. Save data to Supabase
3. AI generate button
4. Edit generated output
5. Public page or export
6. Dashboard list view
7. Upgrade CTA
8. Mobile layout

## Folder Structure (To Add to Existing Project)

```
src/
  components/
    dashboard/           — Shared dashboard components
    ai-tools/            — AI tool cards, activation flows
    business/            — Business profile components
    forms/               — Shared form components
    ui/                  — Buttons, cards, modals, etc.
  features/
    ai-marketplace/      — Week 1: Marketplace shell
    website-builder/     — Week 2: Business website builder
    content-generator/   — Week 3: Social media generator
    invoice-tracker/     — Week 4: Cash/COD invoice tracker
    whatsapp-receptionist/ — Week 5: Receptionist Lite
    food-ordering/       — Week 6: Food vendor system
    review-booster/      — Week 7: Review + QR system
    grant-builder/       — Week 8: Grant/loan/business plan
    real-estate/         — Week 9: Real estate listings
    events/              — Week 10: Event ticketing
    tourism/             — Week 11: Tourism booking
    inventory/           — Week 12: Inventory + price list
  lib/
    supabase/            — Client, queries, types
    ai/                  — AI wrapper, prompt templates
    auth/                — Auth context, protected routes
    utils/               — Helpers, formatting
  pages/                 — Route-level pages
  routes/                — Route definitions
docs/
  build-specs/           — Weekly build specs
  prompts/               — AI prompt documentation
  qa-checklists/         — QA checklists per tool
```

## Connection to Future Caribbean Buildathon

TriniBuild AI Services Marketplace serves as **deployment proof** for the TideLinx pitch (Track 02: Finance, Payments & MSME Capital). Every tool on the platform runs through the TideLinx settlement rail. The invoice/Cash tracker is the direct connection — it tracks transactions that flow through the rail. The business profiles generate trackable income data that feeds into TideLinx's financial identity system for undocumented workers.

## Hard Rules

1. Do not build each tool as a separate app — all tools are modules inside TriniBuild
2. Every tool must connect to a business_id
3. Every AI-generated output must be saved to Supabase
4. Every page must be mobile-friendly
5. Add upgrade CTAs but do not require live payment integration yet
6. Use reusable components across tools
7. Run lint and build after changes
8. Keep secrets server-side only
9. Add clear empty states and demo content
10. Do not overbuild — MVP features only until proven
