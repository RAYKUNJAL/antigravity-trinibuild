import React, { useState, useEffect } from 'react';
import { TrendingDown, DollarSign, Zap, BarChart3, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCostMetrics, getRoutingRecommendations } from '../services/llmModelRouter';

/**
 * LLM COST TRACKING DASHBOARD
 * 
 * Real-time visualization of:
 * - Total tokens used
 * - Total costs (TTD)
 * - Cost breakdown by model
 * - Cost breakdown by task type
 * - Potential savings with better routing
 * - Daily cost trends
 */

interface CostMetrics {
  totalTokens: number;
  totalCostTTD: number;
  totalTasks: number;
  avgResponseTime: number;
  byModel: Record<
    string,
    { tasks: number; tokens: number; cost: number; avgResponseTime: number }
  >;
  byTask: Record<string, { tasks: number; tokens: number; cost: number }>;
  dailyTrend: Array<{ date: string; cost: number; tokens: number; tasks: number }>;
  potentialSavings: number;
}

export const LLMCostDashboard: React.FC<{ period?: 30 | 7 | 1 }> = ({
  period = 30,
}) => {
  const [metrics, setMetrics] = useState<CostMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommendations] = useState(getRoutingRecommendations());

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      const data = await getCostMetrics(period);
      setMetrics(data);
      setLoading(false);
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [period]);

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading cost metrics...</div>
      </div>
    );
  }

  const costSavingsPercent = Math.round(
    (metrics.potentialSavings / metrics.totalCostTTD) * 100
  );

  return (
    <div className="w-full space-y-6 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">LLM Cost Dashboard</h1>
        <p className="text-gray-400">
          Real-time tracking of AI token usage and cost optimization
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          icon={DollarSign}
          label="Total Cost"
          value={`TT$${metrics.totalCostTTD.toFixed(2)}`}
          subtext={`${metrics.totalTokens.toLocaleString()} tokens`}
          color="from-blue-500 to-blue-600"
        />
        <MetricCard
          icon={TrendingDown}
          label="Potential Savings"
          value={`TT$${metrics.potentialSavings.toFixed(2)}`}
          subtext={`${costSavingsPercent}% reduction possible`}
          color="from-green-500 to-green-600"
          highlight={true}
        />
        <MetricCard
          icon={Zap}
          label="Tasks Processed"
          value={metrics.totalTasks.toLocaleString()}
          subtext={`${(metrics.avgResponseTime / 1000).toFixed(1)}s avg time`}
          color="from-purple-500 to-purple-600"
        />
        <MetricCard
          icon={BarChart3}
          label="Daily Average"
          value={`TT$${(metrics.totalCostTTD / period).toFixed(2)}`}
          subtext={`per day`}
          color="from-orange-500 to-orange-600"
        />
      </div>

      {/* Cost Breakdown by Model */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CostByModelCard metrics={metrics} />
        <CostByTaskCard metrics={metrics} />
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <RecommendationsCard recommendations={recommendations} />
      )}

      {/* Daily Trend */}
      {metrics.dailyTrend.length > 0 && (
        <DailyTrendCard dailyTrend={metrics.dailyTrend} />
      )}

      {/* Savings Opportunity Alert */}
      {costSavingsPercent > 10 && (
        <AlertCard
          title="Significant Savings Opportunity"
          message={`You could save TT$${metrics.potentialSavings.toFixed(2)} (${costSavingsPercent}%) by using cheaper models for certain tasks.`}
          action="View Recommendations"
        />
      )}
    </div>
  );
};

/**
 * METRIC CARD COMPONENT
 */
interface MetricCardProps {
  icon: any;
  label: string;
  value: string;
  subtext?: string;
  color: string;
  highlight?: boolean;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  subtext,
  color,
  highlight,
}: MetricCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`bg-gradient-to-br ${color} p-6 rounded-lg text-white ${
        highlight ? 'ring-2 ring-yellow-400' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm opacity-90">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <Icon className="w-8 h-8 opacity-50" />
      </div>
      {subtext && <p className="text-xs opacity-75">{subtext}</p>}
    </motion.div>
  );
}

/**
 * COST BY MODEL BREAKDOWN
 */
function CostByModelCard({ metrics }: { metrics: CostMetrics }) {
  const models = Object.entries(metrics.byModel).sort((a, b) => b[1].cost - a[1].cost);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 border border-slate-700 rounded-lg p-6"
    >
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <Zap className="w-5 h-5 text-yellow-400" />
        Cost Breakdown by Model
      </h3>

      <div className="space-y-4">
        {models.map(([model, data]) => {
          const percentage = (data.cost / metrics.totalCostTTD) * 100;
          const modelColor =
            model === 'gpt-4o-mini'
              ? 'bg-green-500'
              : model === 'mixtral'
                ? 'bg-blue-500'
                : 'bg-purple-500';

          return (
            <div key={model} className="space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-white text-sm">{model}</p>
                  <p className="text-xs text-gray-400">
                    {data.tasks} tasks • {data.tokens.toLocaleString()} tokens
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">TT${data.cost.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">{percentage.toFixed(1)}%</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5 }}
                  className={`${modelColor} h-full`}
                />
              </div>

              {/* Response Time */}
              <p className="text-xs text-gray-500">
                ⏱️ Avg response time: {(data.avgResponseTime / 1000).toFixed(2)}s
              </p>
            </div>
          );
        })}
      </div>

      {/* Cost Comparison Note */}
      <div className="mt-6 p-4 bg-slate-700/50 rounded border border-slate-600">
        <p className="text-xs text-gray-300">
          💡 <strong>Tip:</strong> Use <span className="text-green-400">GPT-4o Mini</span>{' '}
          for simple tasks (97% cheaper) and{' '}
          <span className="text-blue-400">Mixtral</span> (Groq) for free tier tasks.
        </p>
      </div>
    </motion.div>
  );
}

/**
 * COST BY TASK BREAKDOWN
 */
function CostByTaskCard({ metrics }: { metrics: CostMetrics }) {
  const tasks = Object.entries(metrics.byTask).sort((a, b) => b[1].cost - a[1].cost);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 border border-slate-700 rounded-lg p-6"
    >
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-blue-400" />
        Cost Breakdown by Task
      </h3>

      <div className="space-y-4">
        {tasks.slice(0, 8).map(([task, data]) => {
          const percentage = (data.cost / metrics.totalCostTTD) * 100;

          return (
            <div key={task} className="flex justify-between items-center py-2 border-b border-slate-700">
              <div>
                <p className="font-semibold text-white text-sm">{task}</p>
                <p className="text-xs text-gray-400">{data.tasks} tasks</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-white">TT${data.cost.toFixed(2)}</p>
                <p className="text-xs text-gray-400">{percentage.toFixed(1)}%</p>
              </div>
            </div>
          );
        })}
      </div>

      {tasks.length > 8 && (
        <p className="text-xs text-gray-500 mt-4">
          + {tasks.length - 8} more task types
        </p>
      )}
    </motion.div>
  );
}

/**
 * RECOMMENDATIONS CARD
 */
function RecommendationsCard({
  recommendations,
}: {
  recommendations: Array<{
    taskType: string;
    currentModel: string;
    recommendedModel: string;
    potentialSavings: string;
  }>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/50 rounded-lg p-6"
    >
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-green-400" />
        Optimization Recommendations
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec, idx) => (
          <div
            key={idx}
            className="bg-slate-800/50 border border-slate-600 rounded p-4"
          >
            <div className="flex justify-between items-start mb-2">
              <p className="font-semibold text-white text-sm">{rec.taskType}</p>
              <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
                Save {rec.potentialSavings}
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-2">
              Current: <span className="text-gray-300">{rec.currentModel}</span>
            </p>
            <p className="text-xs text-gray-400">
              Recommended: <span className="text-green-400">{rec.recommendedModel}</span>
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/**
 * DAILY TREND CHART
 */
function DailyTrendCard({
  dailyTrend,
}: {
  dailyTrend: Array<{ date: string; cost: number; tokens: number; tasks: number }>;
}) {
  const maxCost = Math.max(...dailyTrend.map((d) => d.cost));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 border border-slate-700 rounded-lg p-6"
    >
      <h3 className="text-lg font-bold text-white mb-6">Daily Cost Trend</h3>

      <div className="space-y-4">
        {dailyTrend.slice(0, 14).map((day) => {
          const percentage = (day.cost / maxCost) * 100;

          return (
            <div key={day.date} className="space-y-1">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-300">{day.date}</p>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">TT${day.cost.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{day.tasks} tasks</p>
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5 }}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full"
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/**
 * ALERT CARD
 */
function AlertCard({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-amber-500/10 border-2 border-amber-500 rounded-lg p-6"
    >
      <div className="flex gap-4">
        <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h4 className="text-lg font-bold text-amber-200 mb-2">{title}</h4>
          <p className="text-amber-100 text-sm mb-4">{message}</p>
          {action && (
            <button className="px-4 py-2 bg-amber-500 text-black font-semibold rounded hover:bg-amber-400 transition text-sm">
              {action}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default LLMCostDashboard;
