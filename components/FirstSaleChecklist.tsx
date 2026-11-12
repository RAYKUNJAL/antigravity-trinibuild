/**
 * Empty-store path to a first sale: photo, priced item, share link, stall QR.
 * Honest — share and QR stay undone unless we know. No invented "3x orders" claims.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Circle } from 'lucide-react';
import { getToken } from '../services/selfHostedApi';

interface Step { id: string; label: string; done: boolean; hint: string }

export const FirstSaleChecklist: React.FC<{ onShare?: () => void; slug?: string }> = ({ onShare, slug }) => {
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [ready, setReady] = useState(false);
  const [signPath, setSignPath] = useState(slug ? `/store/${slug}/sign` : '');

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch('/api/seller/ops', { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) return;
        setSteps(body.checklist?.steps || []);
        setReady(!!body.checklist?.ready_for_orders);
        if (body.stall_sign_path) setSignPath(body.stall_sign_path);
      })
      .catch(() => { /* leave unset */ });
  }, []);

  if (!steps) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
      <h2 className="text-lg font-bold text-gray-900">Path to your first sale</h2>
      <p className="text-xs text-gray-500">
        {ready
          ? 'Your shop has a priced item and a photo. Share the link and print the stall sign.'
          : 'Four steps. We only tick what is actually on your shop — no sample products.'}
      </p>
      <ul className="space-y-3">
        {steps.map((s) => (
          <li key={s.id} className="flex items-start gap-3">
            {s.done
              ? <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              : <Circle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${s.done ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{s.label}</p>
              <p className="text-xs text-gray-500">{s.hint}</p>
              {s.id === 'photo' && !s.done && (
                <Link to="/store-builder" className="text-xs font-semibold text-red-600">Add a photo</Link>
              )}
              {s.id === 'price' && !s.done && (
                <Link to="/store-builder" className="text-xs font-semibold text-red-600">Add a priced item</Link>
              )}
              {s.id === 'share' && (
                <button type="button" onClick={onShare} className="text-xs font-semibold text-red-600">Share on WhatsApp</button>
              )}
              {s.id === 'qr' && signPath && (
                <Link to={signPath} className="text-xs font-semibold text-red-600">Open stall sign</Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FirstSaleChecklist;
