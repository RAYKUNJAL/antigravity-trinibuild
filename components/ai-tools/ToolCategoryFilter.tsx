import React from 'react';

const categories = ['All', 'Get Customers', 'Manage Customers', 'Get Paid', 'Sell Online', 'Grow'];

interface ToolCategoryFilterProps {
  activeCategory: string;
  onChange: (cat: string) => void;
}

export const ToolCategoryFilter: React.FC<ToolCategoryFilterProps> = ({ activeCategory, onChange }) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            activeCategory === cat
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
};
