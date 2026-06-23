import React from 'react';
import { Building2, Phone } from 'lucide-react';

interface BusinessCardProps {
  name: string;
  category: string;
  city: string;
  whatsapp?: string;
}

export const BusinessCard: React.FC<BusinessCardProps> = ({ name, category, city, whatsapp }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-3">
      <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
        <Building2 size={20} />
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-gray-800">{name}</h4>
        <p className="text-xs text-gray-500">{category} · {city}</p>
      </div>
      {whatsapp && (
        <div className="flex items-center gap-1 text-xs text-green-600">
          <Phone size={14} /> {whatsapp}
        </div>
      )}
    </div>
  );
};
