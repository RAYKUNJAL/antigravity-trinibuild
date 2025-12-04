import React, { ReactNode } from 'react';
import {
    LayoutDashboard, Map as MapIcon, BarChart2, DollarSign,
    FileEdit, Video, TrendingUp, Globe, Users, Briefcase,
    Layers, Sliders, Settings as SettingsIcon, LogOut
} from 'lucide-react';
import { authService } from '../services/authService';

interface AdminLayoutProps {
    children: ReactNode;
    rightPanel?: ReactNode;
    activeView: string;
    setActiveView: (view: any) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
    children,
    rightPanel,
    activeView,
    setActiveView
}) => {

    const navItems = [
        { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
        { id: 'analytics', icon: MapIcon, label: 'Heatmaps' },
        { id: 'monetization', icon: BarChart2, label: 'Traffic' },
        { id: 'payments', icon: DollarSign, label: 'Payments' },
        { id: 'content', icon: FileEdit, label: 'Content' },
        { id: 'videos', icon: Video, label: 'Videos' },
        { id: 'video-analytics', icon: TrendingUp, label: 'Analytics' },
        { id: 'stores', icon: Globe, label: 'Stores' },
        { id: 'users', icon: Users, label: 'Users' },
        { id: 'jobs', icon: Briefcase, label: 'Jobs' },
        { id: 'integrations', icon: Layers, label: 'Integrations' },
        { id: 'settings', icon: Sliders, label: 'Site Control' },
        { id: 'system', icon: SettingsIcon, label: 'System' },
    ];

    return (
        <div className="admin-main">
            <nav className="admin-menu custom-scrollbar">
                <h1>TriniBuild</h1>
                <img
                    className="logo"
                    src="https://trinibuild.com/wp-content/uploads/2023/05/TriniBuild-Logo.png"
                    alt="Logo"
                />
                <ul>
                    {navItems.map((item) => (
                        <li
                            key={item.id}
                            className={`admin-nav-item ${activeView === item.id ? 'active' : ''}`}
                            onClick={() => setActiveView(item.id)}
                        >
                            <b></b>
                            <b></b>
                            <a>
                                <item.icon className="h-5 w-5" />
                                <span className="nav-text ml-2">{item.label}</span>
                            </a>
                        </li>
                    ))}

                    <li className="admin-nav-item mt-10" onClick={() => authService.logout()}>
                        <b></b>
                        <b></b>
                        <a>
                            <LogOut className="h-5 w-5 text-red-300" />
                            <span className="nav-text ml-2 text-red-300">Logout</span>
                        </a>
                    </li>
                </ul>
            </nav>

            <section className="admin-content">
                <div className="admin-left-content custom-scrollbar">
                    {children}
                </div>

                <div className="admin-right-content">
                    {rightPanel || (
                        <div className="p-4 text-center text-gray-400">
                            Select an item to view details
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};
