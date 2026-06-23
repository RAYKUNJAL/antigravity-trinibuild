import React from 'react';
import { useParams } from 'react-router-dom';
import { Construction } from 'lucide-react';

export const ToolWorkspace: React.FC = () => {
  const { toolSlug } = useParams();
  const displayName = toolSlug?.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Tool';

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{displayName}</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="inline-block p-4 rounded-full bg-yellow-50 text-yellow-600 mb-4">
          <Construction size={40} />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">This tool is being built</h3>
        <p className="text-gray-500 mt-2 max-w-md mx-auto">
          The {displayName} workspace is under active development. Check back soon for the full experience.
        </p>
      </div>
    </div>
  );
};
