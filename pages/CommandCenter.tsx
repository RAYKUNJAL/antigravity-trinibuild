import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, ShoppingBag, Briefcase, Home, Ticket, Car,
    TrendingUp, RefreshCw, Activity, Bell, Zap, Shield, Target, Eye, Search, FileText
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { siteGuardian } from '../services/siteGuardianService';
import { authService } from '../services/authService';
import {
    AdminSidebar, AdminSection,
    TrafficHub, AdsEngine, ContentAICenter, UserManagement,
    TrustSafety, FinancePayouts, SystemHealth, DeveloperTools,
    MarketplaceMonitor, JobsMonitor, RealEstateMonitor, RideshareFleet,
    TicketsMonitor, ReportsAnalytics,
    MessagingCenter, Automations
} from '../components/admin';
import { KeywordDashboard } from './KeywordDashboard';

// ============================================
// TYPES
// ============================================

interface DashboardStats {
    users: { total: number; new_today: number; active: number };
    jobs: { total: number; open: number };
    properties: { total: number; active: number };
    events: { total: number; upcoming: number };
    revenue: { total: number; today: number };
    // Add other commercial stats if needed
}

interface HealthStatus {
    database: 'healthy' | 'degraded' | 'unhealthy';
    api: 'healthy' | 'degraded' | 'unhealthy';
    storage: 'healthy' | 'degraded' | 'unhealthy';
    aiServices: 'healthy' | 'degraded' | 'unhealthy';
}

// ============================================
// MAIN COMPONENT
// ============================================

const CommandCenter: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setIsLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];

            // Test database connection first
            const { getDatabaseHealth } = await import('../services/supabaseClient');
            const dbHealth = await getDatabaseHealth();

            console.log('📊 Database Health:', dbHealth);

            if (dbHealth.status === 'unhealthy') {
                console.error('❌ Database is unhealthy:', dbHealth.message);
                setStats({
                    users: { total: 0, new_today: 0, active: 0 },
                    jobs: { total: 0, open: 0 },
                    properties: { total: 0, active: 0 },
                    events: { total: 0, upcoming: 0 },
                    revenue: { total: 0, today: 0 }
                });
                setHealth({
                    database: 'unhealthy',
                    api: 'degraded',
                    storage: 'degraded',
                    aiServices: 'degraded'
                });
                setIsLoading(false);
                return;
            }

            const [usersData, jobsData, propertiesData, eventsData] = await Promise.all([
                supabase.from('profiles').select('id, created_at', { count: 'exact' }).then(res => {
                    if (res.error) console.error('Error fetching users:', res.error);
                    return res;
                }),
                supabase.from('jobs').select('id, status', { count: 'exact' }).then(res => {
                    if (res.error) console.error('Error fetching jobs:', res.error);
                    return res;
                }),
                supabase.from('real_estate_listings').select('id, status', { count: 'exact' }).then(res => {
                    if (res.error) console.error('Error fetching properties:', res.error);
                    return res;
                }),
                supabase.from('events').select('id, event_date', { count: 'exact' }).then(res => {
                    if (res.error) console.error('Error fetching events:', res.error);
                    return res;
                })
            ]);

            setStats({
                users: {
                    total: usersData.count || 0,
                    new_today: usersData.data?.filter(u => u.created_at?.startsWith(today)).length || 0,
                    active: Math.floor((usersData.count || 0) * 0.3)
                },
                jobs: {
                    total: jobsData.count || 0,
                    open: jobsData.data?.filter(j => j.status === 'open').length || 0
                },
                properties: {
                    total: propertiesData.count || 0,
                    active: propertiesData.data?.filter(p => p.status === 'active').length || 0
                },
                events: {
                    total: eventsData.count || 0,
                    upcoming: eventsData.data?.filter(e => new Date(e.event_date) > new Date()).length || 0
                },
                revenue: { total: 0, today: 0 }
            });

            const healthChecks = await siteGuardian.runHealthChecks();
            setHealth({
                database: dbHealth.status === 'healthy' ? 'healthy' : dbHealth.status === 'degraded' ? 'degraded' : 'unhealthy',
                api: healthChecks.find(h => h.id === 'api')?.status || 'healthy',
                storage: healthChecks.find(h => h.id === 'storage')?.status || 'healthy',
                aiServices: healthChecks.find(h => h.id === 'external')?.status || 'healthy'
            });

            const alertsData = await siteGuardian.getAlerts({ limit: 5 });
            setAlerts(alertsData);
        } catch (error: any) {
            console.error('❌ Error loading dashboard:', error);

            // Set error state
            setStats({
                users: { total: 0, new_today: 0, active: 0 },
                jobs: { total: 0, open: 0 },
                properties: { total: 0, active: 0 },
                events: { total: 0, upcoming: 0 },
                revenue: { total: 0, today: 0 }
            });

            setHealth({
                database: 'unhealthy',
                api: 'unhealthy',
                storage: 'unhealthy',
                aiServices: 'unhealthy'
            });

            // Create alert for the error
            setAlerts([{
                id: 'dashboard-error',
                type: 'error',
                title: 'Dashboard Load Failed',
                message: error.message || 'Unknown error occurred',
                timestamp: new Date().toISOString()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh] bg-transparent">
                <RefreshCw className="h-8 w-8 animate-spin text-trini-red" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {stats && (
                <OverviewSection stats={stats} health={health} alerts={alerts} onRefresh={loadDashboardData} />
            )}
        </div>
    );
};

// ============================================
// OVERVIEW SECTION
// ============================================

const OverviewSection: React.FC<{
    stats: DashboardStats;
    health: HealthStatus | null;
    alerts: any[];
    onRefresh: () => void;
}> = ({ stats, health, alerts, onRefresh }) => (
    <div className="space-y-8">
        {/* Database Error Banner */}
        {health?.database === 'unhealthy' && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-500/20 rounded-xl">
                        <Shield className="h-6 w-6 text-red-500" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-red-900 dark:text-red-200 text-lg mb-2">
                            🚨 Database Connection Failed
                        </h3>
                        <p className="text-red-800 dark:text-red-300 mb-4">
                            The admin dashboard cannot connect to the Supabase database. This is preventing all features from working.
                        </p>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Quick Fix Steps:</h4>
                            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                <li>Check your <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">.env.local</code> file exists</li>
                                <li>Verify <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">VITE_SUPABASE_URL</code> is set</li>
                                <li>Verify <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">VITE_SUPABASE_ANON_KEY</code> is set</li>
                                <li>Run the database setup script in Supabase SQL Editor:
                                    <br />
                                    <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs block mt-1">
                                        supabase/COMPLETE_DATABASE_SETUP.sql
                                    </code>
                                </li>
                                <li>Restart the dev server: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">npm run dev</code></li>
                            </ol>
                        </div>
                        <button
                            onClick={() => window.open('https://app.supabase.com/project/cdprbbyptjdntcrhmwxf', '_blank')}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                            Open Supabase Dashboard
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Degraded Database Warning */}
        {health?.database === 'degraded' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-500 rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-yellow-500/20 rounded-xl">
                        <Bell className="h-6 w-6 text-yellow-500" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-yellow-900 dark:text-yellow-200 text-lg mb-2">
                            ⚠️ Database Issues Detected
                        </h3>
                        <p className="text-yellow-800 dark:text-yellow-300 mb-4">
                            Some database tables are missing or not accessible. Some features may not work correctly.
                        </p>
                        <button
                            onClick={() => window.open('https://app.supabase.com/project/cdprbbyptjdntcrhmwxf', '_blank')}
                            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                        >
                            Check Database Setup
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Command Center</h1>
                <p className="text-gray-500">TriniBuild AI OS v2.0</p>
            </div>
            <button onClick={onRefresh} title="Refresh Dashboard" aria-label="Refresh Dashboard" className="p-2 text-gray-500 hover:text-trini-red">
                <RefreshCw className="h-5 w-5" />
            </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Users" value={stats.users.total} change={`+${stats.users.new_today} today`} icon={<Users />} color="blue" />
            <StatCard title="Open Jobs" value={stats.jobs.open} change={`${stats.jobs.total} total`} icon={<Briefcase />} color="green" />
            <StatCard title="Active Properties" value={stats.properties.active} change={`${stats.properties.total} total`} icon={<Home />} color="orange" />
            <StatCard title="Upcoming Events" value={stats.events.upcoming} change={`${stats.events.total} total`} icon={<Ticket />} color="purple" />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* System Health */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Activity className="h-5 w-5 text-green-500" />
                        System Status
                    </h2>
                </div>
                <div className="p-4 space-y-3">
                    {health && (
                        <>
                            <HealthRow label="Database" status={health.database} />
                            <HealthRow label="API Server" status={health.api} />
                            <HealthRow label="Storage" status={health.storage} />
                            <HealthRow label="AI Services" status={health.aiServices} />
                        </>
                    )}
                </div>
            </div>

            {/* AI Systems */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        AI Systems
                    </h2>
                </div>
                <div className="p-4 grid grid-cols-3 gap-3">
                    <AISystemCard name="Island Search" icon={<Search className="h-4 w-4" />} />
                    <AISystemCard name="Keywords" icon={<Target className="h-4 w-4" />} />
                    <AISystemCard name="Trust Score" icon={<Shield className="h-4 w-4" />} />
                    <AISystemCard name="Recommender" icon={<TrendingUp className="h-4 w-4" />} />
                    <AISystemCard name="Concierge" icon={<Bell className="h-4 w-4" />} />
                    <AISystemCard name="Guardian" icon={<Eye className="h-4 w-4" />} />
                </div>
            </div>
        </div>
    </div>
);

// ============================================
// SUB-COMPONENTS
// ============================================

const StatCard: React.FC<{ title: string; value: number; change: string; icon: React.ReactNode; color: string }> = ({ title, value, change, icon, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">{title}</span>
            <div className={`p-2 rounded-lg bg-${color}-500/10 text-${color}-500 [&>svg]:h-5 [&>svg]:w-5`}>{icon}</div>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
        <p className="text-xs text-gray-500 mt-1">{change}</p>
    </div>
);

const HealthRow: React.FC<{ label: string; status: 'healthy' | 'degraded' | 'unhealthy' }> = ({ label, status }) => {
    const config = {
        healthy: { color: 'bg-green-500', text: 'Operational' },
        degraded: { color: 'bg-yellow-500', text: 'Degraded' },
        unhealthy: { color: 'bg-red-500', text: 'Down' }
    };
    return (
        <div className="flex items-center justify-between p-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
            <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${config[status].color}`} />
                <span className="text-xs text-gray-500">{config[status].text}</span>
            </div>
        </div>
    );
};

const AISystemCard: React.FC<{ name: string; icon: React.ReactNode }> = ({ name, icon }) => (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
        <div className="p-2 bg-white dark:bg-gray-600 rounded-lg w-fit mx-auto mb-2">{icon}</div>
        <p className="text-xs font-medium text-gray-900 dark:text-white">{name}</p>
        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-600">active</span>
    </div>
);

export default CommandCenter;
