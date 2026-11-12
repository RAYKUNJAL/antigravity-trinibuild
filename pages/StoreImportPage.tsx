/**
 * Bring my store over — URL, CSV, or bulk photos to draft products.
 * Premium-gated when IMPORT_REQUIRE_PREMIUM is on. 5 free photo listings
 * for every seller. Nothing is published until the seller reviews it.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getToken, storesApi } from '../services/selfHostedApi';
import { FONT_DISPLAY, FONT_SANS } from '../services/storeDesignTokens';
import { ISLAND } from '../services/storeStarters';

type Draft = {
  id?: string;
  name: string;
  description?: string;
  price?: number | null;
  price_found?: boolean;
  image_url?: string;
  category?: string;
  status?: string;
  note?: string;
};

type ImportStatus = {
  free_photo_listings: number;
  import_require_premium: boolean;
  premium: boolean;
  import: {
    allowed: boolean;
    locked?: boolean;
    coming_with_premium?: boolean;
    message?: string;
  };
  photo_quota: {
    used: number;
    cap: number | null;
    remaining: number | null;
    unlimited: boolean;
    locked?: boolean;
    message?: string;
  };
  message?: string;
};

type StoreRow = { id: string; name: string; slug: string; plan_tier?: string };

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(path, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`) as Error & { payload?: unknown; status?: number };
    err.payload = data;
    err.status = res.status;
    throw err;
  }
  return data as T;
}

function priceLabel(d: Draft) {
  if (d.price_found && d.price != null) return `TT$${Number(d.price)}`;
  return 'Add a TT$ price before you publish';
}

export const StoreImportPage: React.FC = () => {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [storeId, setStoreId] = useState('');
  const [status, setStatus] = useState<ImportStatus | null>(null);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [needLogin, setNeedLogin] = useState(!getToken());

  const load = useCallback(async (id?: string) => {
    if (!getToken()) {
      setNeedLogin(true);
      return;
    }
    setNeedLogin(false);
    const mine = (await storesApi.getMine()) as StoreRow[];
    setStores(mine || []);
    const chosen = id || storeId || mine?.[0]?.id || '';
    if (chosen && chosen !== storeId) setStoreId(chosen);
    if (!chosen) {
      setStatus(await api<ImportStatus>('/api/import/status'));
      return;
    }
    const qs = new URLSearchParams({ store_id: chosen });
    setStatus(await api<ImportStatus>(`/api/import/status?${qs}`));
  }, [storeId]);

  useEffect(() => {
    load().catch((e) => setError(e.message || 'Could not load import status.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!storeId) return;
    api<ImportStatus>(`/api/import/status?store_id=${encodeURIComponent(storeId)}`)
      .then(setStatus)
      .catch((e) => setError(e.message || 'Could not load import status.'));
  }, [storeId]);

  const run = async (label: string, fn: () => Promise<{ drafts?: Draft[]; warnings?: string[]; note?: string }>) => {
    setBusy(label);
    setError('');
    setWarnings([]);
    setNote('');
    try {
      const result = await fn();
      setDrafts(result.drafts || []);
      setWarnings(result.warnings || []);
      setNote(result.note || (result.drafts?.length ? 'Saved as drafts. Review each one and type any missing TT$ price before you publish.' : ''));
      await load(storeId);
    } catch (e: unknown) {
      const err = e as Error & { payload?: { error?: string; message?: string } };
      setError(err.payload?.error || err.payload?.message || err.message || 'Import failed.');
    } finally {
      setBusy('');
    }
  };

  const importLocked = !!status && !status.import.allowed;
  const photoLocked = !!status?.photo_quota.locked;
  const remaining = status?.photo_quota.unlimited
    ? 'Unlimited with Premium'
    : `${status?.photo_quota.remaining ?? 5} of ${status?.free_photo_listings ?? 5} free photo listings left`;

  return (
    <div style={{ minHeight: '100vh', background: '#FFF8F0', color: '#1a1a1a', fontFamily: FONT_SANS, padding: '32px 20px 96px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <p style={{ margin: '0 0 10px', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, color: '#6b6256' }}>
          Bring my store over
        </p>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 500, margin: '0 0 12px', letterSpacing: '-0.03em' }}>
          Draft your catalog from a site, a CSV, or photos.
        </h1>
        <p style={{ margin: '0 0 24px', color: '#5C574E', fontSize: 16, lineHeight: 1.6, maxWidth: '58ch' }}>
          Everything lands as a draft you review and confirm. A price is kept only when it is on the source page, in the CSV, or typed by you — never estimated. Every seller gets 5 free photo listings. Bring my store over (website or CSV) comes with Premium.
        </p>

        {needLogin ? (
          <div style={{ border: '1px solid #e6dfd4', background: '#fff', padding: 20, borderRadius: 12 }}>
            <p style={{ margin: '0 0 16px' }}>Sign in to import into your shop, or create a free store first.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link to="/login?next=/import-store" style={btnPrimary}>Sign in</Link>
              <Link to="/create-store" style={btnGhost}>Create your free store</Link>
            </div>
          </div>
        ) : stores.length === 0 ? (
          <div style={{ border: '1px solid #e6dfd4', background: '#fff', padding: 20, borderRadius: 12 }}>
            <p style={{ margin: '0 0 16px' }}>You need a store before drafts can be saved. Create one, then come back here.</p>
            <Link to="/create-store" style={btnPrimary}>Create your free store</Link>
          </div>
        ) : (
          <label style={{ display: 'grid', gap: 6, marginBottom: 24, fontSize: 14 }}>
            Store
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              style={field}
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
        )}

        <p style={{ margin: '0 0 24px', fontSize: 14, color: '#5C574E' }}>{remaining}.</p>

        {importLocked ? (
          <div style={{ border: '1px solid #e6dfd4', background: '#fff', padding: 20, borderRadius: 12, marginBottom: 28 }}>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, margin: '0 0 8px' }}>Coming with Premium</h2>
            <p style={{ margin: 0, color: '#5C574E', lineHeight: 1.55 }}>
              {status?.import.message || 'Bring my store over is coming with Premium. Premium checkout is not open yet.'}
            </p>
            <p style={{ margin: '12px 0 0', fontSize: 13, color: '#6b6256' }}>
              You can still use your free photo listings below. <Link to="/pricing" style={{ color: '#141414', fontWeight: 600 }}>See Premium</Link>
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 20, marginBottom: 28 }}>
            <section style={card}>
              <h2 style={h2}>Website or store URL</h2>
              <p style={help}>We read public product data (JSON-LD, Open Graph, or a Shopify products list). Private or local addresses are blocked.</p>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://"
                style={field}
                inputMode="url"
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  disabled={!storeId || !url.trim() || !!busy}
                  style={btnGhost}
                  onClick={() => run('url-preview', () => api('/api/import/url', {
                    method: 'POST',
                    body: JSON.stringify({ store_id: storeId, url: url.trim(), preview: true }),
                  }))}
                >
                  {busy === 'url-preview' ? 'Reading…' : 'Preview drafts'}
                </button>
                <button
                  type="button"
                  disabled={!storeId || !url.trim() || !!busy}
                  style={btnPrimary}
                  onClick={() => run('url', () => api('/api/import/url', {
                    method: 'POST',
                    body: JSON.stringify({ store_id: storeId, url: url.trim() }),
                  }))}
                >
                  {busy === 'url' ? 'Importing…' : 'Save as drafts'}
                </button>
              </div>
            </section>

            <section style={card}>
              <h2 style={h2}>CSV upload</h2>
              <p style={help}>Columns: name, description, price, image_url, category. Name is required. Leave price blank if you will type it later.</p>
              <input
                type="file"
                accept=".csv,text/csv"
                disabled={!storeId || !!busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  const body = new FormData();
                  body.append('store_id', storeId);
                  body.append('csv', file);
                  run('csv', () => api('/api/import/csv', { method: 'POST', body }));
                }}
              />
            </section>
          </div>
        )}

        <section style={card}>
          <h2 style={h2}>Bulk photos</h2>
          <p style={help}>
            Same photo-to-listing path as create-store. Vision can draft a name and description. You type the TT$ price. If vision is locked, nothing is invented.
            {photoLocked ? ` ${status?.photo_quota.message}` : ''}
          </p>
          {photoLocked ? (
            <p style={{ margin: 0, color: '#5C574E' }}>Coming with Premium — unlimited photo listings once Premium checkout is open.</p>
          ) : (
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={!storeId || !!busy}
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                e.target.value = '';
                if (!files.length) return;
                const body = new FormData();
                body.append('store_id', storeId);
                files.forEach((f) => body.append('photos', f));
                run('photos', () => api('/api/import/photos', { method: 'POST', body }));
              }}
            />
          )}
        </section>

        {error ? <p role="alert" style={{ marginTop: 20, color: '#9b1c1c' }}>{error}</p> : null}
        {note ? <p style={{ marginTop: 16, color: '#5C574E' }}>{note}</p> : null}
        {warnings.map((w) => (
          <p key={w} style={{ marginTop: 8, color: '#5C574E', fontSize: 14 }}>{w}</p>
        ))}

        {drafts.length > 0 ? (
          <div style={{ marginTop: 28 }}>
            <h2 style={h2}>Drafts to review</h2>
            <p style={{ ...help, marginBottom: 16 }}>These are not live. Open your dashboard to edit, add a price if it is missing, and publish when you are ready.</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
              {drafts.map((d, i) => (
                <li key={d.id || `${d.name}-${i}`} style={{ display: 'flex', gap: 12, background: '#fff', border: '1px solid #e6dfd4', borderRadius: 12, padding: 12 }}>
                  {d.image_url && !d.image_url.startsWith('data:') ? (
                    <img src={d.image_url} alt="" width={72} height={72} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, background: '#f3efe8' }} />
                  ) : (
                    <div style={{ width: 72, height: 72, borderRadius: 8, background: '#f3efe8', flex: '0 0 auto' }} />
                  )}
                  <div>
                    <div style={{ fontWeight: 600 }}>{d.name}</div>
                    {d.description ? <div style={{ fontSize: 13, color: '#5C574E', marginTop: 4 }}>{d.description}</div> : null}
                    <div style={{ fontSize: 13, marginTop: 6, color: d.price_found ? '#141414' : '#6b6256' }}>{priceLabel(d)}</div>
                  </div>
                </li>
              ))}
            </ul>
            <Link to="/dashboard" style={{ ...btnPrimary, display: 'inline-flex', marginTop: 16 }}>Review in dashboard</Link>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const field: React.CSSProperties = {
  width: '100%',
  minHeight: 48,
  border: '1px solid #cfc8bc',
  background: '#fff',
  padding: '0 12px',
  borderRadius: 8,
  fontSize: 15,
};
const card: React.CSSProperties = {
  border: '1px solid #e6dfd4',
  background: '#fff',
  padding: 20,
  borderRadius: 12,
};
const h2: React.CSSProperties = { fontFamily: FONT_DISPLAY, fontSize: 22, margin: '0 0 8px', fontWeight: 500 };
const help: React.CSSProperties = { margin: '0 0 12px', color: '#5C574E', fontSize: 14, lineHeight: 1.5 };
const btnPrimary: React.CSSProperties = {
  minHeight: 44,
  padding: '0 16px',
  border: 'none',
  borderRadius: 8,
  background: ISLAND.mango,
  color: ISLAND.mangoInk,
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  textDecoration: 'none',
};
const btnGhost: React.CSSProperties = {
  ...btnPrimary,
  background: 'transparent',
  color: '#141414',
  border: '1px solid #141414',
};

export default StoreImportPage;
