import { supabase, isSupabaseConfigured } from './supabaseClient';
import PaperclipAgentOrchestrator from './paperclipAgentOrchestrator';
import { MemoryService } from './memoryService';
import { routeToLLM } from './llmRouter';

export type AppHealth = 'online' | 'attention' | 'setup_needed';
export type AgentStatus = 'active' | 'idle' | 'standby' | 'error';
export type BrainProvider = 'google-gemini' | 'paperclip' | 'manual';

export interface CommandCenterSignal {
  table: string;
  label: string;
  filter?: { column: string; value: string | number | boolean };
}

export interface CommandCenterApp {
  id: string;
  name: string;
  category: string;
  route: string;
  description: string;
  ownerTeam: string;
  revenueMotion: string;
  setupChecklist: string[];
  signals: CommandCenterSignal[];
  agents: string[];
}

export interface CommandCenterAppStatus extends CommandCenterApp {
  health: AppHealth;
  primaryCount: number;
  openIssues: number;
  signal: string;
  lastChecked: string;
}

export interface CommandCenterAgent {
  id: string;
  name: string;
  role: string;
  team: string;
  status: AgentStatus;
  brain: BrainProvider;
  mission: string;
  capabilities: string[];
  appIds: string[];
  talksTo: string[];
  lastActivity: string;
}

export interface AgentRun {
  id: string;
  agent_id: string;
  app_id: string;
  title: string;
  prompt: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  brain_provider: BrainProvider;
  model: string;
  plan: {
    summary: string;
    actions: string[];
    risks: string[];
    nextOwner: string;
  };
  handoff_agents: string[];
  created_at: string;
}

export interface SharedMemory {
  id: string;
  scope: 'global' | 'app' | 'agent' | 'customer';
  app_id?: string;
  agent_id?: string;
  memory_type: 'goal' | 'playbook' | 'decision' | 'learning' | 'risk';
  title: string;
  content: string;
  confidence: number;
  created_at: string;
}

export interface AgentHandoff {
  id: string;
  run_id?: string;
  from_agent: string;
  to_agent: string;
  app_id: string;
  status: 'open' | 'accepted' | 'resolved' | 'blocked';
  summary: string;
  created_at: string;
}

export interface CommandCenterSnapshot {
  apps: CommandCenterAppStatus[];
  agents: CommandCenterAgent[];
  runs: AgentRun[];
  memory: SharedMemory[];
  handoffs: AgentHandoff[];
  metrics: {
    appCount: number;
    onlineApps: number;
    attentionApps: number;
    activeAgents: number;
    openHandoffs: number;
    memoryItems: number;
  };
  storageMode: 'supabase' | 'local_fallback';
  lastUpdated: string;
}

export interface CreateAgentCommandInput {
  appId: string;
  agentId: string;
  title: string;
  prompt: string;
  useGoogleBrain: boolean;
}

const nowIso = () => new Date().toISOString();

export const COMMAND_CENTER_APPS: CommandCenterApp[] = [
  {
    id: 'nextbagchaser-core',
    name: 'NextBagChaser Core',
    category: 'Executive',
    route: '/dashboard/team',
    description: 'Central operating layer for every app, agent, runbook, and revenue workflow.',
    ownerTeam: 'AI Command',
    revenueMotion: 'Turns platform traffic, operators, and app telemetry into prioritized execution.',
    setupChecklist: ['Connect Supabase', 'Boot agent mesh', 'Review handoffs', 'Run daily standup'],
    signals: [
      { table: 'command_center_agent_runs', label: 'agent runs' },
      { table: 'command_center_agent_handoffs', label: 'handoffs', filter: { column: 'status', value: 'open' } }
    ],
    agents: ['chief-orchestrator', 'ops-controller', 'revenue-analyst']
  },
  {
    id: 'stores-marketplace',
    name: 'Stores & Marketplace',
    category: 'Commerce',
    route: '/stores',
    description: 'Storefronts, seller onboarding, listings, checkout, loyalty, and customer service.',
    ownerTeam: 'Store Growth',
    revenueMotion: 'Converts sellers to paid plans and shoppers to repeat buyers.',
    setupChecklist: ['Audit store creation', 'Check product imports', 'Review checkout', 'Route support tickets'],
    signals: [
      { table: 'stores', label: 'stores' },
      { table: 'products', label: 'products' },
      { table: 'orders', label: 'orders' }
    ],
    agents: ['store-growth-agent', 'support-agent', 'qa-release-agent']
  },
  {
    id: 'bidbinbuy',
    name: 'BidBinBuy',
    category: 'Commerce',
    route: '/admin/command-center/marketplace-monitor',
    description: 'Bin-store owner acquisition, scanner onboarding, shopper deals, and store routing.',
    ownerTeam: 'Bin Store Launch',
    revenueMotion: 'Sells store-owner SaaS and drives shoppers to participating bin stores.',
    setupChecklist: ['Verify scanner path', 'Review owner onboarding', 'Check pricing claims', 'Launch outreach queue'],
    signals: [
      { table: 'bin_store_accounts', label: 'bin stores' },
      { table: 'scanner_sessions', label: 'scanner sessions' },
      { table: 'outreach_leads', label: 'leads' }
    ],
    agents: ['bin-store-prospector', 'store-growth-agent', 'support-agent']
  },
  {
    id: 'traffic-cro',
    name: 'Traffic, CRO & Ads',
    category: 'Growth',
    route: '/admin/command-center/traffic-hub',
    description: 'Cold traffic, ad routing, landing-page conversion, analytics, and revenue experiments.',
    ownerTeam: 'Growth Command',
    revenueMotion: 'Finds traffic leaks and launches conversion fixes.',
    setupChecklist: ['Check analytics', 'Review campaign spend', 'Inspect top pages', 'Queue CRO experiments'],
    signals: [
      { table: 'page_views', label: 'page views' },
      { table: 'ad_campaigns', label: 'campaigns', filter: { column: 'status', value: 'active' } },
      { table: 'conversion_events', label: 'conversions' }
    ],
    agents: ['growth-orchestrator', 'ads-agent', 'revenue-analyst']
  },
  {
    id: 'seo-content',
    name: 'SEO & Blog Engine',
    category: 'Growth',
    route: '/blog',
    description: 'AI SEO content, keyword plans, programmatic pages, and organic traffic buildout.',
    ownerTeam: 'Content AI',
    revenueMotion: 'Compounds search traffic into store signups and qualified leads.',
    setupChecklist: ['Review keyword queue', 'Publish buyer-intent posts', 'Refresh internal links', 'Measure conversions'],
    signals: [
      { table: 'blogs', label: 'blog posts' },
      { table: 'keyword_rankings', label: 'keywords' },
      { table: 'blog_generation_queue', label: 'queued posts' }
    ],
    agents: ['seo-content-agent', 'growth-orchestrator']
  },
  {
    id: 'rideshare',
    name: 'Rideshare Fleet',
    category: 'Mobility',
    route: '/rides',
    description: 'Driver onboarding, rides, delivery routes, GPS tracking, and safety monitoring.',
    ownerTeam: 'Fleet Ops',
    revenueMotion: 'Activates drivers and turns local trips into service revenue.',
    setupChecklist: ['Check ride requests', 'Review driver funnel', 'Validate GPS', 'Resolve safety flags'],
    signals: [
      { table: 'rides', label: 'rides' },
      { table: 'driver_profiles', label: 'drivers' },
      { table: 'driver_locations', label: 'locations' }
    ],
    agents: ['fleet-agent', 'trust-safety-agent', 'ops-controller']
  },
  {
    id: 'jobs',
    name: 'Jobs Board',
    category: 'Marketplace',
    route: '/jobs',
    description: 'Job posts, candidate matching, employer acquisition, and document generation.',
    ownerTeam: 'Jobs Growth',
    revenueMotion: 'Converts employers, applicants, and document workflows.',
    setupChecklist: ['Review open jobs', 'Check employer leads', 'Generate content', 'Route support'],
    signals: [
      { table: 'jobs', label: 'jobs', filter: { column: 'is_active', value: true } },
      { table: 'job_applications', label: 'applications' }
    ],
    agents: ['jobs-agent', 'support-agent', 'seo-content-agent']
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    category: 'Marketplace',
    route: '/real-estate',
    description: 'Property listings, agent dashboards, seller flow, buyer matching, and lead capture.',
    ownerTeam: 'Property Ops',
    revenueMotion: 'Captures listing fees, agent subscriptions, and qualified buyer leads.',
    setupChecklist: ['Audit listings', 'Review agent onboarding', 'Check buyer leads', 'Refresh local pages'],
    signals: [
      { table: 'real_estate_listings', label: 'listings', filter: { column: 'status', value: 'active' } },
      { table: 'property_leads', label: 'property leads' }
    ],
    agents: ['property-agent', 'seo-content-agent', 'revenue-analyst']
  },
  {
    id: 'tickets-events',
    name: 'Tickets & Events',
    category: 'Marketplace',
    route: '/tickets',
    description: 'Event listings, promoter onboarding, ticket inventory, and scan/entry operations.',
    ownerTeam: 'Events Ops',
    revenueMotion: 'Sells tickets and promoter tools with measurable event demand.',
    setupChecklist: ['Review upcoming events', 'Check ticket scans', 'Verify promoter contracts', 'Queue event ads'],
    signals: [
      { table: 'events', label: 'events' },
      { table: 'tickets', label: 'tickets' },
      { table: 'ticket_scans', label: 'scans' }
    ],
    agents: ['events-agent', 'ads-agent', 'trust-safety-agent']
  },
  {
    id: 'support-messaging',
    name: 'Support & Messaging',
    category: 'Operations',
    route: '/admin/command-center/messaging-center',
    description: 'Customer service chatbot, store bots, email/SMS/WhatsApp queues, and escalations.',
    ownerTeam: 'Customer Ops',
    revenueMotion: 'Reduces churn, answers buyer questions, and saves owner onboarding time.',
    setupChecklist: ['Review message queues', 'Check chatbot failures', 'Escalate blockers', 'Refresh support docs'],
    signals: [
      { table: 'messages', label: 'messages' },
      { table: 'support_tickets', label: 'support tickets' },
      { table: 'email_queue', label: 'queued emails' }
    ],
    agents: ['support-agent', 'ops-controller', 'trust-safety-agent']
  },
  {
    id: 'finance-payouts',
    name: 'Finance & Payouts',
    category: 'Operations',
    route: '/admin/command-center/finance-and-payouts',
    description: 'Revenue, subscriptions, payouts, COD, invoices, taxes, and payment reconciliation.',
    ownerTeam: 'Finance Ops',
    revenueMotion: 'Protects cash collection and finds unpaid revenue.',
    setupChecklist: ['Review failed payments', 'Check payout queue', 'Audit COD orders', 'Update finance report'],
    signals: [
      { table: 'orders', label: 'orders' },
      { table: 'payments', label: 'payments' },
      { table: 'subscriptions', label: 'subscriptions' }
    ],
    agents: ['finance-agent', 'revenue-analyst', 'qa-release-agent']
  },
  {
    id: 'developer-ops',
    name: 'Developer Ops',
    category: 'System',
    route: '/admin/command-center/developer-tools',
    description: 'Deployments, database health, migrations, errors, security, backups, and release readiness.',
    ownerTeam: 'Platform Engineering',
    revenueMotion: 'Keeps every money-making flow stable under real traffic.',
    setupChecklist: ['Check build health', 'Review migrations', 'Scan critical errors', 'Open release tasks'],
    signals: [
      { table: 'site_alerts', label: 'site alerts', filter: { column: 'status', value: 'new' } },
      { table: 'build_logs', label: 'build logs' },
      { table: 'automation_logs', label: 'automation logs' }
    ],
    agents: ['devops-agent', 'qa-release-agent', 'trust-safety-agent']
  }
];

export const COMMAND_CENTER_AGENTS: CommandCenterAgent[] = [
  {
    id: 'chief-orchestrator',
    name: 'Chief Orchestrator',
    role: 'Executive routing',
    team: 'AI Command',
    status: 'active',
    brain: 'google-gemini',
    mission: 'Prioritize revenue work, assign agents, and keep every app moving toward launch readiness.',
    capabilities: ['daily standup', 'cross-app routing', 'handoff control', 'launch risk scoring'],
    appIds: ['nextbagchaser-core', 'developer-ops', 'traffic-cro'],
    talksTo: ['ops-controller', 'revenue-analyst', 'qa-release-agent'],
    lastActivity: nowIso()
  },
  {
    id: 'ops-controller',
    name: 'Ops Controller',
    role: 'Website operations',
    team: 'Operations',
    status: 'idle',
    brain: 'google-gemini',
    mission: 'Watch app health, route blockers, and make sure operators know the next action.',
    capabilities: ['runbook execution', 'incident triage', 'agent coordination', 'operator notes'],
    appIds: ['nextbagchaser-core', 'support-messaging', 'rideshare'],
    talksTo: ['chief-orchestrator', 'support-agent', 'devops-agent'],
    lastActivity: nowIso()
  },
  {
    id: 'growth-orchestrator',
    name: 'Growth Orchestrator',
    role: 'CRO and acquisition',
    team: 'Growth',
    status: 'active',
    brain: 'google-gemini',
    mission: 'Turn cold traffic into app signups by routing ads, SEO, email, and landing-page experiments.',
    capabilities: ['CRO backlog', 'funnel analysis', 'traffic allocation', 'offer testing'],
    appIds: ['traffic-cro', 'seo-content', 'stores-marketplace'],
    talksTo: ['ads-agent', 'seo-content-agent', 'revenue-analyst'],
    lastActivity: nowIso()
  },
  {
    id: 'bin-store-prospector',
    name: 'Bin Store Prospector',
    role: 'Lead discovery',
    team: 'Outbound',
    status: 'standby',
    brain: 'google-gemini',
    mission: 'Find bin stores and liquidation businesses using social channels, then queue outreach and onboarding.',
    capabilities: ['lead scoring', 'social profile review', 'outreach briefs', 'scanner onboarding routing'],
    appIds: ['bidbinbuy', 'stores-marketplace'],
    talksTo: ['store-growth-agent', 'support-agent', 'growth-orchestrator'],
    lastActivity: nowIso()
  },
  {
    id: 'store-growth-agent',
    name: 'Store Growth Agent',
    role: 'Seller success',
    team: 'Commerce',
    status: 'idle',
    brain: 'google-gemini',
    mission: 'Move store owners from signup to launched catalog, payments, customer support, and paid plan.',
    capabilities: ['seller onboarding', 'store QA', 'pricing prompts', 'launch checklist'],
    appIds: ['stores-marketplace', 'bidbinbuy'],
    talksTo: ['support-agent', 'qa-release-agent', 'finance-agent'],
    lastActivity: nowIso()
  },
  {
    id: 'support-agent',
    name: 'Support Agent',
    role: 'Customer service',
    team: 'Customer Ops',
    status: 'active',
    brain: 'google-gemini',
    mission: 'Handle shopper, seller, and app support with clear escalation paths and knowledge memory.',
    capabilities: ['chatbot QA', 'ticket triage', 'owner onboarding answers', 'support article suggestions'],
    appIds: ['support-messaging', 'stores-marketplace', 'bidbinbuy'],
    talksTo: ['ops-controller', 'trust-safety-agent', 'store-growth-agent'],
    lastActivity: nowIso()
  },
  {
    id: 'seo-content-agent',
    name: 'SEO Content Agent',
    role: 'Organic traffic',
    team: 'Growth',
    status: 'idle',
    brain: 'google-gemini',
    mission: 'Build AI SEO content around app categories, buyer questions, and local search demand.',
    capabilities: ['keyword clustering', 'blog briefs', 'internal linking', 'AEO snippets'],
    appIds: ['seo-content', 'jobs', 'real-estate', 'tickets-events'],
    talksTo: ['growth-orchestrator', 'ads-agent'],
    lastActivity: nowIso()
  },
  {
    id: 'ads-agent',
    name: 'Ads Agent',
    role: 'Paid acquisition',
    team: 'Growth',
    status: 'standby',
    brain: 'google-gemini',
    mission: 'Translate app priorities into ads, audiences, offers, and follow-up experiments.',
    capabilities: ['campaign QA', 'ad copy', 'audience routing', 'budget notes'],
    appIds: ['traffic-cro', 'tickets-events', 'stores-marketplace'],
    talksTo: ['growth-orchestrator', 'revenue-analyst'],
    lastActivity: nowIso()
  },
  {
    id: 'revenue-analyst',
    name: 'Revenue Analyst',
    role: 'Money metrics',
    team: 'Finance Ops',
    status: 'idle',
    brain: 'google-gemini',
    mission: 'Identify the highest-value work by revenue, payback, conversion, and retention impact.',
    capabilities: ['MRR checks', 'payout review', 'conversion math', 'forecast notes'],
    appIds: ['finance-payouts', 'traffic-cro', 'nextbagchaser-core'],
    talksTo: ['chief-orchestrator', 'finance-agent', 'growth-orchestrator'],
    lastActivity: nowIso()
  },
  {
    id: 'finance-agent',
    name: 'Finance Agent',
    role: 'Payments and payouts',
    team: 'Finance Ops',
    status: 'standby',
    brain: 'google-gemini',
    mission: 'Find failed payments, payout blockers, COD issues, tax gaps, and owner billing risks.',
    capabilities: ['payment audit', 'payout queue review', 'COD reconciliation', 'tax prompts'],
    appIds: ['finance-payouts', 'stores-marketplace'],
    talksTo: ['revenue-analyst', 'store-growth-agent'],
    lastActivity: nowIso()
  },
  {
    id: 'trust-safety-agent',
    name: 'Trust & Safety Agent',
    role: 'Risk control',
    team: 'Platform Safety',
    status: 'idle',
    brain: 'google-gemini',
    mission: 'Protect users, sellers, drivers, event operators, and marketplace quality.',
    capabilities: ['fraud signals', 'policy triage', 'review queues', 'incident notes'],
    appIds: ['rideshare', 'tickets-events', 'support-messaging', 'developer-ops'],
    talksTo: ['support-agent', 'qa-release-agent', 'devops-agent'],
    lastActivity: nowIso()
  },
  {
    id: 'qa-release-agent',
    name: 'QA Release Agent',
    role: 'Commercial readiness',
    team: 'Platform Engineering',
    status: 'active',
    brain: 'google-gemini',
    mission: 'Keep release checklists, regression risks, and app readiness visible before traffic increases.',
    capabilities: ['smoke tests', 'release notes', 'risk register', 'route coverage'],
    appIds: ['developer-ops', 'stores-marketplace', 'traffic-cro'],
    talksTo: ['devops-agent', 'chief-orchestrator', 'trust-safety-agent'],
    lastActivity: nowIso()
  },
  {
    id: 'devops-agent',
    name: 'DevOps Agent',
    role: 'Infrastructure',
    team: 'Platform Engineering',
    status: 'idle',
    brain: 'paperclip',
    mission: 'Track migrations, deployments, backups, service health, and self-hosted Supabase readiness.',
    capabilities: ['database migrations', 'deployment checks', 'backup prompts', 'infra health'],
    appIds: ['developer-ops', 'nextbagchaser-core'],
    talksTo: ['qa-release-agent', 'ops-controller', 'trust-safety-agent'],
    lastActivity: nowIso()
  }
];

const LOCAL_RUNS: AgentRun[] = [
  {
    id: 'local-standup',
    agent_id: 'chief-orchestrator',
    app_id: 'nextbagchaser-core',
    title: 'Daily commercial standup',
    prompt: 'Prioritize launch blockers across apps.',
    status: 'completed',
    brain_provider: 'manual',
    model: 'local-fallback',
    plan: {
      summary: 'Boot the team, check app health, then route growth, support, and release work by revenue impact.',
      actions: ['Review app readiness', 'Assign blocked flows', 'Check open handoffs'],
      risks: ['Supabase command tables may need migration', 'Some app tables may not exist yet'],
      nextOwner: 'chief-orchestrator'
    },
    handoff_agents: ['ops-controller', 'qa-release-agent', 'revenue-analyst'],
    created_at: nowIso()
  }
];

const LOCAL_MEMORY: SharedMemory[] = [
  {
    id: 'local-memory-1',
    scope: 'global',
    memory_type: 'goal',
    title: 'Commercial launch objective',
    content: 'Run every app from one command center, route agent work through shared memory, and prioritize revenue readiness.',
    confidence: 0.92,
    created_at: nowIso()
  }
];

function getFallbackHandoffs(): AgentHandoff[] {
  return COMMAND_CENTER_AGENTS.slice(0, 6).flatMap(agent =>
    agent.talksTo.slice(0, 1).map(target => ({
      id: `${agent.id}-${target}`,
      from_agent: agent.id,
      to_agent: target,
      app_id: agent.appIds[0],
      status: 'open' as const,
      summary: `${agent.name} shares priorities with ${target}.`,
      created_at: nowIso()
    }))
  );
}

async function safeCount(signal: CommandCenterSignal): Promise<{ count: number; ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { count: 0, ok: false, error: 'Supabase env vars are not configured' };
  }

  try {
    let query = supabase.from(signal.table).select('id', { count: 'exact', head: true });
    if (signal.filter) {
      query = query.eq(signal.filter.column, signal.filter.value);
    }

    const { count, error } = await query;
    if (error) {
      return { count: 0, ok: false, error: error.message };
    }

    return { count: count || 0, ok: true };
  } catch (error: any) {
    return { count: 0, ok: false, error: error.message };
  }
}

async function safeSelect<T>(table: string, columns = '*', limit = 10): Promise<{ rows: T[]; ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { rows: [], ok: false, error: 'Supabase env vars are not configured' };
  }

  try {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { rows: [], ok: false, error: error.message };
    }

    return { rows: (data || []) as T[], ok: true };
  } catch (error: any) {
    return { rows: [], ok: false, error: error.message };
  }
}

async function upsertAppRegistry(): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    await supabase.from('command_center_apps').upsert(
      COMMAND_CENTER_APPS.map(app => ({
        id: app.id,
        name: app.name,
        category: app.category,
        route: app.route,
        owner_team: app.ownerTeam,
        revenue_motion: app.revenueMotion,
        description: app.description,
        setup_checklist: app.setupChecklist,
        signals: app.signals,
        agents: app.agents,
        updated_at: nowIso()
      })),
      { onConflict: 'id' }
    );
  } catch (error) {
    console.warn('Command center app registry is using local fallback:', error);
  }
}

async function getAppStatuses(): Promise<{ apps: CommandCenterAppStatus[]; storageOk: boolean }> {
  const statuses = await Promise.all(
    COMMAND_CENTER_APPS.map(async app => {
      const results = await Promise.all(app.signals.map(safeCount));
      const firstOk = results.find(result => result.ok);
      const missingCount = results.filter(result => !result.ok).length;
      const total = results.reduce((sum, result) => sum + result.count, 0);
      const primaryCount = firstOk?.count || 0;
      const health: AppHealth = !firstOk ? 'setup_needed' : missingCount > 0 ? 'attention' : 'online';
      const signal =
        health === 'setup_needed'
          ? 'Needs schema or API access'
          : `${total.toLocaleString()} live records across ${app.signals.length - missingCount}/${app.signals.length} signals`;

      return {
        ...app,
        health,
        primaryCount,
        openIssues: missingCount,
        signal,
        lastChecked: nowIso()
      };
    })
  );

  return {
    apps: statuses,
    storageOk: statuses.some(app => app.health !== 'setup_needed')
  };
}

function getAgentList(): CommandCenterAgent[] {
  const paperclipAgents = PaperclipAgentOrchestrator.getAgents();
  const paperclipStatusByRole = new Map(
    paperclipAgents.map(agent => [agent.role, agent])
  );

  return COMMAND_CENTER_AGENTS.map(agent => {
    const paperclipAgent = Array.from(paperclipStatusByRole.values()).find(existing =>
      agent.capabilities.some(capability => existing.capabilities.includes(capability))
    );

    return {
      ...agent,
      status: paperclipAgent?.status || agent.status,
      lastActivity: paperclipAgent?.lastActivity || agent.lastActivity
    };
  });
}

function normalizeRun(row: any): AgentRun {
  return {
    id: row.id,
    agent_id: row.agent_id,
    app_id: row.app_id,
    title: row.title,
    prompt: row.prompt,
    status: row.status,
    brain_provider: row.brain_provider || 'manual',
    model: row.model || 'unknown',
    plan: row.plan || {
      summary: 'No plan saved yet.',
      actions: [],
      risks: [],
      nextOwner: row.agent_id
    },
    handoff_agents: row.handoff_agents || [],
    created_at: row.created_at
  };
}

function normalizeMemory(row: any): SharedMemory {
  return {
    id: row.id,
    scope: row.scope || 'global',
    app_id: row.app_id || undefined,
    agent_id: row.agent_id || undefined,
    memory_type: row.memory_type || 'decision',
    title: row.title,
    content: row.content,
    confidence: Number(row.confidence ?? 0.8),
    created_at: row.created_at
  };
}

function normalizeHandoff(row: any): AgentHandoff {
  return {
    id: row.id,
    run_id: row.run_id || undefined,
    from_agent: row.from_agent,
    to_agent: row.to_agent,
    app_id: row.app_id,
    status: row.status,
    summary: row.summary,
    created_at: row.created_at
  };
}

export async function getCommandCenterSnapshot(): Promise<CommandCenterSnapshot> {
  await upsertAppRegistry();

  const [{ apps, storageOk }, runsResult, memoryResult, handoffsResult] = await Promise.all([
    getAppStatuses(),
    safeSelect<any>('command_center_agent_runs', '*', 12),
    safeSelect<any>('command_center_agent_memory', '*', 12),
    safeSelect<any>('command_center_agent_handoffs', '*', 20)
  ]);

  const agents = getAgentList();
  const runs = runsResult.ok ? runsResult.rows.map(normalizeRun) : LOCAL_RUNS;
  const memory = memoryResult.ok ? memoryResult.rows.map(normalizeMemory) : LOCAL_MEMORY;
  const handoffs = handoffsResult.ok ? handoffsResult.rows.map(normalizeHandoff) : getFallbackHandoffs();
  const activeAgents = agents.filter(agent => agent.status === 'active').length;
  const onlineApps = apps.filter(app => app.health === 'online').length;
  const attentionApps = apps.filter(app => app.health !== 'online').length;

  return {
    apps,
    agents,
    runs,
    memory,
    handoffs,
    metrics: {
      appCount: apps.length,
      onlineApps,
      attentionApps,
      activeAgents,
      openHandoffs: handoffs.filter(handoff => handoff.status === 'open').length,
      memoryItems: memory.length
    },
    storageMode: storageOk && runsResult.ok && memoryResult.ok ? 'supabase' : 'local_fallback',
    lastUpdated: nowIso()
  };
}

export async function bootCommandCenterAgentTeam(): Promise<{
  success: boolean;
  agentCount: number;
  message: string;
}> {
  await upsertAppRegistry();

  if (PaperclipAgentOrchestrator.getAgents().length === 0) {
    const result = await PaperclipAgentOrchestrator.initialize({
      maxConcurrentAgents: 40,
      autoRecovery: true,
      loggingEnabled: true,
      metricsCollection: true
    });

    await MemoryService.logBuildActivity(
      'command-center',
      'AI command center boot requested from dashboard',
      result.success ? 'success' : 'warning',
      { agentCount: result.agentCount, error: result.error }
    );

    return {
      success: result.success,
      agentCount: result.agentCount,
      message: result.success
        ? `Paperclip team online with ${result.agentCount} core agents.`
        : result.error || 'Paperclip boot did not complete.'
    };
  }

  return {
    success: true,
    agentCount: PaperclipAgentOrchestrator.getAgents().length,
    message: 'Paperclip team is already online.'
  };
}

function fallbackPlan(input: CreateAgentCommandInput, app?: CommandCenterApp, agent?: CommandCenterAgent) {
  return {
    summary: `${agent?.name || input.agentId} queued a command for ${app?.name || input.appId}.`,
    actions: [
      'Check the selected app route and data signals.',
      'Write the next operator action into shared memory.',
      'Route follow-up handoffs to the connected agents.'
    ],
    risks: [
      'Gemini key or command-center tables may not be configured yet.',
      'Some app-specific tables may still need migrations on the self-hosted Supabase server.'
    ],
    nextOwner: agent?.id || input.agentId
  };
}

async function buildGooglePlan(input: CreateAgentCommandInput, app?: CommandCenterApp, agent?: CommandCenterAgent) {
  if (!input.useGoogleBrain) {
    return {
      plan: fallbackPlan(input, app, agent),
      model: 'manual',
      brainProvider: 'manual' as BrainProvider
    };
  }

  try {
    const response = await routeToLLM({
      task: 'analyze',
      preferredModel: 'GEMINI',
      maxTokens: 1200,
      prompt: `You are the Google Gemini brain for the NextBagChaser command center.

Return only JSON with this shape:
{
  "summary": "one sentence",
  "actions": ["3 to 5 concrete operator actions"],
  "risks": ["1 to 3 risks"],
  "nextOwner": "agent id"
}

App:
${JSON.stringify(app || { id: input.appId }, null, 2)}

Agent:
${JSON.stringify(agent || { id: input.agentId }, null, 2)}

Command title: ${input.title}
Command details: ${input.prompt}

Focus on revenue, launch readiness, support coverage, and routing work to other agents.`
    });

    const start = response.content.indexOf('{');
    const end = response.content.lastIndexOf('}');
    const parsed = start >= 0 && end >= 0 ? JSON.parse(response.content.slice(start, end + 1)) : null;

    return {
      plan: {
        summary: String(parsed?.summary || fallbackPlan(input, app, agent).summary),
        actions: Array.isArray(parsed?.actions) ? parsed.actions.slice(0, 5) : fallbackPlan(input, app, agent).actions,
        risks: Array.isArray(parsed?.risks) ? parsed.risks.slice(0, 3) : fallbackPlan(input, app, agent).risks,
        nextOwner: String(parsed?.nextOwner || agent?.id || input.agentId)
      },
      model: response.model,
      brainProvider: 'google-gemini' as BrainProvider
    };
  } catch (error) {
    console.warn('Google brain unavailable, using local plan:', error);
    return {
      plan: fallbackPlan(input, app, agent),
      model: 'local-fallback',
      brainProvider: 'manual' as BrainProvider
    };
  }
}

export async function createAgentCommand(input: CreateAgentCommandInput): Promise<{
  run: AgentRun;
  persisted: boolean;
}> {
  const app = COMMAND_CENTER_APPS.find(item => item.id === input.appId);
  const agent = COMMAND_CENTER_AGENTS.find(item => item.id === input.agentId);
  const { plan, model, brainProvider } = await buildGooglePlan(input, app, agent);
  const handoffAgents = agent?.talksTo || [];
  const createdAt = nowIso();

  const runPayload = {
    agent_id: input.agentId,
    app_id: input.appId,
    title: input.title,
    prompt: input.prompt,
    status: 'completed',
    brain_provider: brainProvider,
    model,
    plan,
    handoff_agents: handoffAgents,
    created_at: createdAt,
    updated_at: createdAt,
    completed_at: createdAt
  };

  let run: AgentRun = {
    id: `local-${Date.now()}`,
    ...runPayload,
    status: 'completed' as const
  };
  let persisted = false;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('command_center_agent_runs')
        .insert(runPayload)
        .select('*')
        .single();

      if (!error && data) {
        run = normalizeRun(data);
        persisted = true;

        await Promise.all([
          supabase.from('command_center_agent_memory').insert({
            scope: 'app',
            app_id: input.appId,
            agent_id: input.agentId,
            memory_type: 'decision',
            title: input.title,
            content: plan.summary,
            confidence: brainProvider === 'google-gemini' ? 0.9 : 0.72,
            metadata: { actions: plan.actions, risks: plan.risks, source_run_id: run.id }
          }),
          supabase.from('command_center_agent_handoffs').insert(
            handoffAgents.map(toAgent => ({
              run_id: run.id,
              from_agent: input.agentId,
              to_agent: toAgent,
              app_id: input.appId,
              status: 'open',
              summary: `${agent?.name || input.agentId} routed follow-up to ${toAgent}: ${plan.summary}`,
              payload: { actions: plan.actions, risks: plan.risks }
            }))
          )
        ]);
      }
    } catch (error) {
      console.warn('Command center run is using local fallback:', error);
    }
  }

  await MemoryService.logBuildActivity(
    input.agentId,
    `Command center run: ${input.title}`,
    'info',
    { appId: input.appId, model, persisted }
  );

  return { run, persisted };
}

export function getAgentForApp(appId: string): CommandCenterAgent[] {
  return COMMAND_CENTER_AGENTS.filter(agent => agent.appIds.includes(appId));
}

export function getAppById(appId: string): CommandCenterApp | undefined {
  return COMMAND_CENTER_APPS.find(app => app.id === appId);
}
