/**
 * "You keep TT$X" — live quotes from services/juvayFees.ts.
 * Wam figures are labeled as published rates still to confirm with Wam.
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FEE_DEFAULTS,
  formatFeePercent,
  formatTtdCents,
  quoteOrder,
  WAM_RATE_LABEL,
} from '../../services/juvayFees';

const PRESETS = [
  { label: 'TT$12 doubles', cents: 1200 },
  { label: 'TT$50', cents: 5000 },
  { label: 'TT$100', cents: 10000 },
  { label: 'TT$300', cents: 30000 },
];

const RAILS: Array<{ id: 'cash_pickup' | 'cod' | 'wam_wallet' | 'wam_card'; name: string; note: string }> = [
  { id: 'cash_pickup', name: 'Cash pickup', note: '0% Juvay fee' },
  { id: 'cod', name: 'Cash on delivery', note: '0% Juvay fee' },
  { id: 'wam_wallet', name: 'Wam wallet', note: 'Lowest online fee' },
  { id: 'wam_card', name: 'Card via Wam', note: 'Buyer may pay the TT$1.50 flat' },
];

export const FeeKeepCalculator: React.FC = () => {
  const [cents, setCents] = useState(1200);
  const [plan, setPlan] = useState<'free' | 'premium'>('free');

  const quotes = useMemo(
    () =>
      RAILS.map((r) => ({
        ...r,
        q: quoteOrder({ subtotalCents: cents, rail: r.id, planSlug: plan }),
      })),
    [cents, plan],
  );

  const cap = formatTtdCents(FEE_DEFAULTS.juvayFeeCapCents);
  const freePct = formatFeePercent(FEE_DEFAULTS.juvayFeeBpsFree);
  const premPct = formatFeePercent(FEE_DEFAULTS.juvayFeeBpsPremium);

  return (
    <section id="fees" className="bg-[#FFF8F0] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#0d9488]">Fee transparency</p>
          <h2 className="text-3xl font-black tracking-tight text-[#141414] sm:text-4xl">
            You keep {formatTtdCents(quotes[0].q.seller_net_cents)} on a {formatTtdCents(cents)} cash order
          </h2>
          <p className="mt-4 text-lg text-[#4a453d]">
            Juvay takes {freePct} on Free and {premPct} on Premium, only on successful online Wam sales, capped at {cap} per
            order. 0% on cash and COD. There is no minimum fee.
          </p>
        </div>

        <div className="mt-10 rounded-3xl border border-[#e8dcc8] bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <label className="block flex-1">
              <span className="text-sm font-semibold text-[#141414]">Order amount</span>
              <input
                type="range"
                min={500}
                max={50000}
                step={100}
                value={cents}
                onChange={(e) => setCents(Number(e.target.value))}
                className="mt-3 w-full accent-[#ce1126]"
                aria-valuetext={formatTtdCents(cents)}
              />
              <span className="mt-1 block text-2xl font-black text-[#141414]">{formatTtdCents(cents)}</span>
            </label>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Plan for this quote">
              <button
                type="button"
                onClick={() => setPlan('free')}
                className={`min-h-[44px] rounded-full px-4 py-2 text-sm font-bold ${
                  plan === 'free' ? 'bg-[#0b1f24] text-white' : 'bg-[#f3eee6] text-[#141414]'
                }`}
              >
                Free · {freePct}
              </button>
              <button
                type="button"
                onClick={() => setPlan('premium')}
                className={`min-h-[44px] rounded-full px-4 py-2 text-sm font-bold ${
                  plan === 'premium' ? 'bg-[#0b1f24] text-white' : 'bg-[#f3eee6] text-[#141414]'
                }`}
              >
                Premium · {premPct}
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.cents}
                type="button"
                onClick={() => setCents(p.cents)}
                className={`min-h-[40px] rounded-full border px-3 py-1.5 text-sm font-semibold ${
                  cents === p.cents
                    ? 'border-[#ce1126] bg-[#ce1126] text-white'
                    : 'border-[#e8dcc8] bg-white text-[#141414] hover:border-[#ce1126]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {quotes.map(({ id, name, note, q }) => (
              <div
                key={id}
                className={`rounded-2xl border p-4 ${
                  q.zero_commission
                    ? 'border-[#0d9488]/40 bg-[#0d9488]/5'
                    : q.lowest_fee
                      ? 'border-[#f5c14a] bg-[#fff8e8]'
                      : 'border-[#e8dcc8] bg-[#faf7f2]'
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-bold text-[#141414]">{name}</h3>
                  <p className="text-xl font-black text-[#141414]">You keep {formatTtdCents(q.seller_net_cents)}</p>
                </div>
                <p className="mt-1 text-xs text-[#5c574e]">{note}</p>
                <ul className="mt-3 space-y-1 text-sm text-[#3d3932]">
                  {q.zero_commission ? (
                    <li>Juvay commission: TT$0.00</li>
                  ) : (
                    <>
                      <li>
                        Juvay fee: {formatTtdCents(q.juvay_fee_cents)}
                        {q.juvay_fee_cap_applied ? ' (cap applied)' : ''}
                      </li>
                      <li>
                        Wam fee (seller): {formatTtdCents(q.wam_fee_seller_cents)}
                      </li>
                    </>
                  )}
                  {q.buyer_card_fee_cents > 0 && (
                    <li>Buyer pays {formatTtdCents(q.buyer_card_fee_cents)} card flat · buyer total {formatTtdCents(q.total_buyer_pays_cents)}</li>
                  )}
                  {id === 'cod' && q.cod_handling_fee_cents > 0 && (
                    <li>
                      Buyer-paid handling (proposal, not a commission): {formatTtdCents(q.cod_handling_fee_cents)}. Buyer total{' '}
                      {formatTtdCents(q.total_buyer_pays_cents)}.
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-2 text-sm text-[#5c574e]">
            <p>
              Online Wam figures use the {WAM_RATE_LABEL.toLowerCase()}. Juvay does not hold your payout longer than Wam does —
              wallet payments are described as instant, cards as T+2. Cash never goes through Wam.
            </p>
            <p>
              Premium is TT$49 a month for the first 3 months, then TT$79, with the lower {premPct} fee. Sign-up for Premium is
              not open yet — the buy button stays off until online payments are ready.
            </p>
            <p>
              <Link to="/fees" className="font-semibold text-[#ce1126] underline-offset-2 hover:underline">
                See the full public rate card
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeeKeepCalculator;
