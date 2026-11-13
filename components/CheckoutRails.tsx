/**
 * Checkout payment rails in approved order:
 * Wam wallet (lowest fee) → card → cash pickup (free) → COD.
 * Two-line fee disclosure. Soft nudge on small card orders. No hard minimum.
 * Does not claim online pay→fulfill is live; Wam options disable when not configured.
 */
import React from 'react';
import { Banknote, CreditCard, Store, Wallet } from 'lucide-react';
import type { FeeQuote, PaymentRail } from '../services/juvayFees';
import { formatFeePercent, formatTtdCents, WAM_RATE_LABEL } from '../services/juvayFees';

export interface CheckoutRailsProps {
  quotes: Record<PaymentRail, FeeQuote>;
  selected: PaymentRail;
  onSelect: (rail: PaymentRail) => void;
  wamConfigured: boolean;
  cashConfirmed?: boolean;
  onCashConfirmed?: (v: boolean) => void;
}

const RAIL_META: Record<PaymentRail, { title: string; Icon: typeof Wallet; blurb: string }> = {
  wam_wallet: {
    title: 'Wam wallet',
    Icon: Wallet,
    blurb: 'Pay in the Wam app. Lowest online fee.',
  },
  wam_card: {
    title: 'Card',
    Icon: CreditCard,
    blurb: 'Debit or credit card through Wam.',
  },
  cash_pickup: {
    title: 'Cash pickup',
    Icon: Store,
    blurb: 'Pay cash when you collect the order. No Juvay commission.',
  },
  cod: {
    title: 'Cash on delivery',
    Icon: Banknote,
    blurb: 'Pay cash when the order arrives. No Juvay commission.',
  },
};

export const CheckoutRails: React.FC<CheckoutRailsProps> = ({
  quotes,
  selected,
  onSelect,
  wamConfigured,
  cashConfirmed,
  onCashConfirmed,
}) => {
  const order: PaymentRail[] = ['wam_wallet', 'wam_card', 'cash_pickup', 'cod'];
  const selectedQuote = quotes[selected];
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-gray-900">Payment</h2>

      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-700 space-y-1">
        <p>
          <span className="font-semibold">Juvay fee: </span>
          sellers pay {formatFeePercent(quotes.wam_wallet.juvay_fee_bps || 450)} on Free
          ({formatFeePercent(250)} on Premium) of the item subtotal on successful online Wam sales,
          capped at {formatTtdCents(quotes.wam_wallet.juvay_fee_cap_cents || 2500)}. 0% on cash.
          This is not added to your total.
        </p>
        <p>
          <span className="font-semibold">Wam processing ({WAM_RATE_LABEL}): </span>
          {formatFeePercent(quotes.wam_wallet.wam_pct_bps || 200)} on wallet;
          {' '}{formatFeePercent(quotes.wam_card.wam_pct_bps || 300)} + {formatTtdCents(quotes.wam_card.wam_flat_fee_cents || 150)} on card
          (you pay the {formatTtdCents(quotes.wam_card.buyer_card_fee_cents || 150)} card fee when you choose card).
          Cash pickup is free of both fees.
        </p>
      </div>

      <div className="space-y-3">
        {order.map((rail) => {
          const q = quotes[rail];
          if (!q) return null;
          const meta = RAIL_META[rail];
          const online = rail === 'wam_wallet' || rail === 'wam_card';
          const disabled = online && !wamConfigured;
          const active = selected === rail;
          return (
            <button
              key={rail}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(rail)}
              className="w-full text-left rounded-2xl border-2 p-4 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={active
                ? { borderColor: '#16a34a', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }
                : { borderColor: '#e5e7eb', background: '#fff' }}
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <meta.Icon size={22} className="text-gray-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-gray-900">{meta.title}</p>
                    {q.lowest_fee && (
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                        Lowest fee
                      </span>
                    )}
                    {rail === 'cash_pickup' && (
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-gray-900 text-white px-2 py-0.5 rounded-full">
                        Free
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{meta.blurb}</p>
                  {disabled && (
                    <p className="text-xs text-amber-800 mt-1">
                      Online Wam pay is not configured on this host. Use cash pickup or cash on delivery.
                    </p>
                  )}
                  <div className="mt-2 text-sm">
                    <p className="font-bold text-gray-900">You pay {formatTtdCents(q.total_buyer_pays_cents)}</p>
                    {q.buyer_card_fee_cents > 0 && (
                      <p className="text-xs text-gray-600">includes {formatTtdCents(q.buyer_card_fee_cents)} card fee</p>
                    )}
                    {q.cod_handling_fee_cents > 0 && (
                      <p className="text-xs text-gray-600">includes {formatTtdCents(q.cod_handling_fee_cents)} COD handling (proposal)</p>
                    )}
                    {q.zero_commission && (
                      <p className="text-xs text-green-700 font-semibold">0% Juvay commission</p>
                    )}
                  </div>
                  {rail === 'wam_card' && q.nudge && (
                    <p className="mt-2 text-xs text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1">
                      {q.nudge.wallet}. Or {q.nudge.add_item} — a suggestion, not a requirement.
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {(selected === 'cod' || selected === 'cash_pickup') && onCashConfirmed && (
        <label className="flex items-start gap-3 cursor-pointer rounded-2xl bg-green-50 border border-green-200 p-4">
          <input
            type="checkbox"
            checked={!!cashConfirmed}
            onChange={(e) => onCashConfirmed(e.target.checked)}
            className="mt-1"
          />
          <span className="text-xs text-green-800 font-semibold leading-relaxed">
            I confirm I&apos;ll have {formatTtdCents(selectedQuote?.total_buyer_pays_cents || 0)} ready in cash
            {selected === 'cod' ? ' when the order arrives' : ' when I collect the order'}.
          </span>
        </label>
      )}

      {selectedQuote && (
        <div className="rounded-xl border border-gray-200 p-4 text-sm space-y-1">
          <div className="flex justify-between text-gray-600">
            <span>Items</span><span>{formatTtdCents(selectedQuote.subtotal_cents)}</span>
          </div>
          {selectedQuote.delivery_fee_cents > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Delivery</span><span>{formatTtdCents(selectedQuote.delivery_fee_cents)}</span>
            </div>
          )}
          {selectedQuote.buyer_card_fee_cents > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Card fee ({WAM_RATE_LABEL})</span><span>{formatTtdCents(selectedQuote.buyer_card_fee_cents)}</span>
            </div>
          )}
          {selectedQuote.cod_handling_fee_cents > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>COD handling</span><span>{formatTtdCents(selectedQuote.cod_handling_fee_cents)}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-gray-900 pt-2 border-t border-gray-100">
            <span>You pay</span><span>{formatTtdCents(selectedQuote.total_buyer_pays_cents)}</span>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Seller fees (Juvay and Wam) come out of the seller&apos;s proceeds, except the visible card fee.
        A charge does not fulfill the order until Wam confirms. See <a href="/fees" className="underline">the rate card</a>.
      </p>
    </div>
  );
};
