import React from 'react';
import { Menu, Bell, ChevronDown } from 'lucide-react';

interface TopBarProps {
  onMenuClick: () => void;
  businessName?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick, businessName = 'My Business' }) => {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden text-gray-600 hover:text-gray-900">
          <Menu size={22} />
        </button>
        <span className="font-semibold text-gray-800 text-sm md:text-base">{businessName}</span>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative text-gray-500 hover:text-gray-700">
          <Bell size={20} />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white text-sm font-bold">
            R
          </div>
          <ChevronDown size={16} className="text-gray-400 hidden md:block" />
        </div>
      </div>
    </header>
  );
};
