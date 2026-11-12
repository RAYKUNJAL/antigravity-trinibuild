/**
 * Open now / Sold out today (store) and Sold out (per product). Merchant only.
 * prep_minutes is a typed estimate — empty means we do not show a ready time.
 */
import React, { useEffect, useState } from 'react';
import { getToken } from '../services/selfHostedApi';

interface ProductRow {
  id: string;
  name: string;
  sold_out: boolean;
  price?: number;
}

export const StoreAvailabilityToggles: React.FC = () => {
  const [token] = useState(() => getToken());
  const [soldOutToday, setSoldOutToday] = useState(false);
  const [openNow, setOpenNow] = useState<boolean | null>(null);
  const [prep, setPrep] = useState('');
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' };

  useEffect(() => {
    if (!token) return;
    fetch('/api/seller/ops', { headers })
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(body.error || 'Could not load availability');
        setSoldOutToday(!!body.store?.sold_out_today);
        setOpenNow(typeof body.store?.open_now === 'boolean' ? body.store.open_now : null);
        setPrep(body.store?.prep_minutes != null ? String(body.store.prep_minutes) : '');
        setProducts(body.products || []);
      })
      .catch((e) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) return null;

  const patchStore = async (body: Record<string, unknown>) => {
    setMsg('');
    setErr('');
    const r = await fetch('/api/seller/availability', { method: 'PATCH', headers, body: JSON.stringify(body) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      setErr(data.error || 'Update failed');
      return;
    }
    setMsg('Saved.');
  };

  const patchProduct = async (id: string, sold_out: boolean) => {
    setMsg('');
    setErr('');
    const r = await fetch(`/api/seller/products/${id}/availability`, {
      method: 'PATCH', headers, body: JSON.stringify({ sold_out }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      setErr(data.error || 'Update failed');
      return;
    }
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, sold_out } : p)));
    setMsg('Saved.');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Open now / Sold out</h2>
      <p className="text-xs text-gray-500">Buyers only see these when you set them. An unset Open toggle does not claim you are open or closed.</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { setOpenNow(true); patchStore({ open_now: true }); }}
          className={`min-h-[44px] px-4 rounded-full text-sm font-semibold border ${openNow === true ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200'}`}
        >
          Open now
        </button>
        <button
          type="button"
          onClick={() => { setOpenNow(false); patchStore({ open_now: false }); }}
          className={`min-h-[44px] px-4 rounded-full text-sm font-semibold border ${openNow === false ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200'}`}
        >
          Closed
        </button>
        <button
          type="button"
          onClick={() => { setSoldOutToday((v) => { const n = !v; patchStore({ sold_out_today: n }); return n; }); }}
          className={`min-h-[44px] px-4 rounded-full text-sm font-semibold border ${soldOutToday ? 'bg-red-600 text-white border-red-600' : 'border-gray-200'}`}
        >
          {soldOutToday ? 'Sold out today — on' : 'Mark sold out today'}
        </button>
      </div>
      <label className="block text-sm text-gray-700">
        Estimated ready time (minutes)
        <input
          type="number"
          min="0"
          max="1440"
          value={prep}
          placeholder="Leave empty to hide"
          onChange={(e) => setPrep(e.target.value)}
          onBlur={() => patchStore({ prep_minutes: prep === '' ? null : Number(prep) })}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </label>
      {products.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Items</p>
          <ul className="space-y-2">
            {products.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{p.name}</span>
                <button
                  type="button"
                  onClick={() => patchProduct(p.id, !p.sold_out)}
                  className={`min-h-[40px] px-3 rounded-full text-xs font-semibold border ${p.sold_out ? 'bg-red-50 text-red-800 border-red-200' : 'border-gray-200'}`}
                >
                  {p.sold_out ? 'Sold out' : 'In stock'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {msg && <p className="text-xs text-green-700">{msg}</p>}
      {err && <p className="text-xs text-red-700">{err}</p>}
    </div>
  );
};

export default StoreAvailabilityToggles;
