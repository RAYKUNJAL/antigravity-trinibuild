/**
 * Seller growth level badge and next-step copy. Levels are earned, never bought.
 * The Verified badge stays free. No invented ratings or sold counts.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getToken } from '../services/selfHostedApi';
import { LEVEL_BLURBS, type SellerLevelResponse, type SellerLevelId } from '../services/sellerLevels';
import { formatTtdCents } from '../services/juvayFees';

const TONE: Record<SellerLevelId, string> = {
  starter: 'bg-gray-100 text-gray-800',
  rising: 'bg-amber-100 text-amber-900',
  pro: 'bg-sky-100 text-sky-900',
  market_leader: 'bg-emerald-100 text-emerald-900',
};

export const SellerGrowthCard: React.FC = () => {
  const [data, setData] = useState<SellerLevelResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError('Sign in to see your level.');
      return;
    }
    fetch('/api/seller/level', { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(body.error || `Level failed (${r.status})`);
        setData(body);
      })
      .catch((e) => setError(e.message || 'Could not load level'));
  }, []);

  if (error && !data) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="text-lg font-bold text-gray-900">Your shop level</h2>
        <p className="text-sm text-gray-500 mt-2">{error}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="text-lg font-bold text-gray-900">Your shop level</h2>
        <p className="text-sm text-gray-500 mt-2">Loading…</p>
      </div>
    );
  }

  const s = data.stats;
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-gray-900">Your shop level</h2>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${TONE[data.level]}`}>{data.label}</span>
      </div>
      <p className="text-sm text-gray-600">{LEVEL_BLURBS[data.level]}</p>
      {data.tenth_order_prompt && (
        <p className="text-sm font-semibold text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          {data.tenth_order_prompt}
        </p>
      )}
      <ul className="text-xs text-gray-600 space-y-1">
        <li>{s.completedOrders} completed order{s.completedOrders === 1 ? '' : 's'}</li>
        {s.reviewCount > 0 && s.ratingAverage != null ? (
          <li>Rated {s.ratingAverage.toFixed(1)} from {s.reviewCount} review{s.reviewCount === 1 ? '' : 's'} on completed orders</li>
        ) : (
          <li>No reviews yet</li>
        )}
        {s.wamVerified ? <li>Wam verified (this badge is free)</li> : <li>Wam verified is free, and is required for Pro and Market Leader.</li>}
        {s.onlineGmv90dCents > 0 && (
          <li>Online Wam sales in 90 days: {formatTtdCents(s.onlineGmv90dCents)}</li>
        )}
      </ul>
      {data.next && data.next_reasons.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">To reach {data.next_label}</p>
          <ul className="text-xs text-gray-600 list-disc pl-4 space-y-0.5">
            {data.next_reasons.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </div>
      )}
      <p className="text-xs text-gray-500">
        Levels are earned from real completed orders. You cannot buy a level.
        See the <Link to="/fees" className="underline text-red-600">rate card</Link>.
      </p>
    </div>
  );
};

export default SellerGrowthCard;
