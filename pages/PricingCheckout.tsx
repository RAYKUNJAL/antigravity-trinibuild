import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { JUVAY_PLANS, formatPlanPrice } from '../services/juvayPlans';
import { fetchWamStatus } from '../services/wamStatus';
import { startWamCheckout } from '../services/wamCheckout';
import { getToken } from '../services/selfHostedApi';

/**
 * Real /pricing/checkout. Never 404.
 * Wam is a real option when GET /api/wam/status.configured.
 * Face only. No fulfill. Fail-closed without the key.
 */
export default function PricingCheckout() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requested = (params.get('plan') || '').toLowerCase();
  const plan = useMemo(
    () => JUVAY_PLANS.find((p) => p.id === requested && p.paid) || null,
    [requested]
  );
  const [wamOn, setWamOn] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [recorded, setRecorded] = useState(false);

  useEffect(() => {
    fetchWamStatus().then((s) => {
      setWamOn(s.configured);
      setLoaded(true);
    });
  }, []);

  const faceCents = plan ? plan.priceTtd * 100 : 0;

  const payWithWam = async () => {
    setError('');
    if (!plan) {
      setError('Pick Starter or Business from the price table.');
      return;
    }
    if (!getToken()) {
      navigate(`/login?next=/pricing/checkout?plan=${plan.id}`);
      return;
    }
    setBusy(true);
    try {
      await startWamCheckout({
        amountCents: faceCents,
        faceCents,
        purpose: `plan:${plan.id}`,
      });
      setRecorded(true);
    } catch (e: any) {
      setError(e?.message || 'Wam checkout failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-200 p-8">
        <h1 className="text-2xl font-black text-gray-900 mb-2">Paid plan checkout</h1>
        {!loaded ? (
          <p className="text-gray-500">Checking whether Wam is on…</p>
        ) : !wamOn ? (
          <>
            <p className="text-gray-700 mb-4">
              Paid Starter and Business checkout is closed. Wam is unset on this origin, so there is no pay button.
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
        ) : recorded ? (
          <>
            <p className="text-gray-700 mb-4">Wam intent recorded at face {plan ? formatPlanPrice(plan.priceTtd) : ''}.</p>
            <p className="text-sm text-gray-600 mb-6">
              This does not upgrade the plan and does not fulfil anything. Processing estimates are display-only and were not added to the charge.
            </p>
            <Link to="/pricing" className="block text-center py-3 rounded-xl bg-gray-900 text-white font-semibold">
              Back to pricing
            </Link>
          </>
        ) : (
          <>
            <p className="text-gray-700 mb-2">
              {plan ? `${plan.name} is ${formatPlanPrice(plan.priceTtd)}${plan.period}.` : 'Pick Starter or Business from the price table.'}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              Pay with Wam. Face amount only. Processing estimate is display-only and is not added.
            </p>
            {plan && (
              <p className="text-xs text-gray-400 mb-4">Display-only processing estimate: not added. Charge = {formatPlanPrice(plan.priceTtd)}.</p>
            )}
            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
            {plan ? (
              <button
                type="button"
                onClick={payWithWam}
                disabled={busy}
                className="w-full py-3 rounded-xl bg-gray-900 text-white font-semibold disabled:opacity-50"
              >
                {busy ? 'Recording Wam intent…' : `Pay ${formatPlanPrice(plan.priceTtd)} with Wam`}
              </button>
            ) : (
              <Link to="/pricing" className="block text-center py-3 rounded-xl bg-gray-900 text-white font-semibold">
                Choose a plan
              </Link>
            )}
            <Link to="/pricing" className="block text-center mt-3 py-3 text-sm text-gray-500">
              Back to pricing
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
