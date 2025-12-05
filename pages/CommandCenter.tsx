import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    LayoutDashboard,
    TrendingUp,
    Users,
    ShoppingBag,
    Briefcase,
    Home,
    Ticket,
    Car,
    Search,
    Bell,
    Shield,
    AlertTriangle,
    Activity,
    Eye,
    MousePointer,
    Clock,
    RefreshCw,
    ChevronRight,
    BarChart3,
    PieChart,
    Globe,
    Zap,
    Target,
    FileText,
    Settings
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { siteGuardian } from '../services/siteGuardianService';

// ============================================
// TYPES
// ============================================

interface DashboardStats {
    users: { total: number; new_today: number; active: number };
    listings: { total: number; new_today: number };
    jobs: { total: number; open: number };
    properties: { total: number; active: number };
    events: { total: number; upcoming: number };
    rides: { total: number; completed: number };
    orders: { total: number; today: number };
    revenue: { total: number; today: number };
}

interface HealthStatus {
    database: 'healthy' | 'degraded' | 'unhealthy';
    api: 'healthy' | 'degraded' | 'unhealthy';
    storage: 'healthy' | 'degraded' | 'unhealthy';
    aiServices: 'healthy' | 'degraded' | 'unhealthy';
}

interface RecentActivity {
    id: string;
    type: string;
    message: string;
    timestamp: string;
    icon: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

const CommandCenter: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<'overview' | 'analytics' | 'health' | 'alerts'>('overview');

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setIsLoading(true);

        try {
            // Load stats
            const [usersData, jobsData, propertiesData, eventsData] = await Promise.all([
                supabase.from('profiles').select('id, created_at', { count: 'exact' }),
                supabase.from('jobs').select('id, status', { count: 'exact' }),
                supabase.from('real_estate_listings').select('id, status', { count: 'exact' }),
                supabase.from('events').select('id, event_date', { count: 'exact' })
            ]);

            const today = new Date().toISOString().split('T')[0];

            setStats({
                users: {
                    total: usersData.count || 0,
                    new_today: usersData.data?.filter(u => u.created_at?.startsWith(today)).length || 0,
                    active: Math.floor((usersData.count || 0) * 0.3) // Estimate
                },
                listings: {
                    total: 0,
                    new_today: 0
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
                rides: { total: 0, completed: 0 },
                orders: { total: 0, today: 0 },
                revenue: { total: 0, today: 0 }
            });

            // Load health status
            const healthChecks = await siteGuardian.runHealthChecks();
            setHealth({
                database: healthChecks.find(h => h.id === 'database')?.status || 'healthy',
                api: healthChecks.find(h => h.id === 'api')?.status || 'healthy',
                storage: healthChecks.find(h => h.id === 'storage')?.status || 'healthy',
                aiServices: healthChecks.find(h => h.id === 'external')?.status || 'healthy'
            });

            // Load alerts
            const alertsData = await siteGuardian.getAlerts({ limit: 5 });
            setAlerts(alertsData);

            // Recent activity (mock for now)
            setRecentActivity([
                { id: '1', type: 'user', message: 'New user registered', timestamp: '2 min ago', icon: 'user' },
                { id: '2', type: 'job', message: 'New job posted: Software Developer', timestamp: '5 min ago', icon: 'briefcase' },
                { id: '3', type: 'property', message: 'Property listed in Port of Spain', timestamp: '10 min ago', icon: 'home' },
                { id: '4', type: 'order', message: 'Order completed #1234', timestamp: '15 min ago', icon: 'shopping-bag' },
                { id: '5', type: 'event', message: 'Event tickets sold out', timestamp: '20 min ago', icon: 'ticket' }
            ]);

        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <RefreshCw className="h-8 w-8 animate-spin text-trini-red" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-trini-red to-orange-500 rounded-xl">
                                <LayoutDashboard className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Command Center</h1>
                                <p className="text-sm text-gray-500">TriniBuild AI OS Control Panel</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={loadDashboardData}
                                className="p-2 text-gray-500 hover:text-trini-red"
                                title="Refresh data"
                                aria-label="Refresh dashboard data"
                            >
                                <RefreshCw className="h-5 w-5" />
                            </button>
                            <Link
                                to="/admin/keywords"
                                className="flex items-center gap-2 px-3 py-2 bg-trini-red text-white rounded-lg hover:bg-red-600"
                            >
                                <Search className="h-4 w-4" /> Keywords
                            </Link>
                            <Link
                                to="/admin/blog-generator"
                                className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                                <FileText className="h-4 w-4" /> Blog Engine
                            </Link>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-6 mt-4">
                        {[
                            { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
                            { id: 'analytics', label: 'Analytics', icon: <PieChart className="h-4 w-4" /> },
                            { id: 'health', label: 'System Health', icon: <Activity className="h-4 w-4" /> },
                            { id: 'alerts', label: 'Alerts', icon: <Bell className="h-4 w-4" /> }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveSection(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${activeSection === tab.id
                                        ? 'border-trini-red text-trini-red'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Overview Section */}
                {activeSection === 'overview' && stats && (
                    <div className="space-y-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard
                                title="Total Users"
                                value={stats.users.total}
                                change={`+${stats.users.new_today} today`}
                                icon={<Users className="h-5 w-5" />}
                                color="blue"
                            />
                            <StatCard
                                title="Open Jobs"
                                value={stats.jobs.open}
                                change={`${stats.jobs.total} total`}
                                icon={<Briefcase className="h-5 w-5" />}
                                color="green"
                            />
                            <StatCard
                                title="Active Properties"
                                value={stats.properties.active}
                                change={`${stats.properties.total} total`}
                                icon={<Home className="h-5 w-5" />}
                                color="orange"
                            />
                            <StatCard
                                title="Upcoming Events"
                                value={stats.events.upcoming}
                                change={`${stats.events.total} total`}
                                icon={<Ticket className="h-5 w-5" />}
                                color="purple"
                            />
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <QuickActionCard
                                title="Keyword Intelligence"
                                description="Monitor search trends"
                                icon={<Search className="h-6 w-6" />}
                                url="/admin/keywords"
                                color="purple"
                            />
                            <QuickActionCard
                                title="Blog Generator"
                                description="Create AI content"
                                icon={<FileText className="h-6 w-6" />}
                                url="/admin/blog-generator"
                                color="blue"
                            />
                            <QuickActionCard
                                title="Site Guardian"
                                description="Monitor platform health"
                                icon={<Shield className="h-6 w-6" />}
                                url="#"
                                color="green"
                            />
                            <QuickActionCard
                                title="Settings"
                                description="Configure AI systems"
                                icon={<Settings className="h-6 w-6" />}
                                url="#"
                                color="gray"
                            />
                        </div>

                        {/* Two Column Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Recent Activity */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                    <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Activity className="h-5 w-5 text-trini-red" />
                                        Recent Activity
                                    </h2>
                                </div>
                                <div className="p-4 space-y-3">
                                    {recentActivity.map(activity => (
                                        <div key={activity.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                                {activity.icon === 'user' && <Users className="h-4 w-4 text-blue-500" />}
                                                {activity.icon === 'briefcase' && <Briefcase className="h-4 w-4 text-green-500" />}
                                                {activity.icon === 'home' && <Home className="h-4 w-4 text-orange-500" />}
                                                {activity.icon === 'shopping-bag' && <ShoppingBag className="h-4 w-4 text-purple-500" />}
                                                {activity.icon === 'ticket' && <Ticket className="h-4 w-4 text-pink-500" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-900 dark:text-white">{activity.message}</p>
                                                <p className="text-xs text-gray-500">{activity.timestamp}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

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
                        </div>

                        {/* AI Systems Status */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                                <Zap className="h-5 w-5 text-yellow-500" />
                                AI Systems Status
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                <AISystemCard name="Island Search" status="active" icon={<Search className="h-5 w-5" />} />
                                <AISystemCard name="Keyword Engine" status="active" icon={<Target className="h-5 w-5" />} />
                                <AISystemCard name="Trust Scores" status="active" icon={<Shield className="h-5 w-5" />} />
                                <AISystemCard name="Recommender" status="active" icon={<TrendingUp className="h-5 w-5" />} />
                                <AISystemCard name="Concierge" status="active" icon={<Bell className="h-5 w-5" />} />
                                <AISystemCard name="Site Guardian" status="active" icon={<Eye className="h-5 w-5" />} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Health Section */}
                {activeSection === 'health' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {health && (
                                <>
                                    <HealthCard title="Database" status={health.database} details="PostgreSQL via Supabase" />
                                    <HealthCard title="API Server" status={health.api} details="FastAPI + Groq AI" />
                                    <HealthCard title="Storage" status={health.storage} details="Supabase Storage" />
                                    <HealthCard title="AI Services" status={health.aiServices} details="Llama 3.3-70B" />
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Alerts Section */}
                {activeSection === 'alerts' && (
                    <div className="space-y-4">
                        {alerts.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
                                <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No active alerts</p>
                            </div>
                        ) : (
                            alerts.map(alert => (
                                <AlertCard key={alert.id} alert={alert} />
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

// ============================================
// SUB-COMPONENTS
// ============================================

const StatCard: React.FC<{
    title: string;
    value: number;
    change: string;
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'orange' | 'purple';
}> = ({ title, value, change, icon, color }) => {
    const colorClasses = {
        blue: 'bg-blue-500/10 text-blue-500',
        green: 'bg-green-500/10 text-green-500',
        orange: 'bg-orange-500/10 text-orange-500',
        purple: 'bg-purple-500/10 text-purple-500'
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">{title}</span>
                <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">{change}</p>
        </div>
    );
};

const QuickActionCard: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    url: string;
    color: 'blue' | 'green' | 'purple' | 'gray';
}> = ({ title, description, icon, url, color }) => {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        purple: 'from-purple-500 to-purple-600',
        gray: 'from-gray-500 to-gray-600'
    };

    return (
        <Link
            to={url}
            className="block bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all group"
        >
            <div className={`p-3 rounded-lg bg-gradient-to-r ${colorClasses[color]} text-white w-fit mb-3`}>
                {icon}
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-trini-red">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
        </Link>
    );
};

const HealthRow: React.FC<{ label: string; status: 'healthy' | 'degraded' | 'unhealthy' }> = ({ label, status }) => {
    const statusConfig = {
        healthy: { color: 'bg-green-500', text: 'Operational' },
        degraded: { color: 'bg-yellow-500', text: 'Degraded' },
        unhealthy: { color: 'bg-red-500', text: 'Down' }
    };

    return (
        <div className="flex items-center justify-between p-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
            <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${statusConfig[status].color}`} />
                <span className="text-xs text-gray-500">{statusConfig[status].text}</span>
            </div>
        </div>
    );
};

const HealthCard: React.FC<{
    title: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: string;
}> = ({ title, status, details }) => {
    const statusConfig = {
        healthy: { bg: 'bg-green-500/10', border: 'border-green-500/30', icon: 'text-green-500' },
        degraded: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: 'text-yellow-500' },
        unhealthy: { bg: 'bg-red-500/10', border: 'border-red-500/30', icon: 'text-red-500' }
    };

    return (
        <div className={`rounded-xl p-4 border ${statusConfig[status].bg} ${statusConfig[status].border}`}>
            <div className="flex items-center gap-2 mb-2">
                <Activity className={`h-5 w-5 ${statusConfig[status].icon}`} />
                <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
            </div>
            <p className="text-sm text-gray-500">{details}</p>
            <p className={`text-xs font-medium mt-2 ${statusConfig[status].icon}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </p>
        </div>
    );
};

const AISystemCard: React.FC<{
    name: string;
    status: 'active' | 'inactive' | 'error';
    icon: React.ReactNode;
}> = ({ name, status, icon }) => (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
        <div className="p-2 bg-white dark:bg-gray-600 rounded-lg w-fit mx-auto mb-2">
            {icon}
        </div>
        <p className="text-xs font-medium text-gray-900 dark:text-white">{name}</p>
        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${status === 'active' ? 'bg-green-500/20 text-green-600' :
                status === 'error' ? 'bg-red-500/20 text-red-600' :
                    'bg-gray-500/20 text-gray-600'
            }`}>
            {status}
        </span>
    </div>
);

const AlertCard: React.FC<{ alert: any }> = ({ alert }) => {
    const severityConfig: Record<string, { bg: string; border: string; icon: string }> = {
        info: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: 'text-blue-500' },
        warning: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: 'text-yellow-500' },
        error: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: 'text-orange-500' },
        critical: { bg: 'bg-red-500/10', border: 'border-red-500/30', icon: 'text-red-500' }
    };

    const config = severityConfig[alert.severity] || severityConfig.info;

    return (
        <div className={`rounded-xl p-4 border ${config.bg} ${config.border}`}>
            <div className="flex items-start gap-3">
                <AlertTriangle className={`h-5 w-5 mt-0.5 ${config.icon}`} />
                <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white">{alert.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-2">{new Date(alert.created_at).toLocaleString()}</p>
                </div>
                <button
                    className="text-sm text-trini-red hover:underline"
                    aria-label={`Resolve alert: ${alert.title}`}
                >
                    Resolve
                </button>
            </div>
        </div>
    );
};

export default CommandCenter;
