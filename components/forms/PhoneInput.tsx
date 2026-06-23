import React from 'react';

interface PhoneInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  countryCode?: string;
  onCountryCodeChange?: (code: string) => void;
}

const caribbeanCodes = [
  { code: '+868', label: '🇹🇹 +868 (T&T)' },
  { code: '+876', label: '🇯🇲 +876 (Jamaica)' },
  { code: '+246', label: '🇧🇧 +246 (Barbados)' },
  { code: '+592', label: '🇬🇾 +592 (Guyana)' },
  { code: '+1', label: '🇺🇸 +1 (USA)' },
];

export const PhoneInput: React.FC<PhoneInputProps> = ({ label, value, onChange, countryCode = '+868', onCountryCodeChange }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex gap-2">
        <select
          value={countryCode}
          onChange={(e) => onCountryCodeChange?.(e.target.value)}
          className="px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          {caribbeanCodes.map((c) => (
            <option key={c.code} value={c.code}>{c.label}</option>
          ))}
        </select>
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="123-4567"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
};
