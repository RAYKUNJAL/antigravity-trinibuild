/**
 * AGENT 9: AI Listing Dashboard
 * 
 * Main interface for managing AI-powered listings
 * - Connected store accounts
 * - Active listings with versions
 * - Batch job queue
 * - Analytics overview
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getLinkedAccounts } from '../services/storeOAuthService';
import { getUserBatchJobs } from '../services/batchProcessor';
import { supabase } from '../services/supabaseClient';
import StoreAccountConnect from '../components/StoreAccountConnect';
import BatchUploadCSV from '../components/BatchUploadCSV';
import ListingAnalytics from '../components/ListingAnalytics';

interface DashboardStats {
  totalListings: number;
  activeJobs: number;
  connectedStores: number;
  avgQualityScore: number;
}

export default function AIListingDashboard() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalListings: 0,
    activeJobs: 0,
    connectedStores: 0,
    avgQualityScore: 0,
  });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [batchJobs, setBatchJobs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'upload' | 'analytics'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }
      setUser(user);

      // Load accounts
      const linkedAccounts = await getLinkedAccounts(user.id);
      setAccounts(linkedAccounts);

      // Load batch jobs
      const jobs = await getUserBatchJobs(user.id);
      setBatchJobs(jobs);

      // Calculate stats
      const { data: listings } = await supabase
        .from('ai_listing_jobs')
        .select('*')
        .eq('user_id', user.id);

      const activeJobsCount = jobs.filter(j => j.status === 'processing').length;
      const avgQuality = listings && listings.length > 0
        ? listings.reduce((sum, l) => sum + (l.confidence_score || 0), 0) / listings.length
        : 0;

      setStats({
        totalListings: listings?.length || 0,
        activeJobs: activeJobsCount,
        connectedStores: linkedAccounts.length,
        avgQualityScore: Math.round(avgQuality * 100),
      });
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your AI dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Listing Dashboard
          </h1>
          <p className="text-gray-600">
            Professional AI-powered product listing optimization
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            label="Total Listings"
            value={stats.totalListings}
            icon="📦"
            color="blue"
          />
          <StatCard
            label="Active Jobs"
            value={stats.activeJobs}
            icon="⚡"
            color="purple"
          />
          <StatCard
            label="Connected Stores"
            value={stats.connectedStores}
            icon="🏪"
            color="green"
          />
          <StatCard
            label="Avg Quality Score"
            value={`${stats.avgQualityScore}%`}
            icon="⭐"
            color="yellow"
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <TabButton
                active={activeTab === 'overview'}
                onClick={() => setActiveTab('overview')}
                label="Overview"
              />
              <TabButton
                active={activeTab === 'upload'}
                onClick={() => setActiveTab('upload')}
                label="Batch Upload"
              />
              <TabButton
                active={activeTab === 'analytics'}
                onClick={() => setActiveTab('analytics')}
                label="Analytics"
              />
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <OverviewTab
                accounts={accounts}
                batchJobs={batchJobs}
                onRefresh={loadData}
              />
            )}
            {activeTab === 'upload' && (
              <BatchUploadCSV
                userId={user?.id}
                accounts={accounts}
                onComplete={loadData}
              />
            )}
            {activeTab === 'analytics' && (
              <ListingAnalytics userId={user?.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: any) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-gradient-to-br ${colorClasses[color]} text-white rounded-xl p-6 shadow-lg`}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-90">{label}</div>
    </motion.div>
  );
}

function TabButton({ active, onClick, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`
        py-4 px-1 border-b-2 font-medium text-sm transition-colors
        ${active
          ? 'border-purple-600 text-purple-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }
      `}
    >
      {label}
    </button>
  );
}

function OverviewTab({ accounts, batchJobs, onRefresh }: any) {
  return (
    <div className="space-y-8">
      {/* Connected Accounts */}
      <div>
        <h3 className="text-xl font-bold mb-4">Connected Stores</h3>
        {accounts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">No stores connected yet</p>
            <StoreAccountConnect onConnect={onRefresh} />
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account: any) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="font-medium">{account.store_name}</div>
                  <div className="text-sm text-gray-500">{account.platform}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    Active
                  </span>
                </div>
              </div>
            ))}
            <StoreAccountConnect onConnect={onRefresh} />
          </div>
        )}
      </div>

      {/* Recent Batch Jobs */}
      <div>
        <h3 className="text-xl font-bold mb-4">Recent Batch Jobs</h3>
        {batchJobs.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No batch jobs yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {batchJobs.slice(0, 5).map((job: any) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="font-medium">
                    {job.total_items} items
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(job.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    {job.processed_items}/{job.total_items} processed
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      job.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : job.status === 'processing'
                        ? 'bg-blue-100 text-blue-700'
                        : job.status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
