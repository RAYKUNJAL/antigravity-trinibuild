import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { JUVAY_PLANS, formatPlanPrice, premiumPriceCopy } from '../services/juvayPlans';

/** One TTD table: Free / Premium. Paid CTAs stay hidden (PREMIUM_CHECKOUT_ENABLED=false). */
export const JuvayPriceTable: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${className}`}>
      {JUVAY_PLANS.map((plan) => (
        <div
          key={plan.id}
          className={`bg-white rounded-2xl border-2 p-6 flex flex-col ${
            plan.id === 'premium' ? 'border-red-500 shadow-lg' : 'border-gray-200'
          }`}
        >
          {plan.id === 'premium' && (
            <p className="text-xs font-bold uppercase tracking-wider text-red-600 mb-2">Year-end offer</p>
          )}
          <h3 className="text-xl font-black text-gray-900">{plan.name}</h3>
          {plan.paid ? (
            <>
              <p className="mt-3">
                <span className="text-4xl font-black text-gray-900">{formatPlanPrice(plan.introPriceTtd)}</span>
                <span className="text-gray-500 ml-1">/month for {plan.introMonths} months</span>
              </p>
              <p className="text-sm text-gray-600 mt-1">Then {formatPlanPrice(plan.thenPriceTtd)}/month. 2.5% Juvay fee on online Wam sales, capped at TT$25.</p>
            </>
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
                Premium checkout is not open yet. {premiumPriceCopy()}. Free includes unlimited listings.
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
