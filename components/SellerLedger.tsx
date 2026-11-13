/**
 * Seller ledger: pending vs available, Wam fee and Juvay fee as separate lines.
 * Never claims pay→fulfill is proven. Settlement follows Wam (wallet instant, card T+2).
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getToken } from '../services/selfHostedApi';
import { formatTtdCents, WAM_RATE_LABEL } from '../services/juvayFees';

interface LedgerEntry {
  id: string;
  entry_type: string;
  amount_cents: number;
  direction: 'credit' | 'debit';
  available_at?: string | null;
  created_at?: string;
  metadata?: Record<string, unknown>;
}

interface LedgerResponse {
  entries?: LedgerEntry[];
  available_net_cents?: number;
  pending_net_cents?: number;
  settlement_note?: string;
  note?: string;
}

function typeLabel(t: string): string {
  const map: Record<string, string> = {
    sale_gross: 'Sale',
    juvay_fee: 'Juvay fee',
    wam_fee: 'Wam fee',
    merchant_net: 'Seller net',
    refund_sale_gross: 'Refund (sale)',
    refund_juvay_fee: 'Refund (Juvay fee)',
    refund_wam_fee: 'Refund (Wam fee)',
    refund_merchant_net: 'Refund (seller net)',
    adjustment: 'Adjustment',
    payout: 'Payout',
  };
  return map[t] || t;
}

export const SellerLedger: React.FC = () => {
  const [data, setData] = useState<LedgerResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError('Sign in to see your ledger.');
      return;
    }
    fetch('/api/seller/ledger', { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(body.error || `Ledger failed (${r.status})`);
        setData(body);
      })
      .catch((e) => setError(e.message || 'Could not load ledger'));
  }, []);

  if (error && !data) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="text-lg font-bold text-gray-900">Payouts &amp; fees</h2>
        <p className="text-sm text-gray-500 mt-2">{error}</p>
      </div>
    );
  }

  const entries = data?.entries || [];
  const feeLines = entries.filter((e) =>
    e.entry_type === 'juvay_fee' || e.entry_type === 'wam_fee'
    || e.entry_type === 'refund_juvay_fee' || e.entry_type === 'refund_wam_fee'
  );

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Payouts &amp; fees</h2>
        <Link to="/fees" className="text-xs font-semibold text-red-600 hover:underline">Rate card</Link>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-green-50 border border-green-100 p-3">
          <p className="text-xs text-green-700 font-semibold">Available</p>
          <p className="text-xl font-black text-green-900">{formatTtdCents(data?.available_net_cents || 0)}</p>
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
          <p className="text-xs text-amber-700 font-semibold">Pending</p>
          <p className="text-xl font-black text-amber-900">{formatTtdCents(data?.pending_net_cents || 0)}</p>
        </div>
      </div>
      <p className="text-xs text-gray-500">
        {data?.settlement_note
          || `Juvay never holds funds beyond Wam settlement. Wallet is instant. Card is T+2 (${WAM_RATE_LABEL}).`}
        {' '}Ledger lines appear only after a payment is fulfilled once. This is not proof that pay→fulfill works live.
      </p>
      {feeLines.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Fee lines</p>
          <ul className="space-y-1 text-sm">
            {feeLines.slice(0, 20).map((e) => (
              <li key={e.id} className="flex justify-between text-gray-700">
                <span>{typeLabel(e.entry_type)}</span>
                <span className={e.direction === 'debit' ? 'text-red-700' : 'text-green-700'}>
                  {e.direction === 'debit' ? '−' : '+'}{formatTtdCents(e.amount_cents)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {entries.length === 0 && (
        <p className="text-sm text-gray-500">No ledger entries yet.</p>
      )}
    </div>
  );
};
