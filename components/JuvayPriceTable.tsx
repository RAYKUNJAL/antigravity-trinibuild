import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import {
  JUVAY_PLANS,
  JUVAY_ADD_ONS,
  formatPlanPrice,
  PREMIUM_PRICE_COPY,
  PAID_UPGRADE_UNAVAILABLE_COPY,
  FREE_INCLUDES_COPY,
} from '../services/juvayPlans';

/** One TTD table: Free / Premium plus the tracked-vehicle add-on. Paid CTAs stay hidden. */
export const JuvayPriceTable: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {JUVAY_PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-2xl border-2 p-6 flex flex-col ${
              plan.id === 'premium' ? 'border-red-500 shadow-lg' : 'border-gray-200'
            }`}
          >
            <h3 className="text-xl font-black text-gray-900">{plan.name}</h3>
            {plan.paid ? (
              <p className="mt-3 text-2xl font-black text-gray-900 leading-snug">{PREMIUM_PRICE_COPY}</p>
            ) : (
              <p className="mt-3">
                <span className="text-4xl font-black text-gray-900">{formatPlanPrice(plan.priceTtd)}</span>
                <span className="text-gray-500 ml-1">{plan.period}</span>
              </p>
            )}
            <ul className="mt-6 space-y-2 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              {!plan.paid ? (
                <Link
                  to="/signup"
                  className="block w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold text-center hover:bg-gray-800"
                >
                  Start free
                </Link>
              ) : (
                <p className="w-full py-3 rounded-xl bg-gray-50 text-gray-500 text-sm font-semibold text-center">
                  {PAID_UPGRADE_UNAVAILABLE_COPY}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      {JUVAY_ADD_ONS.map((addon) => (
        <div key={addon.id} className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900">{addon.name}</h3>
          <p className="mt-2 text-gray-800 font-semibold">{addon.priceCopy}</p>
          <ul className="mt-3 space-y-2">
            {addon.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 mt-3">{PAID_UPGRADE_UNAVAILABLE_COPY}</p>
        </div>
      ))}
      <p className="text-sm text-gray-500">{FREE_INCLUDES_COPY}</p>
    </div>
  );
};
