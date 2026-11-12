import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { JUVAY_PLANS, formatPlanPrice, premiumPriceCopy } from '../services/juvayPlans';

/**
 * /pricing/checkout. Paid checkout stays closed while PREMIUM_CHECKOUT_ENABLED is false.
 * Server is the source of truth. A charge does not upgrade a plan. No 5-listing leftover.
 */
export default function PricingCheckout() {
  const [params] = useSearchParams();
  const requested = (params.get('plan') || 'premium').toLowerCase();
  const plan = useMemo(
    () => JUVAY_PLANS.find((p) => p.id === requested && p.paid) || JUVAY_PLANS.find((p) => p.paid) || null,
    [requested]
  );
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/premium')
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        setEnabled(body?.checkout_enabled === true);
        setLoaded(true);
      })
      .catch(() => {
        setEnabled(false);
        setLoaded(true);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-200 p-8">
        <h1 className="text-2xl font-black text-gray-900 mb-2">Premium checkout</h1>
        {!loaded ? (
          <p className="text-gray-500">Checking whether Premium checkout is open…</p>
        ) : !enabled ? (
          <>
            <p className="text-gray-700 mb-4">
              Premium checkout is not open yet. PREMIUM_CHECKOUT_ENABLED is off, so there is no pay button.
            </p>
            <p className="text-sm text-gray-600 mb-6">
              {premiumPriceCopy()}. 2.5% Juvay fee on successful online Wam sales, capped at TT$25.
              Free already includes unlimited listings and 0% on cash. A charge would not upgrade a plan.
            </p>
            <div className="flex flex-col gap-3">
              <Link to="/signup" className="block text-center py-3 rounded-xl bg-gray-900 text-white font-semibold">
                Start free (unlimited listings)
              </Link>
              <Link to="/pricing" className="block text-center py-3 rounded-xl bg-gray-100 text-gray-800 font-semibold">
                Back to pricing
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-700 mb-4">
              The Premium flag is on, but a live pay path is not proven. No charge was taken.
              {plan ? ` ${plan.name} is ${premiumPriceCopy()}.` : ''} Face would be {plan ? formatPlanPrice(plan.priceTtd) : ''} for the intro month.
            </p>
            <p className="text-sm text-gray-600 mb-6">
              This does not upgrade the plan and does not fulfil anything.
            </p>
            <Link to="/pricing" className="block text-center py-3 rounded-xl bg-gray-900 text-white font-semibold">
              Back to pricing
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
