import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    Bot,
    Brain,
    Briefcase,
    Car,
    CheckCircle,
    Clock,
    Code,
    Database,
    DollarSign,
    ExternalLink,
    FileText,
    Home,
    Layers,
    Megaphone,
    MessageSquare,
    Network,
    Play,
    RefreshCw,
    Rocket,
    Search,
    ShieldCheck,
    ShoppingBag,
    Ticket,
    Users,
    Zap
} from 'lucide-react';
import {
    bootCommandCenterAgentTeam,
    createAgentCommand,
    getCommandCenterSnapshot,
    type AgentHandoff,
    type AgentRun,
    type CommandCenterAgent,
    type CommandCenterAppStatus,
    type CommandCenterSnapshot,
    type SharedMemory
} from '../../services/commandCenterService';

const healthStyles: Record<CommandCenterAppStatus['health'], string> = {
    online: 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300',
    attention: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300',
    setup_needed: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300'
};

const statusDotStyles: Record<CommandCenterAgent['status'], string> = {
    active: 'bg-green-500',
    idle: 'bg-blue-500',
    standby: 'bg-amber-500',
    error: 'bg-red-500'
};

const appIconMap: Record<string, React.ReactNode> = {
    'nextbagchaser-core': <Network className="h-5 w-5" />,
    'stores-marketplace': <ShoppingBag className="h-5 w-5" />,
    bidbinbuy: <ShoppingBag className="h-5 w-5" />,
    'traffic-cro': <Megaphone className="h-5 w-5" />,
    'seo-content': <FileText className="h-5 w-5" />,
    rideshare: <Car className="h-5 w-5" />,
    jobs: <Briefcase className="h-5 w-5" />,
    'real-estate': <Home className="h-5 w-5" />,
    'tickets-events': <Ticket className="h-5 w-5" />,
    'support-messaging': <MessageSquare className="h-5 w-5" />,
    'finance-payouts': <DollarSign className="h-5 w-5" />,
    'developer-ops': <Code className="h-5 w-5" />
};

const defaultCommand =
    'Review this app for launch blockers, route follow-up to the right agents, and return the highest-revenue next actions.';

function formatTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not recorded';
    return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

function getHealthLabel(health: CommandCenterAppStatus['health']) {
    if (health === 'setup_needed') return 'Setup needed';
    if (health === 'attention') return 'Needs attention';
    return 'Online';
}

const MetricCard: React.FC<{
    label: string;
    value: string | number;
    icon: React.ReactNode;
    tone: 'red' | 'green' | 'blue' | 'purple' | 'amber' | 'gray';
}> = ({ label, value, icon, tone }) => {
    const toneClasses = {
        red: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-300',
        green: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-300',
        blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300',
        purple: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300',
        amber: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300',
        gray: 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300'
    };

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                </div>
                <div className={`rounded-lg p-2 ${toneClasses[tone]}`}>{icon}</div>
            </div>
        </div>
    );
};

const AppStatusCard: React.FC<{
    app: CommandCenterAppStatus;
    selected: boolean;
    onSelect: (appId: string) => void;
}> = ({ app, selected, onSelect }) => (
    <button
        onClick={() => onSelect(app.id)}
        className={`w-full rounded-xl border p-4 text-left transition-all ${
            selected
                ? 'border-trini-red bg-red-50 shadow-sm dark:border-red-500 dark:bg-red-950/20'
                : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
        }`}
    >
        <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
                <div className="rounded-lg bg-gray-100 p-2 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                    {appIconMap[app.id] || <Layers className="h-5 w-5" />}
                </div>
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-gray-900 dark:text-white">{app.name}</h3>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                            {app.category}
                        </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{app.ownerTeam}</p>
                </div>
            </div>
            <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${healthStyles[app.health]}`}>
                {getHealthLabel(app.health)}
            </span>
        </div>
        <p className="mt-3 text-sm leading-5 text-gray-600 dark:text-gray-300">{app.description}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900/60">
                <p className="font-medium text-gray-500 dark:text-gray-400">Primary Signal</p>
                <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{app.primaryCount.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900/60">
                <p className="font-medium text-gray-500 dark:text-gray-400">Issues</p>
                <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{app.openIssues}</p>
            </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span className="truncate">{app.signal}</span>
            <ArrowRight className="h-4 w-4 shrink-0" />
        </div>
    </button>
);

const AgentCard: React.FC<{
    agent: CommandCenterAgent;
    selected: boolean;
    onSelect: (agentId: string) => void;
}> = ({ agent, selected, onSelect }) => (
    <button
        onClick={() => onSelect(agent.id)}
        className={`w-full rounded-xl border p-4 text-left transition-all ${
            selected
                ? 'border-trini-red bg-red-50 dark:border-red-500 dark:bg-red-950/20'
                : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
        }`}
    >
        <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
                <div className="rounded-lg bg-gray-100 p-2 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                    <Bot className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{agent.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{agent.role}</p>
                </div>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold capitalize text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                <span className={`h-2 w-2 rounded-full ${statusDotStyles[agent.status]}`} />
                {agent.status}
            </div>
        </div>
        <p className="mt-3 text-sm leading-5 text-gray-600 dark:text-gray-300">{agent.mission}</p>
        <div className="mt-4 flex flex-wrap gap-2">
            {agent.capabilities.slice(0, 3).map(capability => (
                <span
                    key={capability}
                    className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                >
                    {capability}
                </span>
            ))}
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
                <Brain className="h-3.5 w-3.5" />
                {agent.brain === 'google-gemini' ? 'Google Gemini' : agent.brain}
            </span>
            <span>{formatTime(agent.lastActivity)}</span>
        </div>
    </button>
);

const CommandForm: React.FC<{
    apps: CommandCenterAppStatus[];
    agents: CommandCenterAgent[];
    selectedAppId: string;
    selectedAgentId: string;
    running: boolean;
    onAppChange: (id: string) => void;
    onAgentChange: (id: string) => void;
    onRun: (title: string, prompt: string, useGoogleBrain: boolean) => Promise<void>;
}> = ({ apps, agents, selectedAppId, selectedAgentId, running, onAppChange, onAgentChange, onRun }) => {
    const [title, setTitle] = useState('Run launch-readiness pass');
    const [prompt, setPrompt] = useState(defaultCommand);
    const [useGoogleBrain, setUseGoogleBrain] = useState(true);

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Command Runner</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gemini routes work, Supabase stores the run, agents receive handoffs.</p>
                </div>
                <div className="rounded-lg bg-red-50 p-2 text-trini-red dark:bg-red-950/30">
                    <Play className="h-5 w-5" />
                </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">App</span>
                    <select
                        value={selectedAppId}
                        onChange={event => onAppChange(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-trini-red focus:outline-none focus:ring-2 focus:ring-red-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    >
                        {apps.map(app => (
                            <option key={app.id} value={app.id}>
                                {app.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Agent</span>
                    <select
                        value={selectedAgentId}
                        onChange={event => onAgentChange(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-trini-red focus:outline-none focus:ring-2 focus:ring-red-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    >
                        {agents.map(agent => (
                            <option key={agent.id} value={agent.id}>
                                {agent.name}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <label className="mt-4 block">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Run title</span>
                <input
                    value={title}
                    onChange={event => setTitle(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-trini-red focus:outline-none focus:ring-2 focus:ring-red-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
            </label>

            <label className="mt-4 block">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Command</span>
                <textarea
                    value={prompt}
                    onChange={event => setPrompt(event.target.value)}
                    rows={4}
                    className="mt-1 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm leading-6 text-gray-900 focus:border-trini-red focus:outline-none focus:ring-2 focus:ring-red-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
            </label>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                    <input
                        type="checkbox"
                        checked={useGoogleBrain}
                        onChange={event => setUseGoogleBrain(event.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-trini-red focus:ring-trini-red"
                    />
                    Use Google Gemini brain
                </label>
                <button
                    onClick={() => onRun(title, prompt, useGoogleBrain)}
                    disabled={running || !title.trim() || !prompt.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-trini-red px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {running ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    {running ? 'Running' : 'Run Command'}
                </button>
            </div>
        </div>
    );
};

const RunResult: React.FC<{ run: AgentRun | null; persisted: boolean | null }> = ({ run, persisted }) => {
    if (!run) return null;

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{run.title}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {run.model} · {persisted ? 'Saved to Supabase' : 'Local fallback'}
                    </p>
                </div>
                <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300">
                    {run.status}
                </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-gray-700 dark:text-gray-200">{run.plan.summary}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Actions</h3>
                    <ul className="mt-2 space-y-2">
                        {run.plan.actions.map(action => (
                            <li key={action} className="flex gap-2 text-sm text-gray-700 dark:text-gray-200">
                                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                                <span>{action}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Risks</h3>
                    <ul className="mt-2 space-y-2">
                        {run.plan.risks.map(risk => (
                            <li key={risk} className="flex gap-2 text-sm text-gray-700 dark:text-gray-200">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                                <span>{risk}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const MemoryPanel: React.FC<{ memory: SharedMemory[] }> = ({ memory }) => (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                <Database className="h-5 w-5 text-blue-500" />
                Shared Memory
            </h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {memory.slice(0, 6).map(item => (
                <div key={item.id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                            <p className="mt-1 text-sm leading-5 text-gray-600 dark:text-gray-300">{item.content}</p>
                        </div>
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-semibold capitalize text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                            {item.memory_type}
                        </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{item.scope}</span>
                        <span>{Math.round(item.confidence * 100)}% confidence</span>
                    </div>
                </div>
            ))}
            {memory.length === 0 && (
                <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">No shared memory yet.</div>
            )}
        </div>
    </div>
);

const HandoffPanel: React.FC<{
    handoffs: AgentHandoff[];
    agentsById: Map<string, CommandCenterAgent>;
}> = ({ handoffs, agentsById }) => (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                <Network className="h-5 w-5 text-purple-500" />
                Agent Handoffs
            </h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {handoffs.slice(0, 8).map(handoff => (
                <div key={handoff.id} className="p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                        <span>{agentsById.get(handoff.from_agent)?.name || handoff.from_agent}</span>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                        <span>{agentsById.get(handoff.to_agent)?.name || handoff.to_agent}</span>
                    </div>
                    <p className="mt-2 text-sm leading-5 text-gray-600 dark:text-gray-300">{handoff.summary}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span className="capitalize">{handoff.status}</span>
                        <span>{formatTime(handoff.created_at)}</span>
                    </div>
                </div>
            ))}
            {handoffs.length === 0 && (
                <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">No handoffs open.</div>
            )}
        </div>
    </div>
);

const RecentRunsPanel: React.FC<{
    runs: AgentRun[];
    agentsById: Map<string, CommandCenterAgent>;
}> = ({ runs, agentsById }) => (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                <Clock className="h-5 w-5 text-amber-500" />
                Recent Runs
            </h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {runs.slice(0, 6).map(run => (
                <div key={run.id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{run.title}</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {agentsById.get(run.agent_id)?.name || run.agent_id} · {run.model}
                            </p>
                        </div>
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-semibold capitalize text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                            {run.status}
                        </span>
                    </div>
                    <p className="mt-3 text-sm leading-5 text-gray-600 dark:text-gray-300">{run.plan.summary}</p>
                </div>
            ))}
            {runs.length === 0 && (
                <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">No runs have been created yet.</div>
            )}
        </div>
    </div>
);

export const TeamCommandCenter: React.FC = () => {
    const [snapshot, setSnapshot] = useState<CommandCenterSnapshot | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [booting, setBooting] = useState(false);
    const [running, setRunning] = useState(false);
    const [bootMessage, setBootMessage] = useState<string | null>(null);
    const [lastRun, setLastRun] = useState<AgentRun | null>(null);
    const [lastRunPersisted, setLastRunPersisted] = useState<boolean | null>(null);
    const [selectedAppId, setSelectedAppId] = useState('nextbagchaser-core');
    const [selectedAgentId, setSelectedAgentId] = useState('chief-orchestrator');
    const [searchTerm, setSearchTerm] = useState('');

    const loadSnapshot = useCallback(async (quiet = false) => {
        if (quiet) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const data = await getCommandCenterSnapshot();
            setSnapshot(data);
        } catch (error) {
            console.error('Failed to load command center snapshot:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadSnapshot();
    }, [loadSnapshot]);

    const apps = snapshot?.apps || [];
    const agents = snapshot?.agents || [];
    const selectedApp = apps.find(app => app.id === selectedAppId) || apps[0];
    const agentsForSelectedApp = useMemo(() => {
        const filtered = agents.filter(agent => agent.appIds.includes(selectedAppId));
        return filtered.length > 0 ? filtered : agents;
    }, [agents, selectedAppId]);

    useEffect(() => {
        if (agentsForSelectedApp.length > 0 && !agentsForSelectedApp.some(agent => agent.id === selectedAgentId)) {
            setSelectedAgentId(agentsForSelectedApp[0].id);
        }
    }, [agentsForSelectedApp, selectedAgentId]);

    const agentsById = useMemo(() => new Map(agents.map(agent => [agent.id, agent])), [agents]);
    const filteredApps = useMemo(() => {
        const normalized = searchTerm.trim().toLowerCase();
        if (!normalized) return apps;
        return apps.filter(app =>
            [app.name, app.category, app.ownerTeam, app.description, app.revenueMotion]
                .join(' ')
                .toLowerCase()
                .includes(normalized)
        );
    }, [apps, searchTerm]);

    const handleBootTeam = async () => {
        setBooting(true);
        setBootMessage(null);

        try {
            const result = await bootCommandCenterAgentTeam();
            setBootMessage(result.message);
            await loadSnapshot(true);
        } catch (error: any) {
            setBootMessage(error.message || 'Agent team boot failed.');
        } finally {
            setBooting(false);
        }
    };

    const handleRunCommand = async (title: string, prompt: string, useGoogleBrain: boolean) => {
        setRunning(true);

        try {
            const result = await createAgentCommand({
                appId: selectedAppId,
                agentId: selectedAgentId,
                title,
                prompt,
                useGoogleBrain
            });

            setLastRun(result.run);
            setLastRunPersisted(result.persisted);
            await loadSnapshot(true);
        } finally {
            setRunning(false);
        }
    };

    if (loading && !snapshot) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="mx-auto h-8 w-8 animate-spin text-trini-red" />
                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading command center...</p>
                </div>
            </div>
        );
    }

    if (!snapshot) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                Command center data is unavailable.
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="rounded-xl bg-gray-900 p-3 text-white dark:bg-gray-700">
                            <Network className="h-7 w-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Team Command Center</h1>
                            <p className="text-gray-500 dark:text-gray-400">
                                Run every app, route agent work, and keep shared memory in one place.
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                            Storage: {snapshot.storageMode === 'supabase' ? 'Supabase connected' : 'Local fallback'}
                        </span>
                        <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                            Updated {formatTime(snapshot.lastUpdated)}
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => loadSnapshot(true)}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button
                        onClick={handleBootTeam}
                        disabled={booting}
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                    >
                        {booting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                        Boot Team
                    </button>
                </div>
            </div>

            {bootMessage && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-medium text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300">
                    {bootMessage}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
                <MetricCard label="Apps" value={snapshot.metrics.appCount} icon={<Layers className="h-5 w-5" />} tone="gray" />
                <MetricCard label="Online" value={snapshot.metrics.onlineApps} icon={<CheckCircle className="h-5 w-5" />} tone="green" />
                <MetricCard label="Attention" value={snapshot.metrics.attentionApps} icon={<AlertTriangle className="h-5 w-5" />} tone="amber" />
                <MetricCard label="Active Agents" value={snapshot.metrics.activeAgents} icon={<Bot className="h-5 w-5" />} tone="blue" />
                <MetricCard label="Handoffs" value={snapshot.metrics.openHandoffs} icon={<Network className="h-5 w-5" />} tone="purple" />
                <MetricCard label="Memory" value={snapshot.metrics.memoryItems} icon={<Database className="h-5 w-5" />} tone="red" />
            </div>

            <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
                <div className="space-y-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <label className="relative block">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                value={searchTerm}
                                onChange={event => setSearchTerm(event.target.value)}
                                placeholder="Search apps..."
                                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 focus:border-trini-red focus:outline-none focus:ring-2 focus:ring-red-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            />
                        </label>
                    </div>
                    <div className="space-y-3">
                        {filteredApps.map(app => (
                            <AppStatusCard
                                key={app.id}
                                app={app}
                                selected={selectedApp?.id === app.id}
                                onSelect={setSelectedAppId}
                            />
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    {selectedApp && (
                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="rounded-xl bg-gray-100 p-3 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                                        {appIconMap[selectedApp.id] || <Layers className="h-6 w-6" />}
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedApp.name}</h2>
                                            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${healthStyles[selectedApp.health]}`}>
                                                {getHealthLabel(selectedApp.health)}
                                            </span>
                                        </div>
                                        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-300">
                                            {selectedApp.revenueMotion}
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    to={selectedApp.route}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
                                >
                                    Open App
                                    <ExternalLink className="h-4 w-4" />
                                </Link>
                            </div>
                            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                {selectedApp.setupChecklist.map(item => (
                                    <div key={item} className="rounded-lg bg-gray-50 p-3 text-sm font-medium text-gray-700 dark:bg-gray-900/60 dark:text-gray-200">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
                        <div className="space-y-6">
                            <CommandForm
                                apps={apps}
                                agents={agentsForSelectedApp}
                                selectedAppId={selectedAppId}
                                selectedAgentId={selectedAgentId}
                                running={running}
                                onAppChange={setSelectedAppId}
                                onAgentChange={setSelectedAgentId}
                                onRun={handleRunCommand}
                            />
                            <RunResult run={lastRun} persisted={lastRunPersisted} />
                            <div className="grid gap-4 lg:grid-cols-2">
                                {agentsForSelectedApp.map(agent => (
                                    <AgentCard
                                        key={agent.id}
                                        agent={agent}
                                        selected={agent.id === selectedAgentId}
                                        onSelect={setSelectedAgentId}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <MemoryPanel memory={snapshot.memory} />
                            <HandoffPanel handoffs={snapshot.handoffs} agentsById={agentsById} />
                            <RecentRunsPanel runs={snapshot.runs} agentsById={agentsById} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-green-500" />
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Control Plane Coverage</h2>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    {[
                        ['Apps', 'Registry, routes, signals, owner teams'],
                        ['Agents', 'Missions, Gemini brain, handoff graph'],
                        ['Memory', 'Goals, decisions, playbooks, risks'],
                        ['Runs', 'Operator commands, plans, routing history']
                    ].map(([title, detail]) => (
                        <div key={title} className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900/60">
                            <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{detail}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TeamCommandCenter;
