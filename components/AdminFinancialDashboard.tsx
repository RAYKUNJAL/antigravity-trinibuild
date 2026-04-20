'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, AlertTriangle, CheckCircle,
  Clock, Users, CreditCard, Activity, Shield, Zap
} from 'lucide-react';

interface FinancialAccount {
  id: string;
  name: string;
  type: 'operating' | 'tax_reserve' | 'affiliate_payout' | 'driver_payout' | 'merchant_payout';
  balance: number;
  currency: 'TTD';
}

interface PendingAction {
  id: string;
  type: string;
  description: string;
  amount: number;
  status: 'pending' | 'approved' | 'executed';
  requiresApproval: boolean;
  createdAt: string;
}

interface ComplianceIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  actionRequired: string;
  deadline?: string;
}

interface RevenueMetrics {
  today: number;
  yesterday: number;
  thisWeek: number;
  thisMonth: number;
  distributed: {
    operating: number;
    taxReserve: number;
    affiliates: number;
    drivers: number;
  };
}

export default function AdminFinancialDashboard() {
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [complianceIssues, setComplianceIssues] = useState<ComplianceIssue[]>([]);
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    
    // TODO: Replace with actual Supabase queries
    setTimeout(() => {
      setAccounts([
        { id: '1', name: 'Operating Account', type: 'operating', balance: 45320, currency: 'TTD' },
        { id: '2', name: 'Tax Reserve', type: 'tax_reserve', balance: 18750, currency: 'TTD' },
        { id: '3', name: 'Affiliate Payouts', type: 'affiliate_payout', balance: 2400, currency: 'TTD' },
        { id: '4', name: 'Driver Payouts', type: 'driver_payout', balance: 5600, currency: 'TTD' },
        { id: '5', name: 'Merchant Payouts', type: 'merchant_payout', balance: 12800, currency: 'TTD' }
      ]);

      setPendingActions([
        {
          id: '1',
          type: 'distribute_revenue',
          description: 'Daily revenue distribution',
          amount: 1875,
          status: 'approved',
          requiresApproval: false,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          type: 'pay_tax',
          description: 'Schedule May 2026 VAT payment',
          amount: 13200,
          status: 'pending',
          requiresApproval: true,
          createdAt: new Date().toISOString()
        }
      ]);

      setComplianceIssues([
        {
          id: '1',
          severity: 'medium',
          type: 'tax_deadline',
          description: 'Tax payment due in 25 days',
          actionRequired: 'Prepare TTD $13,200 for BIR payment',
          deadline: '2026-05-15'
        }
      ]);

      setMetrics({
        today: 1875,
        yesterday: 2150,
        thisWeek: 12450,
        thisMonth: 48900,
        distributed: {
          operating: 34230,
          taxReserve: 14670,
          affiliates: 1200,
          drivers: 3400
        }
      });

      setLoading(false);
    }, 500);
  };

  const approveAction = async (actionId: string) => {
    // TODO: Implement approval logic
    setPendingActions(prev =>
      prev.map(a => a.id === actionId ? { ...a, status: 'approved' } : a)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-800 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-800 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-black text-white mb-2">
                🤖 AI Financial Agent
              </h1>
              <p className="text-gray-400">
                Autonomous money management - 24/7 monitoring
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-900/30 border-2 border-green-500 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-500 font-bold text-sm">ACTIVE</span>
            </div>
          </div>
        </motion.div>

        {/* Real-time Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <MetricCard
            icon={<Activity />}
            label="Today's Revenue"
            value={`TTD $${metrics?.today.toFixed(2)}`}
            change="-12.8% vs yesterday"
            trend="down"
            delay={0.1}
          />
          <MetricCard
            icon={<TrendingUp />}
            label="This Week"
            value={`TTD $${metrics?.thisWeek.toFixed(2)}`}
            change="+15.3% vs last week"
            trend="up"
            delay={0.2}
          />
          <MetricCard
            icon={<DollarSign />}
            label="This Month"
            value={`TTD $${metrics?.thisMonth.toFixed(2)}`}
            change="+28.5% vs last month"
            trend="up"
            delay={0.3}
          />
          <MetricCard
            icon={<Users />}
            label="Pending Actions"
            value={pendingActions.filter(a => a.status === 'pending').length.toString()}
            change="Require approval"
            trend="neutral"
            delay={0.4}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Account Balances */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 bg-gray-800 rounded-2xl border-2 border-gray-700 p-6"
          >
            <h2 className="text-2xl font-black text-white mb-6">
              💰 Account Balances
            </h2>

            <div className="space-y-4">
              {accounts.map((account, index) => (
                <AccountBalance
                  key={account.id}
                  account={account}
                  delay={0.6 + index * 0.1}
                />
              ))}
            </div>

            <div className="mt-6 pt-6 border-t-2 border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-white">
                  TOTAL PLATFORM BALANCE
                </span>
                <span className="text-2xl font-black text-green-500">
                  TTD ${accounts.reduce((sum, a) => sum + a.balance, 0).toFixed(2)}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Compliance Status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gray-800 rounded-2xl border-2 border-gray-700 p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <Shield className="text-blue-500" />
              <h2 className="text-2xl font-black text-white">
                Compliance
              </h2>
            </div>

            {complianceIssues.length === 0 ? (
              <div className="p-6 bg-green-900/20 border-2 border-green-500 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-500" size={24} />
                  <div>
                    <p className="font-bold text-green-500">All Clear</p>
                    <p className="text-sm text-green-400 mt-1">
                      No compliance issues detected
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {complianceIssues.map((issue, index) => (
                  <ComplianceCard
                    key={issue.id}
                    issue={issue}
                    delay={0.8 + index * 0.1}
                  />
                ))}
              </div>
            )}

            <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-300 mb-2">
                <strong>Next Tax Payment:</strong> May 15, 2026
              </p>
              <p className="text-xs text-gray-400">
                Amount: TTD $13,200.00 (25 days away)
              </p>
            </div>
          </motion.div>
        </div>

        {/* Pending Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-8 bg-gray-800 rounded-2xl border-2 border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Zap className="text-yellow-500" />
              <h2 className="text-2xl font-black text-white">
                AI Agent Actions
              </h2>
            </div>
            <div className="px-3 py-1 bg-yellow-900/30 border border-yellow-500 rounded-full">
              <span className="text-yellow-500 text-sm font-bold">
                {pendingActions.filter(a => a.status === 'pending').length} Pending
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {pendingActions.map((action, index) => (
              <ActionCard
                key={action.id}
                action={action}
                onApprove={approveAction}
                delay={1.0 + index * 0.1}
              />
            ))}
          </div>
        </motion.div>

        {/* Revenue Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="mt-8 bg-gradient-to-r from-red-900 to-red-800 rounded-2xl p-6 border-2 border-red-700"
        >
          <h2 className="text-2xl font-black text-white mb-4">
            📊 This Month's Distribution
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DistributionCard label="Operating" amount={metrics?.distributed.operating || 0} percent={70} />
            <DistributionCard label="Tax Reserve" amount={metrics?.distributed.taxReserve || 0} percent={30} />
            <DistributionCard label="Affiliates" amount={metrics?.distributed.affiliates || 0} percent={2.5} />
            <DistributionCard label="Drivers" amount={metrics?.distributed.drivers || 0} percent={7} />
          </div>
        </motion.div>

      </div>
    </div>
  );
}

// Metric Card
function MetricCard({ icon, label, value, change, trend, delay }: any) {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-gray-800 rounded-xl border-2 border-gray-700 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-gray-400">{icon}</div>
        <div className={`text-sm font-bold ${trendColors[trend]}`}>
          {change}
        </div>
      </div>
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-black text-white">{value}</p>
    </motion.div>
  );
}

// Account Balance
function AccountBalance({ account, delay }: { account: FinancialAccount; delay: number }) {
  const icons = {
    operating: '🏢',
    tax_reserve: '💰',
    affiliate_payout: '🤝',
    driver_payout: '🚗',
    merchant_payout: '🏪'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">{icons[account.type]}</span>
        <div>
          <p className="font-bold text-white">{account.name}</p>
          <p className="text-sm text-gray-400 capitalize">{account.type.replace('_', ' ')}</p>
        </div>
      </div>
      <p className="text-xl font-black text-green-500">
        ${account.balance.toFixed(2)}
      </p>
    </motion.div>
  );
}

// Compliance Card
function ComplianceCard({ issue, delay }: { issue: ComplianceIssue; delay: number }) {
  const severityColors = {
    low: 'bg-blue-900/20 border-blue-500 text-blue-500',
    medium: 'bg-yellow-900/20 border-yellow-500 text-yellow-500',
    high: 'bg-orange-900/20 border-orange-500 text-orange-500',
    critical: 'bg-red-900/20 border-red-500 text-red-500'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={`p-4 rounded-lg border-2 ${severityColors[issue.severity]}`}
    >
      <div className="flex items-start gap-2 mb-2">
        <AlertTriangle size={20} />
        <div className="flex-1">
          <p className="font-bold text-sm uppercase mb-1">{issue.severity}</p>
          <p className="text-white text-sm">{issue.description}</p>
          <p className="text-xs text-gray-300 mt-2">{issue.actionRequired}</p>
        </div>
      </div>
    </motion.div>
  );
}

// Action Card
function ActionCard({ action, onApprove, delay }: any) {
  const statusColors = {
    pending: 'bg-yellow-900/20 border-yellow-500',
    approved: 'bg-green-900/20 border-green-500',
    executed: 'bg-blue-900/20 border-blue-500'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`p-4 rounded-lg border-2 ${statusColors[action.status]}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-gray-400" />
            <p className="text-xs text-gray-400">
              {new Date(action.createdAt).toLocaleString()}
            </p>
          </div>
          <p className="font-bold text-white mb-1">{action.description}</p>
          <p className="text-2xl font-black text-green-500">
            TTD ${action.amount.toFixed(2)}
          </p>
        </div>
        
        {action.status === 'pending' && action.requiresApproval && (
          <button
            onClick={() => onApprove(action.id)}
            className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
          >
            Approve
          </button>
        )}

        {action.status === 'approved' && (
          <div className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg">
            ✓ Approved
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Distribution Card
function DistributionCard({ label, amount, percent }: { label: string; amount: number; percent: number }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-lg p-4">
      <p className="text-sm text-red-200 mb-1">{label}</p>
      <p className="text-xl font-black text-white mb-1">${amount.toFixed(2)}</p>
      <p className="text-xs text-red-300">{percent}% of total</p>
    </div>
  );
}
