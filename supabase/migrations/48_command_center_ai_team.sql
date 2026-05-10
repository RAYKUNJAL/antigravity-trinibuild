-- NextBagChaser Command Center AI Team
-- Control-plane tables for app registry, agent runs, shared memory, and handoffs.

CREATE TABLE IF NOT EXISTS public.command_center_apps (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  route TEXT NOT NULL,
  owner_team TEXT NOT NULL,
  revenue_motion TEXT NOT NULL,
  description TEXT NOT NULL,
  setup_checklist TEXT[] DEFAULT '{}',
  signals JSONB DEFAULT '[]'::jsonb,
  agents TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.command_center_agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  app_id TEXT NOT NULL REFERENCES public.command_center_apps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  brain_provider TEXT NOT NULL DEFAULT 'google-gemini' CHECK (brain_provider IN ('google-gemini', 'paperclip', 'manual')),
  model TEXT,
  plan JSONB DEFAULT '{}'::jsonb,
  handoff_agents TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.command_center_agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL DEFAULT 'global' CHECK (scope IN ('global', 'app', 'agent', 'customer')),
  app_id TEXT REFERENCES public.command_center_apps(id) ON DELETE CASCADE,
  agent_id TEXT,
  memory_type TEXT NOT NULL DEFAULT 'decision' CHECK (memory_type IN ('goal', 'playbook', 'decision', 'learning', 'risk')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  confidence NUMERIC(3, 2) DEFAULT 0.80 CHECK (confidence >= 0 AND confidence <= 1),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.command_center_agent_handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES public.command_center_agent_runs(id) ON DELETE CASCADE,
  from_agent TEXT NOT NULL,
  to_agent TEXT NOT NULL,
  app_id TEXT NOT NULL REFERENCES public.command_center_apps(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'resolved', 'blocked')),
  summary TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.command_center_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  app_id TEXT REFERENCES public.command_center_apps(id) ON DELETE SET NULL,
  agent_id TEXT,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  title TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_command_center_apps_category
  ON public.command_center_apps(category);

CREATE INDEX IF NOT EXISTS idx_command_center_runs_app_created
  ON public.command_center_agent_runs(app_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_command_center_runs_agent_created
  ON public.command_center_agent_runs(agent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_command_center_runs_status
  ON public.command_center_agent_runs(status)
  WHERE status IN ('queued', 'running', 'failed');

CREATE INDEX IF NOT EXISTS idx_command_center_memory_scope_created
  ON public.command_center_agent_memory(scope, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_command_center_memory_app_created
  ON public.command_center_agent_memory(app_id, created_at DESC)
  WHERE app_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_command_center_handoffs_open
  ON public.command_center_agent_handoffs(status, created_at DESC)
  WHERE status IN ('open', 'blocked');

CREATE INDEX IF NOT EXISTS idx_command_center_events_created
  ON public.command_center_events(created_at DESC);

CREATE OR REPLACE FUNCTION public.set_command_center_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS command_center_apps_updated_at ON public.command_center_apps;
CREATE TRIGGER command_center_apps_updated_at
  BEFORE UPDATE ON public.command_center_apps
  FOR EACH ROW
  EXECUTE FUNCTION public.set_command_center_updated_at();

DROP TRIGGER IF EXISTS command_center_runs_updated_at ON public.command_center_agent_runs;
CREATE TRIGGER command_center_runs_updated_at
  BEFORE UPDATE ON public.command_center_agent_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_command_center_updated_at();

DROP TRIGGER IF EXISTS command_center_memory_updated_at ON public.command_center_agent_memory;
CREATE TRIGGER command_center_memory_updated_at
  BEFORE UPDATE ON public.command_center_agent_memory
  FOR EACH ROW
  EXECUTE FUNCTION public.set_command_center_updated_at();

ALTER TABLE public.command_center_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.command_center_agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.command_center_agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.command_center_agent_handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.command_center_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated command center app access" ON public.command_center_apps;
CREATE POLICY "Authenticated command center app access"
  ON public.command_center_apps
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated command center run access" ON public.command_center_agent_runs;
CREATE POLICY "Authenticated command center run access"
  ON public.command_center_agent_runs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated command center memory access" ON public.command_center_agent_memory;
CREATE POLICY "Authenticated command center memory access"
  ON public.command_center_agent_memory
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated command center handoff access" ON public.command_center_agent_handoffs;
CREATE POLICY "Authenticated command center handoff access"
  ON public.command_center_agent_handoffs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated command center event access" ON public.command_center_events;
CREATE POLICY "Authenticated command center event access"
  ON public.command_center_events
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

INSERT INTO public.command_center_apps (
  id,
  name,
  category,
  route,
  owner_team,
  revenue_motion,
  description,
  setup_checklist,
  signals,
  agents
) VALUES
  (
    'nextbagchaser-core',
    'NextBagChaser Core',
    'Executive',
    '/dashboard/team',
    'AI Command',
    'Turns platform traffic, operators, and app telemetry into prioritized execution.',
    'Central operating layer for every app, agent, runbook, and revenue workflow.',
    ARRAY['Connect Supabase', 'Boot agent mesh', 'Review handoffs', 'Run daily standup'],
    '[{"table":"command_center_agent_runs","label":"agent runs"},{"table":"command_center_agent_handoffs","label":"handoffs","filter":{"column":"status","value":"open"}}]'::jsonb,
    ARRAY['chief-orchestrator', 'ops-controller', 'revenue-analyst']
  ),
  (
    'stores-marketplace',
    'Stores & Marketplace',
    'Commerce',
    '/stores',
    'Store Growth',
    'Converts sellers to paid plans and shoppers to repeat buyers.',
    'Storefronts, seller onboarding, listings, checkout, loyalty, and customer service.',
    ARRAY['Audit store creation', 'Check product imports', 'Review checkout', 'Route support tickets'],
    '[{"table":"stores","label":"stores"},{"table":"products","label":"products"},{"table":"orders","label":"orders"}]'::jsonb,
    ARRAY['store-growth-agent', 'support-agent', 'qa-release-agent']
  ),
  (
    'bidbinbuy',
    'BidBinBuy',
    'Commerce',
    '/admin/command-center/marketplace-monitor',
    'Bin Store Launch',
    'Sells store-owner SaaS and drives shoppers to participating bin stores.',
    'Bin-store owner acquisition, scanner onboarding, shopper deals, and store routing.',
    ARRAY['Verify scanner path', 'Review owner onboarding', 'Check pricing claims', 'Launch outreach queue'],
    '[{"table":"bin_store_accounts","label":"bin stores"},{"table":"scanner_sessions","label":"scanner sessions"},{"table":"outreach_leads","label":"leads"}]'::jsonb,
    ARRAY['bin-store-prospector', 'store-growth-agent', 'support-agent']
  ),
  (
    'traffic-cro',
    'Traffic, CRO & Ads',
    'Growth',
    '/admin/command-center/traffic-hub',
    'Growth Command',
    'Finds traffic leaks and launches conversion fixes.',
    'Cold traffic, ad routing, landing-page conversion, analytics, and revenue experiments.',
    ARRAY['Check analytics', 'Review campaign spend', 'Inspect top pages', 'Queue CRO experiments'],
    '[{"table":"page_views","label":"page views"},{"table":"ad_campaigns","label":"campaigns","filter":{"column":"status","value":"active"}},{"table":"conversion_events","label":"conversions"}]'::jsonb,
    ARRAY['growth-orchestrator', 'ads-agent', 'revenue-analyst']
  ),
  (
    'seo-content',
    'SEO & Blog Engine',
    'Growth',
    '/blog',
    'Content AI',
    'Compounds search traffic into store signups and qualified leads.',
    'AI SEO content, keyword plans, programmatic pages, and organic traffic buildout.',
    ARRAY['Review keyword queue', 'Publish buyer-intent posts', 'Refresh internal links', 'Measure conversions'],
    '[{"table":"blogs","label":"blog posts"},{"table":"keyword_rankings","label":"keywords"},{"table":"blog_generation_queue","label":"queued posts"}]'::jsonb,
    ARRAY['seo-content-agent', 'growth-orchestrator']
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  route = EXCLUDED.route,
  owner_team = EXCLUDED.owner_team,
  revenue_motion = EXCLUDED.revenue_motion,
  description = EXCLUDED.description,
  setup_checklist = EXCLUDED.setup_checklist,
  signals = EXCLUDED.signals,
  agents = EXCLUDED.agents,
  updated_at = NOW();

INSERT INTO public.command_center_agent_memory (
  scope,
  app_id,
  agent_id,
  memory_type,
  title,
  content,
  confidence,
  metadata
) VALUES (
  'global',
  'nextbagchaser-core',
  'chief-orchestrator',
  'goal',
  'Commercial launch command objective',
  'Run every app from one command center, route AI agents through shared memory, and prioritize revenue readiness before scaling traffic.',
  0.95,
  '{"source":"migration"}'::jsonb
) ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.command_center_apps IS 'Registry of apps controlled by the NextBagChaser command center.';
COMMENT ON TABLE public.command_center_agent_runs IS 'Operator and AI initiated command-center tasks routed to agents.';
COMMENT ON TABLE public.command_center_agent_memory IS 'Shared durable memory for command-center agents and app decisions.';
COMMENT ON TABLE public.command_center_agent_handoffs IS 'Cross-agent handoffs created by command-center runs.';
COMMENT ON TABLE public.command_center_events IS 'Operational events emitted by command-center workflows.';
