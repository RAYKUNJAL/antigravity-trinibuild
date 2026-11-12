/**
 * Public Juvay rate card. Plain copy. Does not state a Premium monthly price
 * (that is "coming soon" until a Premium price is locked). Wam figures are
 * the published rate — confirm with Wam. Does not claim pay→fulfill works.
 */
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { publicRateCard, formatFeePercent, formatTtdCents, FEE_DEFAULTS } from '../services/juvayFees';

type Card = ReturnType<typeof publicRateCard>;

export default function FeesPage() {
  const [card, setCard] = useState<Card>(publicRateCard());

  useEffect(() => {
    fetch('/api/fees')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.juvay_fee_bps_free) setCard(data as Card);
      })
      .catch(() => { /* keep client defaults */ });
  }, []);

  const freePct = formatFeePercent(card.juvay_fee_bps_free);
  const premPct = formatFeePercent(card.juvay_fee_bps_premium);
  const cap = formatTtdCents(card.juvay_fee_cap_cents);
  const cardFlat = formatTtdCents(card.wam.card_flat_cents);
  const walletPct = formatFeePercent(card.wam.wallet_pct_bps);
  const cardPct = formatFeePercent(card.wam.card_pct_bps);

  return (
    <>
      <Helmet>
        <title>Fees | Juvay</title>
        <meta
          name="description"
          content={`Juvay is free to start, with unlimited listings and 0% on cash. ${freePct} on Free and ${premPct} on Premium for online Wam sales, capped at ${cap}.`}
        />
        <link rel="canonical" href="https://juvay.app/fees" />
      </Helmet>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4 py-16">
            <p className="text-xs font-bold uppercase tracking-widest text-red-600 mb-3">Rate card</p>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Juvay fees, in plain words</h1>
            <p className="text-lg text-gray-600">
              A free store, unlimited listings, and no commission on cash. Online Wam sales
              carry a capped Juvay fee, and Wam&apos;s own processing fee is passed through — we never absorb it.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
          <section className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">What you pay Juvay</h2>
            <ul className="space-y-3 text-sm text-gray-700">
              {[
                'Free store. No credit card to sign up.',
                'Unlimited listings. No listing fee.',
                '0% Juvay commission on cash pickup and cash on delivery.',
                `${freePct} Juvay fee on Free, on successful online Wam sales (wallet or card). Computed on the item subtotal. Capped at ${cap} per order. No minimum fee.`,
                `${premPct} Juvay fee on Premium, same rules, same ${cap} cap.`,
                'No payout fee. No monthly fee on Free.',
                'We give 30 days’ notice before any fee change.',
                'Ads are optional. Promoted listings are not for sale yet.',
                'Discounts run only when the seller opts in.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-gray-500">{card.premium_pricing}.</p>
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Wam processing — pass-through</h2>
            <p className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
              {card.wam.label}. Volume rates are unpublished. Bank payout is {formatTtdCents(card.wam.bank_payout_cents)}.
            </p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl border border-gray-100 p-4">
                <dt className="font-semibold text-gray-900">Wam wallet</dt>
                <dd className="text-gray-600 mt-1">{walletPct}, no flat fee. Settles {card.wam.wallet_settlement}. Lowest online fee. The percentage is borne by the seller.</dd>
              </div>
              <div className="rounded-xl border border-gray-100 p-4">
                <dt className="font-semibold text-gray-900">Card</dt>
                <dd className="text-gray-600 mt-1">
                  {cardPct} + {cardFlat}. The seller pays the percentage. By default the buyer pays the {cardFlat} as a visible card fee.
                  Settles {card.wam.card_settlement}.
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-gray-600">
              Juvay never holds seller funds longer than Wam does. A payment is not fulfilled until Wam confirms —
              we do not claim that path is proven live.
            </p>
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Cash on delivery</h2>
            <p className="text-sm text-gray-600">
              No Juvay commission. A separate buyer-paid handling fee may apply
              (default {formatTtdCents(card.cod_handling_fee_cents_default)}). That fee is a proposal, not a commission,
              and is shown at checkout before you place the order.
            </p>
          </section>

          <p className="text-sm text-gray-500">
            Paid plan monthly prices live on the{' '}
            <Link to="/pricing" className="text-red-600 font-semibold hover:underline">plans page</Link>
            {' '}when they are offered. This page is only the transaction-fee rate card.
            Defaults used if the server is unreachable: Free {formatFeePercent(FEE_DEFAULTS.juvayFeeBpsFree)}, Premium {formatFeePercent(FEE_DEFAULTS.juvayFeeBpsPremium)}, cap {formatTtdCents(FEE_DEFAULTS.juvayFeeCapCents)}.
          </p>
        </div>
      </div>
    </>
  );
}
