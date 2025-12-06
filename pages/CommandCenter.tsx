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
    TicketsMonitor, ReportsAnalytics
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
    const [activeSection, setActiveSection] = useState<AdminSection>('overview');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setIsLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const [usersData, jobsData, propertiesData, eventsData] = await Promise.all([
                supabase.from('profiles').select('id, created_at', { count: 'exact' }),
                supabase.from('jobs').select('id, status', { count: 'exact' }),
                supabase.from('real_estate_listings').select('id, status', { count: 'exact' }),
                supabase.from('events').select('id, event_date', { count: 'exact' })
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
                database: healthChecks.find(h => h.id === 'database')?.status || 'healthy',
                api: healthChecks.find(h => h.id === 'api')?.status || 'healthy',
                storage: healthChecks.find(h => h.id === 'storage')?.status || 'healthy',
                aiServices: healthChecks.find(h => h.id === 'external')?.status || 'healthy'
            });

            const alertsData = await siteGuardian.getAlerts({ limit: 5 });
            setAlerts(alertsData);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <RefreshCw className="h-8 w-8 animate-spin text-trini-red" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Sidebar */}
            <AdminSidebar
                activeSection={activeSection}
                onSectionChange={setActiveSection}
                userRole="super_admin"
                collapsed={sidebarCollapsed}
                onLogout={handleLogout}
            />

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Overview Section */}
                    {activeSection === 'overview' && stats && (
                        <OverviewSection stats={stats} health={health} alerts={alerts} onRefresh={loadDashboardData} />
                    )}

                    {/* Traffic Hub */}
                    {activeSection === 'traffic_hub' && <TrafficHub />}

                    {/* Ads Engine */}
                    {activeSection === 'ads_engine' && <AdsEngine />}

                    {/* SEO Keyword Hub */}
                    {activeSection === 'seo_keyword_hub' && <KeywordDashboard />}

                    {/* Content AI Center */}
                    {activeSection === 'content_ai_center' && <ContentAICenter />}

                    {/* User Management */}
                    {activeSection === 'user_management' && <UserManagement />}

                    {/* Marketplace Monitor */}
                    {activeSection === 'marketplace_monitor' && <MarketplaceMonitor />}

                    {/* Jobs Monitor */}
                    {activeSection === 'jobs_monitor' && <JobsMonitor />}

                    {/* Real Estate Monitor */}
                    {activeSection === 'real_estate_monitor' && <RealEstateMonitor />}

                    {/* Rideshare Fleet */}
                    {activeSection === 'rideshare_fleet' && <RideshareFleet />}

                    {/* Tickets Events Monitor */}
                    {activeSection === 'tickets_events_monitor' && <TicketsMonitor />}

                    {/* Trust & Safety */}
                    {activeSection === 'trust_and_safety' && <TrustSafety />}

                    {/* Messaging Center */}
                    {activeSection === 'messaging_center' && <PlaceholderSection title="Messaging Center" icon={<Bell />} />}

                    {/* Finance & Payouts */}
                    {activeSection === 'finance_and_payouts' && <FinancePayouts />}

                    {/* System Health */}
                    {activeSection === 'system_health' && <SystemHealth />}

                    {/* Automations */}
                    {activeSection === 'automations' && <PlaceholderSection title="Automations" icon={<Zap />} />}

                    {/* Developer Tools */}
                    {activeSection === 'developer_tools' && <DeveloperTools />}

                    {/* Reports & Analytics */}
                    {activeSection === 'reports_and_analytics' && <ReportsAnalytics />}
                </div>
            </main>
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
        {/* Header */}
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Command Center</h1>
                <p className="text-gray-500">TriniBuild AI OS v2.0</p>
            </div>
            <button onClick={onRefresh} className="p-2 text-gray-500 hover:text-trini-red">
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

const PlaceholderSection: React.FC<{ title: string; icon: React.ReactNode }> = ({ title, icon }) => (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="text-gray-400 [&>svg]:h-7 [&>svg]:w-7">{icon}</span>
                {title}
            </h1>
            <p className="text-gray-500">Coming soon...</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-16 text-center border border-gray-200 dark:border-gray-700">
            <div className="text-gray-300 [&>svg]:h-16 [&>svg]:w-16 [&>svg]:mx-auto">{icon}</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-4">{title}</h3>
            <p className="text-gray-500 mt-2">This feature is under development.</p>
        </div>
    </div>
);

export default CommandCenter;
