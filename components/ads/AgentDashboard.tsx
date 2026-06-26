// components/ads/AgentDashboard.tsx
// Shows the AI ad agent's activity: campaign analysis, recommended actions, weekly reports, T&T strategy.

import React, { useEffect, useState, useCallback } from 'react';
import {
  Bot, RefreshCw, Play, Check, Loader2, ChevronDown, ChevronUp,
  FileText, Lightbulb, AlertCircle, TrendingUp, TrendingDown, Pause, Bell
} from 'lucide-react';
import { adAgentService, type AgentAction } from '../../services/adAgentService';
import { supabase } from '../../services/supabaseClient';

interface CampaignLite {
  id: string;
  name: string;
  status: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions?: number;
}

const SAMPLE_CLIENTS = [
  'Massy Motors',
  'Republic Bank',
  'KFC Trinidad',
  'Petal Pushers',
  'Doubles King',
  'Island Threads'
];

function actionBadgeClasses(action: AgentAction['action']): string {
  switch (action) {
    case 'increase_budget':
    case 'resume_campaign':
      return 'bg-green-100 text-green-700';
    case 'decrease_budget':
      return 'bg-yellow-100 text-yellow-700';
    case 'pause_campaign':
      return 'bg-red-100 text-red-700';
    case 'alert':
      return 'bg-orange-100 text-orange-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function ActionIcon({ action }: { action: AgentAction['action'] }) {
  switch (action) {
    case 'increase_budget':
    case 'resume_campaign':
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    case 'decrease_budget':
      return <TrendingDown className="h-4 w-4 text-yellow-600" />;
    case 'pause_campaign':
      return <Pause className="h-4 w-4 text-red-600" />;
    case 'alert':
      return <Bell className="h-4 w-4 text-orange-600" />;
    default:
      return <Check className="h-4 w-4 text-gray-500" />;
  }
}

function timeAgo(date: Date | null): string {
  if (!date) return 'never';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) === 1 ? '' : 's'} ago`;
}

export function AgentDashboard() {
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  // Weekly report state
  const [selectedClient, setSelectedClient] = useState(SAMPLE_CLIENTS[0]);
  const [report, setReport] = useState<string>('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // T&T strategy state
  const [businessType, setBusinessType] = useState('');
  const [strategyGoal, setStrategyGoal] = useState('');
  const [strategy, setStrategy] = useState<string>('');
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [strategyExpanded, setStrategyExpanded] = useState(false);

  const loadCampaigns = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('ad_campaigns')
        .select('*')
        .eq('status', 'active');
      setCampaigns(data || []);
    } catch {
      // Supabase may not be configured — keep empty campaigns list
      setCampaigns([]);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adAgentService.analyzeAllCampaigns();
      setActions(result);
      setLastChecked(new Date());
    } catch (err) {
      console.error('Agent analysis failed:', err);
      setActions([]);
      setLastChecked(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  const applyAction = useCallback(async (action: AgentAction) => {
    setApplyingId(action.campaign_id);
    try {
      if (action.action === 'pause_campaign') {
        await supabase.from('ad_campaigns').update({ status: 'paused' }).eq('id', action.campaign_id);
      } else if (action.action === 'resume_campaign') {
        await supabase.from('ad_campaigns').update({ status: 'active' }).eq('id', action.campaign_id);
      } else if (action.action === 'increase_budget' || action.action === 'decrease_budget') {
        const campaign = campaigns.find(c => c.id === action.campaign_id);
        if (campaign) {
          const newBudget = Math.max(1, campaign.budget * (1 + (action.recommended_change || 0) / 100));
          await supabase.from('ad_campaigns').update({ budget: newBudget }).eq('id', action.campaign_id);
        }
      }
      await supabase.from('platform_events').insert({
        event_type: 'agent_action_applied',
        payload: {
          campaign_id: action.campaign_id,
          action: action.action,
          reason: action.reason,
          recommended_change: action.recommended_change,
          urgency: action.urgency,
          applied_at: new Date().toISOString()
        }
      });
      setAppliedIds(prev => new Set(prev).add(action.campaign_id));
      await loadCampaigns();
    } catch (err) {
      console.error('Failed to apply agent action:', err);
      alert('Failed to apply action. Please try again.');
    } finally {
      setApplyingId(null);
    }
  }, [campaigns, loadCampaigns]);

  const handleGenerateReport = useCallback(async () => {
    setReportLoading(true);
    setReportModalOpen(true);
    try {
      const result = await adAgentService.generateClientReport(selectedClient, campaigns.length ? campaigns : [
        { spent: 145.50, impressions: 24750, clicks: 890 }
      ]);
      setReport(result);
    } catch (err) {
      console.error('Report generation failed:', err);
      setReport('Report generation failed. Please try again.');
    } finally {
      setReportLoading(false);
    }
  }, [selectedClient, campaigns]);

  const handleGenerateStrategy = useCallback(async () => {
    if (!businessType.trim() || !strategyGoal.trim()) return;
    setStrategyLoading(true);
    setStrategyExpanded(true);
    try {
      const result = await adAgentService.generateTTStrategy(businessType, strategyGoal);
      setStrategy(result);
    } catch (err) {
      console.error('Strategy generation failed:', err);
      setStrategy('Strategy generation failed. Please try again.');
    } finally {
      setStrategyLoading(false);
    }
  }, [businessType, strategyGoal]);

  const activeActions = actions.filter(a => a.action !== 'no_action');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#101320] rounded-2xl border border-[#1E2235] p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="bg-gradient-to-br from-[#00B894] to-[#009071] p-3 rounded-xl">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                🤖 AI Ad Agent — Active
              </h2>
              <p className="text-sm text-[#A9B0C3]">
                Last checked: {timeAgo(lastChecked)}
              </p>
            </div>
          </div>
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="bg-[#00B894] hover:bg-[#009071] text-white px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Run Analysis Now
          </button>
        </div>
      </div>

      {/* Actions List */}
      <div className="bg-[#101320] rounded-2xl border border-[#1E2235] overflow-hidden">
        <div className="p-6 border-b border-[#1E2235]">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-[#00B894]" />
            Recommended Actions
            {activeActions.length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-[#00B894]/20 text-[#00B894]">
                {activeActions.length}
              </span>
            )}
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#00B894] mx-auto mb-3" />
            <p className="text-[#A9B0C3]">AI agent is analyzing campaigns...</p>
          </div>
        ) : activeActions.length === 0 ? (
          <div className="p-12 text-center">
            <Check className="h-10 w-10 text-green-500 mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">All clear!</p>
            <p className="text-[#A9B0C3] text-sm">
              {actions.length === 0
                ? 'Run analysis to get AI recommendations for your active campaigns.'
                : 'No actions needed — all campaigns are performing within normal range.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#1E2235]">
            {activeActions.map((action, idx) => {
              const campaign = campaigns.find(c => c.id === action.campaign_id);
              const campaignName = campaign?.name || `Campaign ${action.campaign_id.slice(0, 8)}`;
              const isApplied = appliedIds.has(action.campaign_id);
              const isApplying = applyingId === action.campaign_id;
              return (
                <div key={idx} className="p-5 hover:bg-[#0B0D14]/50 transition-colors">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h4 className="font-bold text-white">{campaignName}</h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${actionBadgeClasses(action.action)}`}>
                          <ActionIcon action={action.action} />
                          {action.action.replace(/_/g, ' ')}
                        </span>
                        {action.recommended_change && (
                          <span className="text-xs text-[#A9B0C3]">
                            ({action.recommended_change > 0 ? '+' : ''}{action.recommended_change}%)
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${action.urgency === 'high'
                          ? 'bg-red-500/20 text-red-400'
                          : action.urgency === 'medium'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-gray-500/20 text-gray-400'
                          }`}>
                          {action.urgency} urgency
                        </span>
                      </div>
                      <p className="text-sm text-[#A9B0C3]">{action.reason}</p>
                    </div>
                    <button
                      onClick={() => applyAction(action)}
                      disabled={isApplied || isApplying}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all ${
                        isApplied
                          ? 'bg-green-500/20 text-green-400 cursor-default'
                          : 'bg-[#00B894] hover:bg-[#009071] text-white'
                        } disabled:opacity-60`}
                    >
                      {isApplying ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isApplied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      {isApplied ? 'Applied' : 'Apply'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Weekly Report Section */}
      <div className="bg-[#101320] rounded-2xl border border-[#1E2235] p-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-[#00B894]" />
          Weekly Client Report
        </h3>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="bg-[#0B0D14] text-white px-4 py-2 rounded-lg border border-[#1E2235] text-sm flex-1 min-w-[200px]"
          >
            {SAMPLE_CLIENTS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={handleGenerateReport}
            disabled={reportLoading}
            className="bg-[#00B894] hover:bg-[#009071] text-white px-5 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {reportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Generate Client Report
          </button>
        </div>
      </div>

      {/* T&T Strategy Generator */}
      <div className="bg-[#101320] rounded-2xl border border-[#1E2235] p-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-[#00B894]" />
          T&T Strategy Generator
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-[#A9B0C3] mb-1">Business Type</label>
            <input
              type="text"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              placeholder="e.g. food, fashion, electronics"
              className="w-full bg-[#0B0D14] text-white px-4 py-2 rounded-lg border border-[#1E2235] text-sm focus:outline-none focus:border-[#00B894]"
            />
          </div>
          <div>
            <label className="block text-xs text-[#A9B0C3] mb-1">Goal</label>
            <input
              type="text"
              value={strategyGoal}
              onChange={(e) => setStrategyGoal(e.target.value)}
              placeholder="e.g. get 100 new customers in 30 days"
              className="w-full bg-[#0B0D14] text-white px-4 py-2 rounded-lg border border-[#1E2235] text-sm focus:outline-none focus:border-[#00B894]"
            />
          </div>
        </div>
        <button
          onClick={handleGenerateStrategy}
          disabled={strategyLoading || !businessType.trim() || !strategyGoal.trim()}
          className="bg-[#00B894] hover:bg-[#009071] text-white px-5 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {strategyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
          Generate Strategy
        </button>

        {strategy && (
          <div className="mt-4">
            <button
              onClick={() => setStrategyExpanded(!strategyExpanded)}
              className="flex items-center gap-2 text-sm text-[#A9B0C3] hover:text-white transition-colors"
            >
              {strategyExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {strategyExpanded ? 'Hide Strategy' : 'Show Strategy'}
            </button>
            {strategyExpanded && (
              <div className="mt-3 bg-[#0B0D14] rounded-lg border border-[#1E2235] p-4 max-h-[500px] overflow-y-auto">
                <pre className="text-sm text-[#A9B0C3] whitespace-pre-wrap font-sans">{strategy}</pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Report Modal */}
      {reportModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setReportModalOpen(false)}
        >
          <div
            className="bg-[#101320] rounded-2xl border border-[#1E2235] max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#1E2235] flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#00B894]" />
                Weekly Report — {selectedClient}
              </h3>
              <button
                onClick={() => setReportModalOpen(false)}
                className="text-[#A9B0C3] hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {reportLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-[#00B894] mx-auto mb-3" />
                  <p className="text-[#A9B0C3]">Generating report...</p>
                </div>
              ) : (
                <pre className="text-sm text-[#A9B0C3] whitespace-pre-wrap font-sans">{report}</pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
