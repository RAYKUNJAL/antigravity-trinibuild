# Week 8 Build Spec — Grant / Loan / Business Plan Builder

## Goal

Build an AI-assisted proposal and business-plan builder that walks a Trinidad & Tobago entrepreneur from a rough business idea to a complete, exportable funding package: executive summary, problem statement, solution, market opportunity, business model, impact statement, use of funds, implementation plan, a budget, and a financial projection table. Output is exportable to PDF and saved as drafts in Supabase. The tool targets Caribbean grant programs, microfinance loans, and business-plan competitions.

## Features

### Vendor / entrepreneur (authenticated) side
- **Projects list** at `/dashboard/tools/grant-builder/projects` — cards for each funding project with status (draft, in progress, complete), last edited, funding target.
- **Project workspace** at `/dashboard/tools/grant-builder/projects/:id` — sectioned editor: one panel per proposal section + budget + projections.
- **Business idea intake** — a guided multi-step form (business name, sector, location, problem you solve, target customer, revenue model, funding needed, funding purpose, timeline, team size). Seeds all downstream AI generation.
- **Section generators** — each proposal section has an "Generate with AI" button that uses the intake + previously generated sections as context:
  - Executive Summary
  - Problem Statement
  - Solution
  - Market Opportunity
  - Business Model
  - Impact Statement
  - Use of Funds
  - Implementation Plan
- **Budget builder** — line-item editor (category, description, qty, unit cost, total). Categories: Equipment, Operations, Marketing, Personnel, Compliance, Contingency. Auto-totals and a "Use of Funds" summary that feeds the proposal.
- **Financial projection table** — monthly or quarterly rows for 12 months: revenue, COGS, gross profit, operating expenses, net profit, cumulative cash. Editable; auto-calculates totals.
- **Grant proposal generator** — "Generate Full Proposal" assembles all sections into a single ordered document with headings; editable in a rich preview before export.
- **Export to PDF** — client-side PDF generation (e.g. jsPDF + html-to-image or react-to-print) of the full proposal, including budget and projections tables. A4, print-friendly.
- **Save drafts** — autosave to Supabase on section edit; explicit "Save Draft" and "Mark Complete" actions. Versioning optional.
- **Problem statement generator** and **Market opportunity generator** are also available as standalone single-section generators for quick use.

### Public side
- No public route for this tool (proposals are private). Optional future: share a read-only link.

## Pages (route paths)

| Route | Auth | Purpose |
|---|---|---|
| `/dashboard/tools/grant-builder` | vendor | Overview — projects list + "New Project" CTA + tips |
| `/dashboard/tools/grant-builder/projects` | vendor | Full projects list (same data, focused view) |
| `/dashboard/tools/grant-builder/projects/:id` | vendor | Project workspace — intake + section editors + budget + projections + export |

All routes nested under existing `HashRouter` + `authService`. No public route.

## AI Outputs (what the AI generates)

Each generator returns structured, editable text. All calls via `services/geminiService.ts` wrapper.

1. **Executive Summary** — Input: full intake. Output: 150–250 words, investor/grant-reader tone, Caribbean context.
2. **Problem Statement** — Input: intake problem + target customer. Output: 150–200 words naming the problem, who suffers, and why existing solutions fail.
3. **Solution** — Input: intake solution + problem statement. Output: 150–250 words describing the solution, how it works, and why it's viable.
4. **Market Opportunity** — Input: intake sector + location + target customer. Output: 150–250 words with TAM/SAM/SOM framing adapted to T&T/Caribbean market sizing.
5. **Business Model** — Input: intake revenue model + pricing assumptions. Output: revenue streams, pricing, channels, key costs, unit economics summary.
6. **Impact Statement** — Input: intake + location. Output: 150–200 words on social/economic/community impact (jobs, local supply, outcomes) — important for grants.
7. **Use of Funds** — Input: budget line items + funding need. Output: 100–150 words narrative tying budget items to outcomes.
8. **Implementation Plan** — Input: intake timeline + team. Output: phased timeline (3–6 phases) with milestones and durations.

## Supabase Tables (SQL)

```sql
-- A funding project (one per proposal/business idea)
create table public.funding_projects (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.profiles(id) on delete cascade,
  project_name text not null,
  funding_target numeric(12,2),
  funding_type text check (funding_type in ('grant','loan','business_plan','competition')),
  status text not null default 'draft' check (status in ('draft','in_progress','complete')),
  intake jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Generated proposal sections (one row per section per project)
create table public.proposal_sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.funding_projects(id) on delete cascade,
  section_key text not null check (section_key in (
    'executive_summary','problem_statement','solution','market_opportunity',
    'business_model','impact_statement','use_of_funds','implementation_plan'
  )),
  content text,
  generated_at timestamptz,
  is_locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, section_key)
);

-- Budget line items
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.funding_projects(id) on delete cascade,
  category text not null check (category in ('Equipment','Operations','Marketing','Personnel','Compliance','Contingency')),
  description text not null,
  quantity int not null default 1 check (quantity > 0),
  unit_cost numeric(12,2) not null,
  line_total numeric(12,2) generated always as (quantity * unit_cost) stored,
  created_at timestamptz not null default now()
);

-- Financial projections (period-based)
create table public.projections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.funding_projects(id) on delete cascade,
  period_label text not null, -- e.g. '2026-01' or 'Q1 2026'
  period_order int not null,
  revenue numeric(12,2) not null default 0,
  cogs numeric(12,2) not null default 0,
  operating_expenses numeric(12,2) not null default 0,
  gross_profit numeric(12,2) generated always as (revenue - cogs) stored,
  net_profit numeric(12,2) generated always as (revenue - cogs - operating_expenses) stored,
  unique (project_id, period_label)
);
```

RLS:
- All four tables: vendor full CRUD where `business_id = auth.uid()` (via project ownership). No public access. A vendor cannot access another vendor's projects, sections, budgets, or projections.

## Digital Download Version

**Product:** Caribbean Grant Proposal + Business Plan Kit
**Price:** $49 USD (standard) / $99 USD (premium with 1-on-1 review credit)
**Deliverables (zip):**
- Grant proposal template (Word + Google Docs) with all 8 sections + T&T/Caribbean funder framing
- Business plan template (Word + Google Docs)
- Budget spreadsheet (Excel + Google Sheets) with formulas and the 6 standard categories
- 12-month financial projection spreadsheet (Excel + Google Sheets)
- Directory of Caribbean/T&T grant & loan programs (PDF) — names, eligibility, links, deadlines notes
- Prompt library: 8 section prompts tuned for Caribbean funders
- "Use of Funds" narrative guide PDF
- Implementation plan Gantt chart template (Excel)
- Premium tier: 1 credit for a human review of one completed proposal

Listed in `/downloads`; purchase yields a 72-hour signed download link. Premium tier additionally issues a review-credit code.

## Codex Prompt (detailed prompt for the Codex CLI agent)

```
You are building the "Grant / Loan / Business Plan Builder" for TriniBuild (React + Vite + TypeScript + Tailwind + Supabase + Google Gemini).

Reuse:
- services/supabaseClient.ts, services/authService.ts (profile with .id)
- services/geminiService.ts (extend; do not recreate Gemini client)
- HashRouter in App.tsx

Tasks:
1. Run the SQL from the build spec to create: funding_projects, proposal_sections, budgets, projections. Apply RLS (vendor-only via business_id = auth.uid(); no public access).
2. services/grantService.ts with typed functions: listProjects, getProject, createProject, updateProject, deleteProject, upsertSection, getSections, addBudgetLine, updateBudgetLine, deleteBudgetLine, getBudget, upsertProjection, getProjections, markComplete.
3. services/grantAiService.ts: one generator per section (generateExecutiveSummary, generateProblemStatement, generateSolution, generateMarketOpportunity, generateBusinessModel, generateImpactStatement, generateUseOfFunds, generateImplementationPlan). Each accepts (intake, contextSections) and returns a string. Also generateFullProposal(project) that assembles ordered sections. Guard all calls with try/catch + toast.
4. Pages:
   - pages/tools/GrantBuilderOverview.tsx (route /dashboard/tools/grant-builder) — projects grid, "New Project" CTA, funding-target totals, tips card.
   - pages/tools/GrantProjects.tsx (route /dashboard/tools/grant-builder/projects) — full projects list with status filters + search.
   - pages/tools/GrantProjectWorkspace.tsx (route /dashboard/tools/grant-builder/projects/:id) — left nav of sections; intake form (multi-step) at top; each section editor has a textarea + "Generate with AI" + "Save" + lock toggle; budget builder table (add/edit/delete lines, auto totals by category, grand total); projections table (12 editable period rows, auto-computed gross/net profit); "Generate Full Proposal" button that opens a print-ready preview; "Export to PDF" button.
5. PDF export: use jsPDF + html-to-image (or react-to-print) to render the assembled proposal (sections + budget table + projections table) as an A4 PDF. Filename: <project_name>-proposal.pdf.
6. Autosave: debounce section content saves (1.5s idle). Show "Saved" / "Saving…" indicator.
7. Styling: Tailwind, match existing dashboard components. Print stylesheet for the proposal preview.
8. Loading + error states everywhere (skeletons + toasts). No inline Supabase in components.
9. TypeScript strict, no any. Keep Gemini API key off the client bundle.

Acceptance: vendor creates a project, completes intake, generates each section with AI, edits/saves, builds a budget and projections, generates the full proposal, and exports a PDF. Data persists across reloads. RLS prevents cross-vendor access.
```

## Acceptance Criteria

1. **Projects list** — Vendor sees their projects; can create a new one; cards show status and funding target.
2. **Intake** — Multi-step intake form saves to `funding_projects.intake` and seeds generation.
3. **Section generation** — Each of the 8 sections has a working "Generate with AI" button that returns contextual, editable text and saves to `proposal_sections`.
4. **Section editing** — Vendor can edit generated text, save, and lock a section. Autosave works.
5. **Budget** — Vendor can add/edit/delete line items across the 6 categories; line totals and grand total auto-compute; budget persists.
6. **Projections** — Vendor can edit 12 period rows; gross profit and net profit auto-compute (generated columns); data persists.
7. **Full proposal** — "Generate Full Proposal" assembles all sections in order into a single readable document; missing sections are skipped or marked placeholder.
8. **PDF export** — "Export to PDF" downloads a valid A4 PDF containing the proposal, budget table, and projections table.
9. **RLS** — A vendor cannot read or modify another vendor's projects, sections, budgets, or projections. No public access.
10. **Resilience** — AI failures show a toast and do not wipe existing content; network errors surface a retry.
