import React from 'react';
import { Sparkles, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';
import {
  PREMIUM_PRICE_COPY,
  PREMIUM_INCLUDES_COPY,
  PAID_UPGRADE_UNAVAILABLE_COPY,
  FREE_INCLUDES_COPY,
} from '../../services/juvayPlans';

const plans = [
  { name: 'Free', price: 'TT$0', features: [FREE_INCLUDES_COPY] },
  { name: 'Premium', price: PREMIUM_PRICE_COPY, features: [PREMIUM_INCLUDES_COPY, PAID_UPGRADE_UNAVAILABLE_COPY] },
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
      <Link to="/pricing" className="block">
        <Button variant="secondary" fullWidth>
          See /pricing
        </Button>
      </Link>
      <p className="text-xs text-white/80 mt-3">{PAID_UPGRADE_UNAVAILABLE_COPY}</p>
    </div>
  );
};
