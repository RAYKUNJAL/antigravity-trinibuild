import React, { useState, useEffect } from 'react';
import {
  Activity,
  Zap,
  TrendingUp,
  Settings,
  Globe,
  Code,
  Play,
  Pause,
  StopCircle,
  RefreshCw,
  Download,
  Check,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * TRINIBUILD ADMIN DASHBOARD
 * 
 * Complete control center for:
 * - AI Agent management (Paperclip agents)
 * - Domain options (trinibuild.com, custom domain, export code)
 * - Real-time metrics & analytics
 * - Website generation & deployment
 * - Outbound campaign tracking
 */

interface Agent {
  id: string;
  name: string;
  type: 'scraper' | 'generator' | 'outbound' | 'monitor' | 'optimizer' | 'expansion';
  status: 'idle' | 'running' | 'paused' | 'error';
  progress: number;
  itemsProcessed: number;
  lastRun?: string;
  nextRun?: string;
}

interface DashboardMetrics {
  totalStores: number;
  activeSubscriptions: number;
  mrr: number;
  conversionRate: number;
  emailOpenRate: number;
  whatsappOpenRate: number;
  avgGenerationTime: number;
}

export const AdminDashboard: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: '1',
      name: 'Business Scraper',
      type: 'scraper',
      status: 'running',
      progress: 65,
      itemsProcessed: 325,
      lastRun: '2 hours ago',
      nextRun: '4 hours',
    },
    {
      id: '2',
      name: 'Website Generator',
      type: 'generator',
      status: 'running',
      progress: 45,
      itemsProcessed: 142,
      lastRun: '45 minutes ago',
      nextRun: '2 hours',
    },
    {
      id: '3',
      name: 'Outbound Campaign',
      type: 'outbound',
      status: 'running',
      progress: 80,
      itemsProcessed: 589,
      lastRun: '20 minutes ago',
      nextRun: '4 hours',
    },
    {
      id: '4',
      name: 'Metrics Monitor',
      type: 'monitor',
      status: 'idle',
      progress: 100,
      itemsProcessed: 0,
      lastRun: '1 hour ago',
      nextRun: '1 hour',
    },
  ]);

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalStores: 1542,
    activeSubscriptions: 387,
    mrr: 285000,
    conversionRate: 24.5,
    emailOpenRate: 32,
    whatsappOpenRate: 65,
    avgGenerationTime: 42,
  });

  const [domainTab, setDomainTab] = useState<'trinibuild' | 'custom' | 'export'>(
    'trinibuild'
  );

  const handleAgentControl = (agentId: string, action: 'play' | 'pause' | 'stop') => {
    setAgents(
      agents.map((a) => {
        if (a.id === agentId) {
          return {
            ...a,
            status:
              action === 'play' ? 'running' : action === 'pause' ? 'paused' : 'idle',
          };
        }
        return a;
      })
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-800/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-light">TriniBuild Control Center</h1>
                <p className="text-sm text-slate-400">
                  Paperclip AI Agents • 24/7 Autonomous Scaling
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-700/30 border border-slate-600/50 rounded-lg px-4 py-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-light">All Systems Operational</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <MetricCard label="Total Stores" value={metrics.totalStores} icon={Globe} />
          <MetricCard
            label="Active Subscriptions"
            value={metrics.activeSubscriptions}
            icon={Check}
          />
          <MetricCard
            label="Monthly Revenue"
            value={`TT$${(metrics.mrr / 1000).toFixed(0)}K`}
            icon={TrendingUp}
          />
          <MetricCard
            label="Conversion Rate"
            value={`${metrics.conversionRate}%`}
            icon={Activity}
          />
          <MetricCard
            label="Email Open Rate"
            value={`${metrics.emailOpenRate}%`}
            icon={RefreshCw}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* AI Agents Control Panel */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-light flex items-center gap-3">
                  <Zap className="w-6 h-6 text-cyan-400" />
                  Paperclip AI Agents
                </h2>
                <div className="text-sm text-slate-400">6 agents running 24/7</div>
              </div>

              <div className="space-y-6">
                {agents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onControl={(action) => handleAgentControl(agent.id, action)}
                  />
                ))}
              </div>

              {/* Agent Summary */}
              <div className="mt-8 p-6 bg-slate-700/20 border border-slate-600/30 rounded-xl">
                <p className="text-sm text-slate-400">
                  🤖 <strong>Paperclip Agents Status:</strong> Running autonomously across all
                  regions. Scraper Agent found 847 new businesses this week. Generator Agent
                  created 312 websites. Outbound Agent sent 2,146 pitches with 32% open rate.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Domain Options Panel */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 sticky top-24"
            >
              <h2 className="text-2xl font-light flex items-center gap-3 mb-8">
                <Globe className="w-6 h-6 text-cyan-400" />
                Domain Options
              </h2>

              <div className="space-y-4">
                {/* Juvay.com */}
                <DomainOptionCard
                  title="TriniBuild Subdomain"
                  description="Free forever on our platform"
                  price="FREE"
                  active={domainTab === 'trinibuild'}
                  benefits={[
                    '✓ Professional branding',
                    '✓ Free updates & maintenance',
                    '✓ Built-in trust & credibility',
                    '✓ Analytics included',
                  ]}
                  onClick={() => setDomainTab('trinibuild')}
                />

                {/* Custom Domain */}
                <DomainOptionCard
                  title="Custom Domain"
                  description="We buy & manage for you"
                  price="TT$99/year"
                  active={domainTab === 'custom'}
                  benefits={[
                    '✓ Custom branded domain',
                    '✓ Auto-renewed annually',
                    '✓ Premium perception',
                    '✓ Full content ownership',
                  ]}
                  onClick={() => setDomainTab('custom')}
                  badge="POPULAR"
                />

                {/* Export Code */}
                <DomainOptionCard
                  title="Export Code"
                  description="Deploy on your server"
                  price="TT$199"
                  active={domainTab === 'export'}
                  benefits={[
                    '✓ Full React code provided',
                    '✓ Deploy anywhere',
                    '✓ Full customization',
                    '✓ Lifetime ownership',
                  ]}
                  onClick={() => setDomainTab('export')}
                  action={<Download className="w-4 h-4" />}
                />
              </div>

              {/* Domain Management Actions */}
              <div className="mt-8 pt-8 border-t border-slate-600/30">
                <h3 className="text-sm font-light uppercase tracking-wider text-slate-400 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <button className="w-full py-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition font-light">
                    ✓ Buy New Domain
                  </button>
                  <button className="w-full py-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 border border-slate-600/30 transition font-light">
                    📥 Export Website Code
                  </button>
                  <button className="w-full py-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 border border-slate-600/30 transition font-light">
                    🔗 Manage Domains
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Real-Time Agent Log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8"
        >
          <h3 className="text-xl font-light flex items-center gap-3 mb-6">
            <Activity className="w-5 h-5 text-cyan-400" />
            Real-Time Agent Activity
          </h3>

          <div className="space-y-3 font-mono text-sm text-slate-400">
            <AgentLog time="14:32" message="🔍 Scraper Agent: Discovered 12 new hair salons in San Fernando" status="success" />
            <AgentLog time="14:28" message="🎨 Generator Agent: Created website for Paradise Salons" status="success" />
            <AgentLog time="14:25" message="📧 Outbound Agent: Sent 47 emails (38% open rate)" status="success" />
            <AgentLog time="14:20" message="📊 Monitor Agent: MRR up 8% week-over-week. Conversion rate stable at 24.5%" status="success" />
            <AgentLog time="14:15" message="⚙️ Optimizer Agent: Subject line test completed. Winner: +3% CTR" status="success" />
            <AgentLog time="14:10" message="🌍 Expansion Agent: Jamaica market analysis complete. Ready to expand Q2." status="pending" />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

/**
 * Helper Components
 */

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

function MetricCard({ label, value, icon: Icon }: MetricCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 hover:border-cyan-500/30 transition"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-light text-slate-400 mb-2">{label}</p>
          <p className="text-2xl font-light text-white">{value}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
          {typeof Icon === 'function' ? <Icon className="w-5 h-5 text-cyan-400" /> : Icon}
        </div>
      </div>
    </motion.div>
  );
}

interface AgentCardProps {
  agent: Agent;
  onControl: (action: 'play' | 'pause' | 'stop') => void;
}

function AgentCard({ agent, onControl }: AgentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'paused':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-700/30 text-slate-400 border-slate-600/30';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor(agent.status)} transition`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-light">{agent.name}</h4>
          <p className="text-xs opacity-75 mt-1">
            Processed: {agent.itemsProcessed} items
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onControl('play')}
            className="p-1 hover:bg-white/10 rounded transition"
          >
            <Play className="w-4 h-4" />
          </button>
          <button
            onClick={() => onControl('pause')}
            className="p-1 hover:bg-white/10 rounded transition"
          >
            <Pause className="w-4 h-4" />
          </button>
          <button
            onClick={() => onControl('stop')}
            className="p-1 hover:bg-white/10 rounded transition"
          >
            <StopCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${agent.progress}%` }}
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
        />
      </div>

      <div className="flex items-center justify-between mt-3 text-xs opacity-75">
        <span>{agent.progress}% complete</span>
        <span>{agent.lastRun} • Next: {agent.nextRun}</span>
      </div>
    </div>
  );
}

interface DomainOptionCardProps {
  title: string;
  description: string;
  price: string;
  benefits: string[];
  active: boolean;
  badge?: string;
  action?: React.ReactNode;
  onClick: () => void;
}

function DomainOptionCard({
  title,
  description,
  price,
  benefits,
  active,
  badge,
  action,
  onClick,
}: DomainOptionCardProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg border transition ${
        active
          ? 'border-cyan-500/50 bg-cyan-500/10'
          : 'border-slate-600/30 bg-slate-700/20 hover:border-slate-500/50'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-light">{title}</h4>
          <p className="text-xs text-slate-400 mt-1">{description}</p>
        </div>
        {action}
      </div>

      <p className="text-sm font-light text-cyan-400 my-2">{price}</p>

      {badge && (
        <span className="inline-block text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded mb-2">
          {badge}
        </span>
      )}

      <div className="text-xs space-y-1 text-slate-400">
        {benefits.map((benefit, i) => (
          <p key={i}>{benefit}</p>
        ))}
      </div>
    </motion.button>
  );
}

interface AgentLogProps {
  time: string;
  message: string;
  status: 'success' | 'pending' | 'error';
}

function AgentLog({ time, message, status }: AgentLogProps) {
  const getStatusIcon = (s: string) => {
    switch (s) {
      case 'success':
        return '✅';
      case 'pending':
        return '⏳';
      case 'error':
        return '❌';
      default:
        return '○';
    }
  };

  return (
    <div className="flex gap-3 items-start py-2 border-b border-slate-700/20">
      <span className="text-slate-500 min-w-fit">{time}</span>
      <span>{getStatusIcon(status)}</span>
      <span className="flex-1">{message}</span>
    </div>
  );
}

export default AdminDashboard;
