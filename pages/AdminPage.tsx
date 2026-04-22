/**
 * ADMIN DASHBOARD ROUTE
 * 
 * URL: /admin
 * 
 * Complete control center for:
 * - AI Agent management (Paperclip agents)
 * - Domain options (trinibuild.com, custom domain, export code)
 * - Real-time metrics & analytics
 * - Website generation & deployment
 * - Outbound campaign tracking
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDashboard from '../components/AdminDashboard';
import { runPaperclipAgents } from '../services/paperclipAgents';
import { fetchAdminDashboard, controlAIAgent, getDomainOptions } from '../services/adminDashboardController';
import { supabase } from '../services/supabaseClient';

interface AdminPageProps {
  user?: any;
}

export const AdminPage: React.FC<AdminPageProps> = ({ user }) => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [autoRunEnabled, setAutoRunEnabled] = useState(true);

  // Check authorization on mount
  useEffect(() => {
    checkAuthorization();
  }, []);

  // Auto-run Paperclip Agents every 6 hours
  useEffect(() => {
    if (!isAuthorized || !autoRunEnabled) return;

    const agentConfig = [
      {
        name: 'Business Scraper',
        type: 'scraper' as const,
        enabled: true,
        interval: 6 * 60 * 60 * 1000, // 6 hours
        config: { categories: ['hair salons', 'restaurants', 'retail', 'beauty', 'services'] },
        lastRun: undefined,
        nextRun: undefined,
        metrics: {
          itemsProcessed: 0,
          itemsSuccessful: 0,
          itemsFailed: 0,
          avgDuration: 0,
        },
      },
      {
        name: 'Website Generator',
        type: 'generator' as const,
        enabled: true,
        interval: 2 * 60 * 60 * 1000, // 2 hours
        config: {},
        lastRun: undefined,
        nextRun: undefined,
        metrics: {
          itemsProcessed: 0,
          itemsSuccessful: 0,
          itemsFailed: 0,
          avgDuration: 0,
        },
      },
      {
        name: 'Outbound Campaign',
        type: 'outbound' as const,
        enabled: true,
        interval: 4 * 60 * 60 * 1000, // 4 hours
        config: {},
        lastRun: undefined,
        nextRun: undefined,
        metrics: {
          itemsProcessed: 0,
          itemsSuccessful: 0,
          itemsFailed: 0,
          avgDuration: 0,
        },
      },
      {
        name: 'Metrics Monitor',
        type: 'monitor' as const,
        enabled: true,
        interval: 60 * 60 * 1000, // 1 hour
        config: {},
        lastRun: undefined,
        nextRun: undefined,
        metrics: {
          itemsProcessed: 0,
          itemsSuccessful: 0,
          itemsFailed: 0,
          avgDuration: 0,
        },
      },
      {
        name: 'Optimizer',
        type: 'optimizer' as const,
        enabled: true,
        interval: 24 * 60 * 60 * 1000, // 1 day
        config: {},
        lastRun: undefined,
        nextRun: undefined,
        metrics: {
          itemsProcessed: 0,
          itemsSuccessful: 0,
          itemsFailed: 0,
          avgDuration: 0,
        },
      },
      {
        name: 'Expansion',
        type: 'expansion' as const,
        enabled: true,
        interval: 7 * 24 * 60 * 60 * 1000, // 1 week
        config: {},
        lastRun: undefined,
        nextRun: undefined,
        metrics: {
          itemsProcessed: 0,
          itemsSuccessful: 0,
          itemsFailed: 0,
          avgDuration: 0,
        },
      },
    ];

    // Run agents
    const runAgents = async () => {
      try {
        await runPaperclipAgents(agentConfig as any);
        refreshDashboard();
      } catch (error) {
        console.error('Failed to run agents:', error);
      }
    };

    // Run immediately on first load
    runAgents();

    // Then run on interval
    const interval = setInterval(runAgents, 60 * 1000); // Check every minute if any agent should run

    return () => clearInterval(interval);
  }, [isAuthorized, autoRunEnabled]);

  // Fetch dashboard data
  useEffect(() => {
    if (!isAuthorized) return;

    const fetchData = async () => {
      try {
        const data = await fetchAdminDashboard();
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      }
    };

    // Fetch immediately and then every 30 seconds
    fetchData();
    const interval = setInterval(fetchData, 30 * 1000);

    return () => clearInterval(interval);
  }, [isAuthorized]);

  // Check if user is admin
  async function checkAuthorization() {
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Check if user is admin (in your admin list)
    const adminEmails = ['raykunjal@gmail.com', 'ray@trinibuild.com'];

    if (adminEmails.includes(currentUser.email)) {
      setIsAuthorized(true);
    } else {
      navigate('/unauthorized');
    }
  }

  async function refreshDashboard() {
    try {
      const data = await fetchAdminDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    }
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg">Loading admin console...</p>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
};

/**
 * SETUP INSTRUCTIONS
 * 
 * 1. Add to your App.tsx Router:
 * 
 * import { AdminPage } from './pages/AdminPage';
 * 
 * <Route path="/admin" element={<AdminPage />} />
 * 
 * 2. Protection: Only accessible to admins (hardcoded email list)
 * 
 * 3. Auto-scaling: Paperclip Agents run automatically on interval
 * 
 * 4. Domain system: trinibuild.com, custom-domain, export-code options
 * 
 * 5. All data stored in Supabase tables created by migration
 */

export default AdminPage;
