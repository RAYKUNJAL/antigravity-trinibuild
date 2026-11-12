/**
 * "You keep TT$X" calculator. Uses services/juvayFees.ts quoteOrder.
 * Wam figures are the published rate — confirm with Wam. Does not claim pay→fulfill.
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  quoteAllRails,
  formatTtdCents,
  formatFeePercent,
  WAM_RATE_LABEL,
  type PaymentRail,
} from '../services/juvayFees';

const RAIL_LABEL: Record<PaymentRail, string> = {
  wam_wallet: 'Wam wallet',
  wam_card: 'Card (Wam)',
  cash_pickup: 'Cash pickup',
  cod: 'Cash on delivery',
};

export const YouKeepCalculator: React.FC<{
  defaultDollars?: number;
  planSlug?: string;
  compact?: boolean;
}> = ({ defaultDollars = 12, planSlug = 'free', compact }) => {
  const [dollars, setDollars] = useState(String(defaultDollars));
  const [plan, setPlan] = useState(planSlug === 'premium' || planSlug === 'starter' || planSlug === 'business' || planSlug === 'pro' ? 'premium' : 'free');
  const [rail, setRail] = useState<PaymentRail>('wam_wallet');

  const cents = Math.max(0, Math.round((Number(dollars) || 0) * 100));
  const quoted = useMemo(
    () => quoteAllRails({ subtotalCents: cents, planSlug: plan === 'premium' ? 'premium' : 'free' }),
    [cents, plan],
  );
  const q = quoted.quotes[rail];

  return (
    <div className={`bg-white border border-gray-200 rounded-2xl ${compact ? 'p-4' : 'p-6'} space-y-4`}>
      <div>
        <h2 className={`font-bold text-gray-900 ${compact ? 'text-base' : 'text-lg'}`}>You keep TT$</h2>
        <p className="text-xs text-gray-500 mt-1">
          Estimated seller proceeds on a successful sale. {WAM_RATE_LABEL}. Juvay never absorbs the Wam fee.
          This is a calculator, not a payout.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm text-gray-700">
          Sale amount (TT$)
          <input
            type="number"
            min="0"
            step="0.01"
            value={dollars}
            onChange={(e) => setDollars(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm text-gray-700">
          Plan
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="free">Free ({formatFeePercent(450)} online)</option>
            <option value="premium">Premium ({formatFeePercent(250)} online)</option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(RAIL_LABEL) as PaymentRail[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRail(r)}
            className={`text-xs font-semibold px-3 py-2 rounded-full border min-h-[44px] ${
              rail === r ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200'
            }`}
          >
            {RAIL_LABEL[r]}
          </button>
        ))}
      </div>
      {q && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
          <p className="text-xs font-semibold text-emerald-800">You keep</p>
          <p className="text-3xl font-black text-emerald-950">{formatTtdCents(q.seller_net_cents)}</p>
          <ul className="mt-3 space-y-1 text-xs text-emerald-900">
            <li>Buyer pays {formatTtdCents(q.total_buyer_pays_cents)}</li>
            {q.juvay_fee_cents > 0 && (
              <li>Juvay fee {formatTtdCents(q.juvay_fee_cents)} ({formatFeePercent(q.juvay_fee_bps)}{q.juvay_fee_cap_applied ? ', cap applied' : ''})</li>
            )}
            {q.wam_fee_seller_cents > 0 && (
              <li>Wam fee (seller) {formatTtdCents(q.wam_fee_seller_cents)}</li>
            )}
            {q.buyer_card_fee_cents > 0 && (
              <li>Buyer pays the {formatTtdCents(q.buyer_card_fee_cents)} card flat fee</li>
            )}
            {q.zero_commission && <li>0% Juvay commission on cash</li>}
          </ul>
        </div>
      )}
      <p className="text-xs text-gray-500">
        See the <Link to="/fees" className="underline text-red-600 font-semibold">rate card</Link>.
        A payment is not fulfilled until Wam confirms — we do not claim that path is proven live.
      </p>
    </div>
  );
};

export default YouKeepCalculator;
