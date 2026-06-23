import React, { useState } from 'react';
import { ChevronDown, Building2 } from 'lucide-react';

interface Business {
  id: string;
  name: string;
}

interface BusinessSwitcherProps {
  businesses: Business[];
  currentId: string;
  onChange: (id: string) => void;
}

export const BusinessSwitcher: React.FC<BusinessSwitcherProps> = ({ businesses, currentId, onChange }) => {
  const [open, setOpen] = useState(false);
  const current = businesses.find((b) => b.id === currentId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Building2 size={16} className="text-gray-500" />
        <span className="font-medium text-sm text-gray-700">{current?.name || 'Select Business'}</span>
        <ChevronDown size={14} className="text-gray-400" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
          {businesses.map((b) => (
            <button
              key={b.id}
              onClick={() => { onChange(b.id); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${b.id === currentId ? 'text-blue-600 font-medium' : 'text-gray-700'}`}
            >
              {b.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
