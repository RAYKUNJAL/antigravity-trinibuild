import React from 'react';
import { Sparkles, Check } from 'lucide-react';
import { Button } from '../ui/Button';

const plans = [
  { name: 'Basic', price: '$10/mo', features: ['1 AI tool', 'Basic features'] },
  { name: 'Growth', price: '$19/mo', features: ['3 AI tools', 'Enhanced features'] },
  { name: 'Pro', price: '$49/mo', features: ['All AI tools', 'Advanced features', 'Priority support'] },
];

export const UpgradeCTA: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-teal-500 rounded-xl p-6 text-white shadow-lg">
      <div className="flex items-start gap-3 mb-4">
        <Sparkles size={24} />
        <div>
          <h3 className="text-lg font-bold">Unlock All AI Tools</h3>
          <p className="text-white/80 text-sm mt-1">Upgrade to access all 12 AI-powered business tools.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {plans.map((plan) => (
          <div key={plan.name} className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <div className="font-bold">{plan.name}</div>
            <div className="text-2xl font-bold mt-1">{plan.price}</div>
            <ul className="mt-2 space-y-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-1.5 text-xs text-white/90">
                  <Check size={14} /> {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <Button variant="secondary" fullWidth>
        Upgrade Now
      </Button>
    </div>
  );
};
