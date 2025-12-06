import React from 'react';
import {
    LayoutDashboard,
    Activity,
    Megaphone,
    Search,
    FileText,
    Users,
    ShoppingBag,
    Briefcase,
    Home,
    Car,
    Ticket,
    Shield,
    MessageCircle,
    DollarSign,
    Server,
    Zap,
    Code,
    BarChart3,
    ChevronRight,
    LogOut
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

export type AdminSection =
    | 'overview'
    | 'traffic_hub'
    | 'ads_engine'
    | 'seo_keyword_hub'
    | 'content_ai_center'
    | 'user_management'
    | 'marketplace_monitor'
    | 'jobs_monitor'
    | 'real_estate_monitor'
    | 'rideshare_fleet'
    | 'tickets_events_monitor'
    | 'trust_and_safety'
    | 'messaging_center'
    | 'finance_and_payouts'
    | 'system_health'
    | 'automations'
    | 'developer_tools'
    | 'reports_and_analytics';

export type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'support_agent' | 'finance_admin' | 'developer';

interface SectionConfig {
    id: AdminSection;
    label: string;
    icon: React.ReactNode;
    roles: AdminRole[];
    badge?: number;
}

interface AdminSidebarProps {
    activeSection: AdminSection;
    onSectionChange: (section: AdminSection) => void;
    userRole?: AdminRole;
    collapsed?: boolean;
    onLogout?: () => void;
}

// ============================================
// SECTION CONFIGURATION
// ============================================

const sectionGroups: { title: string; sections: SectionConfig[] }[] = [
    {
        title: 'Dashboard',
        sections: [
            { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-5 w-5" />, roles: ['super_admin', 'admin', 'moderator', 'support_agent', 'finance_admin', 'developer'] },
        ]
    },
    {
        title: 'Traffic & Marketing',
        sections: [
            { id: 'traffic_hub', label: 'Traffic Hub', icon: <Activity className="h-5 w-5" />, roles: ['super_admin', 'admin'] },
            { id: 'ads_engine', label: 'Ads Engine', icon: <Megaphone className="h-5 w-5" />, roles: ['super_admin', 'admin'] },
            { id: 'seo_keyword_hub', label: 'SEO & Keywords', icon: <Search className="h-5 w-5" />, roles: ['super_admin', 'admin'] },
            { id: 'content_ai_center', label: 'Content AI', icon: <FileText className="h-5 w-5" />, roles: ['super_admin', 'admin'] },
        ]
    },
    {
        title: 'Platform Monitors',
        sections: [
            { id: 'user_management', label: 'Users', icon: <Users className="h-5 w-5" />, roles: ['super_admin', 'admin', 'moderator', 'support_agent'] },
            { id: 'marketplace_monitor', label: 'Marketplace', icon: <ShoppingBag className="h-5 w-5" />, roles: ['super_admin', 'admin'] },
            { id: 'jobs_monitor', label: 'Jobs', icon: <Briefcase className="h-5 w-5" />, roles: ['super_admin', 'admin'] },
            { id: 'real_estate_monitor', label: 'Real Estate', icon: <Home className="h-5 w-5" />, roles: ['super_admin', 'admin'] },
            { id: 'rideshare_fleet', label: 'Rideshare', icon: <Car className="h-5 w-5" />, roles: ['super_admin', 'admin'] },
            { id: 'tickets_events_monitor', label: 'Events', icon: <Ticket className="h-5 w-5" />, roles: ['super_admin', 'admin'] },
        ]
    },
    {
        title: 'Operations',
        sections: [
            { id: 'trust_and_safety', label: 'Trust & Safety', icon: <Shield className="h-5 w-5" />, roles: ['super_admin', 'admin', 'moderator'] },
            { id: 'messaging_center', label: 'Messaging', icon: <MessageCircle className="h-5 w-5" />, roles: ['super_admin', 'admin', 'support_agent'] },
            { id: 'finance_and_payouts', label: 'Finance', icon: <DollarSign className="h-5 w-5" />, roles: ['super_admin', 'finance_admin'] },
        ]
    },
    {
        title: 'System',
        sections: [
            { id: 'system_health', label: 'System Health', icon: <Server className="h-5 w-5" />, roles: ['super_admin', 'admin', 'developer'] },
            { id: 'automations', label: 'Automations', icon: <Zap className="h-5 w-5" />, roles: ['super_admin', 'admin'] },
            { id: 'developer_tools', label: 'Developer', icon: <Code className="h-5 w-5" />, roles: ['super_admin', 'developer'] },
            { id: 'reports_and_analytics', label: 'Reports', icon: <BarChart3 className="h-5 w-5" />, roles: ['super_admin', 'admin', 'finance_admin'] },
        ]
    }
];

// ============================================
// COMPONENT
// ============================================

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
    activeSection,
    onSectionChange,
    userRole = 'super_admin',
    collapsed = false,
    onLogout
}) => {
    const canAccess = (roles: AdminRole[]) => roles.includes(userRole);

    return (
        <aside className={`bg-gray-900 text-white flex flex-col h-screen sticky top-0 transition-all ${collapsed ? 'w-16' : 'w-64'}`}>
            {/* Logo */}
            <div className="p-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-trini-red to-orange-500 rounded-xl flex-shrink-0">
                        <LayoutDashboard className="h-5 w-5" />
                    </div>
                    {!collapsed && (
                        <div>
                            <h1 className="font-bold text-lg">Command Center</h1>
                            <p className="text-xs text-gray-400">v2.0</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                {sectionGroups.map((group, gi) => (
                    <div key={gi} className="mb-4">
                        {!collapsed && (
                            <h2 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {group.title}
                            </h2>
                        )}
                        <ul className="space-y-1 px-2">
                            {group.sections.filter(s => canAccess(s.roles)).map(section => (
                                <li key={section.id}>
                                    <button
                                        onClick={() => onSectionChange(section.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeSection === section.id
                                                ? 'bg-trini-red text-white'
                                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                            }`}
                                        title={collapsed ? section.label : undefined}
                                    >
                                        {section.icon}
                                        {!collapsed && (
                                            <>
                                                <span className="flex-1 text-left text-sm">{section.label}</span>
                                                {section.badge && (
                                                    <span className="px-2 py-0.5 text-xs bg-red-500 rounded-full">
                                                        {section.badge}
                                                    </span>
                                                )}
                                                <ChevronRight className={`h-4 w-4 transition-transform ${activeSection === section.id ? 'rotate-90' : ''}`} />
                                            </>
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* User & Logout */}
            <div className="p-4 border-t border-gray-800">
                <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold">
                        SU
                    </div>
                    {!collapsed && (
                        <div className="flex-1">
                            <p className="text-sm font-medium">Super Admin</p>
                            <p className="text-xs text-gray-500">{userRole}</p>
                        </div>
                    )}
                    {onLogout && (
                        <button
                            onClick={onLogout}
                            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                            title="Logout"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default AdminSidebar;
