/**
 * Year-end Premium offer. Buy button is behind PREMIUM_CHECKOUT_ENABLED=false.
 * Server is the source of truth for the flag. Never claims a charge upgrades the plan.
 */
import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { formatFeePercent } from '../services/juvayFees';

interface PremiumPayload {
  offer: {
    name: string;
    intro_price_ttd: number;
    intro_months: number;
    then_price_ttd: number;
    juvay_fee_bps: number;
    features: string[];
    note: string;
  };
  checkout_enabled: boolean;
  message: string;
}

export const PremiumOffer: React.FC = () => {
  const [data, setData] = useState<PremiumPayload | null>(null);

  useEffect(() => {
    fetch('/api/premium')
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => { if (body?.offer) setData(body); })
      .catch(() => { /* keep unset */ });
  }, []);

  const offer = data?.offer || {
    name: 'Premium',
    intro_price_ttd: 49,
    intro_months: 3,
    then_price_ttd: 79,
    juvay_fee_bps: 250,
    features: [
      'Lower 2.5% Juvay fee on successful online Wam sales, capped at TT$25',
      'Unlimited listings (same as Free)',
      '0% Juvay commission on cash pickup and cash on delivery',
    ],
    note: 'Checkout is not open yet.',
  };
  const enabled = data?.checkout_enabled === true;

  return (
    <div className="bg-white rounded-2xl border-2 border-red-500 shadow-lg p-6 flex flex-col">
      <p className="text-xs font-bold uppercase tracking-wider text-red-600 mb-2">Year-end offer</p>
      <h3 className="text-xl font-black text-gray-900">{offer.name}</h3>
      <p className="mt-3">
        <span className="text-4xl font-black text-gray-900">TT${offer.intro_price_ttd}</span>
        <span className="text-gray-500 ml-1">/month for {offer.intro_months} months</span>
      </p>
      <p className="text-sm text-gray-600 mt-1">Then TT${offer.then_price_ttd}/month. {formatFeePercent(offer.juvay_fee_bps)} Juvay fee on online Wam sales, capped at TT$25.</p>
      <ul className="mt-6 space-y-2 flex-1">
        {offer.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>
      <div className="mt-6">
        {enabled ? (
          <p className="w-full py-3 rounded-xl bg-amber-50 text-amber-900 text-sm font-semibold text-center border border-amber-100">
            The Premium flag is on, but a live pay path is not proven. No charge was taken.
          </p>
        ) : (
          <p className="w-full py-3 rounded-xl bg-gray-50 text-gray-500 text-sm font-semibold text-center">
            Premium checkout is not open yet. Free already includes unlimited listings and 0% on cash.
          </p>
        )}
      </div>
      <p className="mt-3 text-xs text-gray-500">{data?.message || offer.note}</p>
    </div>
  );
};

export default PremiumOffer;
