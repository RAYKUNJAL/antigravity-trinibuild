import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, Wrench, ShoppingBag, Settings as SettingsIcon, X } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { to: '/dashboard/ai', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/business', label: 'My Business', icon: Building2 },
  { to: '/dashboard/tools', label: 'AI Tools', icon: Wrench },
  { to: '/dashboard/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/dashboard/settings', label: 'Settings', icon: SettingsIcon },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-full w-64 bg-slate-900 text-white transform transition-transform duration-200 lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-700">
        <span className="text-lg font-bold tracking-tight">TriniBuild</span>
        <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
          <X size={20} />
        </button>
      </div>
      <nav className="px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
        <div className="text-xs text-slate-400">Caribbean Business OS</div>
        <div className="text-xs text-slate-500 mt-1">v1.0 — AI Marketplace</div>
      </div>
    </aside>
  );
};
