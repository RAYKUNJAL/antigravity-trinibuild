import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { JUVAY_PLANS, formatPlanPrice } from '../services/juvayPlans';
import { fetchWamStatus } from '../services/wamStatus';

/**
 * Real /pricing/checkout route. Never 404.
 * No key on the VPS today → fail-closed to cash pickup / COD. No PayPal. No charge. No fulfill.
 */
export default function PricingCheckout() {
  const [params] = useSearchParams();
  const requested = (params.get('plan') || '').toLowerCase();
  const plan = useMemo(
    () => JUVAY_PLANS.find((p) => p.id === requested && p.paid) || null,
    [requested]
  );
  const [wamOn, setWamOn] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchWamStatus().then((s) => {
      setWamOn(s.configured);
      setLoaded(true);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-200 p-8">
        <h1 className="text-2xl font-black text-gray-900 mb-2">Paid plan checkout</h1>
        {!loaded ? (
          <p className="text-gray-500">Checking whether a card rail is on…</p>
        ) : !wamOn ? (
          <>
            <p className="text-gray-700 mb-4">
              Paid Starter and Business checkout is closed. There is no Wam key on this origin, so there is no pay button.
            </p>
            <p className="text-sm text-gray-600 mb-6">
              Live rails are cash at pickup and cash on delivery. The free plan is 5 product listings. A charge would not upgrade a plan.
            </p>
            <div className="flex flex-col gap-3">
              <Link to="/signup" className="block text-center py-3 rounded-xl bg-gray-900 text-white font-semibold">
                Start free (5 listings)
              </Link>
              <Link to="/pricing" className="block text-center py-3 rounded-xl bg-gray-100 text-gray-800 font-semibold">
                Back to pricing
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-700 mb-2">
              {plan ? `${plan.name} is ${formatPlanPrice(plan.priceTtd)}${plan.period}.` : 'Pick Starter or Business from the price table.'}
            </p>
            <p className="text-sm text-gray-600 mb-6">
              Face amount only. Processing estimates are display-only. Checkout records a pending intent — it does not fulfil or upgrade.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Talk to us to start a paid plan. This page does not take a test charge.
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
