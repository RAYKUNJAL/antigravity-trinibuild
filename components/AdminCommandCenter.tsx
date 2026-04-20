'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Shield,
  TrendingUp,
  Users,
  DollarSign,
  Zap,
  MessageSquare,
  BarChart3,
  Target,
  AlertCircle,
  CheckCircle2,
  Clock,
  Activity,
  Database,
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'working';
  tasksCompleted: number;
  currentTask: string | null;
  performance: number;
  icon: any;
  specialty: string;
}

export default function AdminCommandCenter() {
  const [revenueGoal] = useState(2500000); // $2.5M goal
  const [currentRevenue, setCurrentRevenue] = useState(47250);
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: '1',
      name: 'Master Orchestrator',
      role: 'Strategic Planning',
      status: 'active',
      tasksCompleted: 342,
      currentTask: 'Analyzing Q2 growth opportunities',
      performance: 97,
      icon: Brain,
      specialty: 'Coordinates all agents, sets priorities',
    },
    {
      id: '2',
      name: 'Security Guardian',
      role: 'Platform Security',
      status: 'active',
      tasksCompleted: 1247,
      currentTask: 'Monitoring transaction patterns',
      performance: 99,
      icon: Shield,
      specialty: 'Fraud detection, compliance, data protection',
    },
    {
      id: '3',
      name: 'Performance Monitor',
      role: 'System Optimization',
      status: 'working',
      tasksCompleted: 892,
      currentTask: 'Optimizing checkout flow conversion',
      performance: 94,
      icon: Activity,
      specialty: 'Site speed, uptime, conversion optimization',
    },
    {
      id: '4',
      name: 'Product Agent',
      role: 'Product Strategy',
      status: 'active',
      tasksCompleted: 567,
      currentTask: 'Analyzing new template performance',
      performance: 91,
      icon: Target,
      specialty: 'Feature prioritization, user feedback',
    },
    {
      id: '5',
      name: 'Dev Agent',
      role: 'Development',
      status: 'working',
      tasksCompleted: 1543,
      currentTask: 'Building mobile app notification system',
      performance: 96,
      icon: Zap,
      specialty: 'Code generation, bug fixes, deployment',
    },
    {
      id: '6',
      name: 'QA Lead',
      role: 'Quality Assurance',
      status: 'active',
      tasksCompleted: 2134,
      currentTask: 'Testing payment gateway integration',
      performance: 98,
      icon: CheckCircle2,
      specialty: 'Automated testing, quality metrics',
    },
    {
      id: '7',
      name: 'Content Agent',
      role: 'Marketing & Content',
      status: 'working',
      tasksCompleted: 678,
      currentTask: 'Writing blog post: "Trinidad E-commerce Trends 2026"',
      performance: 92,
      icon: MessageSquare,
      specialty: 'SEO, social media, email campaigns',
    },
    {
      id: '8',
      name: 'Growth Agent',
      role: 'Revenue Optimization',
      status: 'active',
      tasksCompleted: 445,
      currentTask: 'A/B testing pricing strategies',
      performance: 95,
      icon: TrendingUp,
      specialty: 'CRO, pricing, upsells, retention',
    },
    {
      id: '9',
      name: 'Support Agent',
      role: 'Customer Success',
      status: 'active',
      tasksCompleted: 3421,
      currentTask: 'Responding to 12 merchant inquiries',
      performance: 96,
      icon: Users,
      specialty: '24/7 support, onboarding, training',
    },
    {
      id: '10',
      name: 'Data Analyst',
      role: 'Business Intelligence',
      status: 'working',
      tasksCompleted: 823,
      currentTask: 'Generating weekly revenue report',
      performance: 93,
      icon: BarChart3,
      specialty: 'Dashboards, forecasting, insights',
    },
  ]);

  const [metrics, setMetrics] = useState({
    activeStores: 234,
    totalTransactions: 12847,
    conversionRate: 3.8,
    averageOrderValue: 145.50,
    monthlyGrowth: 23.4,
    churnRate: 2.1,
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentRevenue(prev => prev + Math.random() * 100);
      setMetrics(prev => ({
        ...prev,
        activeStores: prev.activeStores + Math.floor(Math.random() * 2),
        totalTransactions: prev.totalTransactions + Math.floor(Math.random() * 5),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const progressToGoal = (currentRevenue / revenueGoal) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-trini-black to-gray-900 text-white p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-black font-inter mb-2 bg-gradient-to-r from-trini-gold via-yellow-300 to-trini-gold bg-clip-text text-transparent">
          TriniBuild Command Center
        </h1>
        <p className="text-gray-400 font-inter">
          Real-time platform oversight • All agents operational
        </p>
      </motion.div>

      {/* Revenue Goal Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-trini-red to-red-900 rounded-3xl p-8 mb-8 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-white/80 font-inter mb-1">Year One Revenue Goal</p>
            <h2 className="text-5xl font-black font-inter">
              ${revenueGoal.toLocaleString()}
            </h2>
          </div>
          <DollarSign className="w-16 h-16 text-trini-gold" />
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-inter">Current: ${currentRevenue.toLocaleString()}</span>
            <span className="font-inter font-bold">{progressToGoal.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressToGoal}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-trini-gold to-yellow-400 rounded-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-white/60 text-sm font-inter mb-1">To Goal</p>
            <p className="text-2xl font-black font-inter">
              ${(revenueGoal - currentRevenue).toLocaleString()}
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-white/60 text-sm font-inter mb-1">Monthly Needed</p>
            <p className="text-2xl font-black font-inter">
              ${Math.round((revenueGoal - currentRevenue) / 10).toLocaleString()}
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-white/60 text-sm font-inter mb-1">Growth Rate</p>
            <p className="text-2xl font-black font-inter text-green-400">
              +{metrics.monthlyGrowth}%
            </p>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Active Stores', value: metrics.activeStores, icon: Users, color: 'from-blue-500 to-blue-700' },
          { label: 'Total Transactions', value: metrics.totalTransactions.toLocaleString(), icon: BarChart3, color: 'from-green-500 to-green-700' },
          { label: 'Conversion Rate', value: `${metrics.conversionRate}%`, icon: TrendingUp, color: 'from-purple-500 to-purple-700' },
          { label: 'Avg Order Value', value: `$${metrics.averageOrderValue}`, icon: DollarSign, color: 'from-yellow-500 to-yellow-700' },
          { label: 'Monthly Growth', value: `+${metrics.monthlyGrowth}%`, icon: Activity, color: 'from-emerald-500 to-emerald-700' },
          { label: 'Churn Rate', value: `${metrics.churnRate}%`, icon: AlertCircle, color: 'from-red-500 to-red-700' },
        ].map((metric, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-gray-800 rounded-2xl p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <metric.icon className="w-8 h-8 text-gray-400" />
              <div className={`w-12 h-12 bg-gradient-to-br ${metric.color} rounded-full flex items-center justify-center`}>
                <span className="text-xl font-black text-white">i</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm font-inter mb-1">{metric.label}</p>
            <p className="text-3xl font-black font-inter">{metric.value}</p>
          </motion.div>
        ))}
      </div>

      {/* AI Agents Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-black font-inter mb-4 flex items-center gap-2">
          <Brain className="w-8 h-8 text-trini-gold" />
          Paperclip AI Agent Team
        </h2>
        <p className="text-gray-400 font-inter mb-6">
          10 autonomous agents working 24/7 to scale TriniBuild to $2.5M
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {agents.map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-trini-gold transition-all"
            >
              {/* Status Indicator */}
              <div className="flex items-center justify-between mb-3">
                <div className={`w-3 h-3 rounded-full ${
                  agent.status === 'active' ? 'bg-green-500 animate-pulse' :
                  agent.status === 'working' ? 'bg-yellow-500 animate-pulse' :
                  'bg-gray-500'
                }`} />
                <agent.icon className="w-6 h-6 text-trini-gold" />
              </div>

              {/* Agent Info */}
              <h3 className="text-lg font-black font-inter mb-1">{agent.name}</h3>
              <p className="text-gray-400 text-xs font-inter mb-3">{agent.role}</p>

              {/* Performance */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500 font-inter">Performance</span>
                  <span className="text-green-400 font-bold font-inter">{agent.performance}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                    style={{ width: `${agent.performance}%` }}
                  />
                </div>
              </div>

              {/* Current Task */}
              {agent.currentTask && (
                <div className="bg-gray-900 rounded-lg p-2 mb-3">
                  <p className="text-xs text-gray-400 font-inter flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {agent.currentTask}
                  </p>
                </div>
              )}

              {/* Stats */}
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 font-inter">Tasks Done</span>
                <span className="text-white font-bold font-inter">{agent.tasksCompleted}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* System Health */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-800 rounded-2xl p-6 border border-gray-700"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black font-inter flex items-center gap-2">
            <Database className="w-8 h-8 text-trini-gold" />
            System Status
          </h2>
          <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-bold font-inter flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            All Systems Operational
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'API Response Time', value: '47ms', status: 'excellent' },
            { label: 'Database Health', value: '100%', status: 'excellent' },
            { label: 'CDN Uptime', value: '99.99%', status: 'excellent' },
            { label: 'Error Rate', value: '0.01%', status: 'excellent' },
          ].map((stat, i) => (
            <div key={i} className="bg-gray-900 rounded-xl p-4">
              <p className="text-gray-400 text-sm font-inter mb-2">{stat.label}</p>
              <p className="text-2xl font-black font-inter text-green-400">{stat.value}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
