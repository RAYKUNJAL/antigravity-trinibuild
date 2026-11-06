import React, { useState } from 'react';
import { ISLAND } from '../services/storeStarters';
import { getToken } from '../services/selfHostedApi';

export type ItemPatch = {
  name?: string;
  price?: string;
  qty?: string;
  sku?: string;
  variant?: string;
  description?: string;
  image?: string;
  tags?: string[];
};

function readImage(file: File, onDone: (dataUrl: string) => void) {
  if (!file.type.startsWith('image/')) return;
  if (file.size > 2_500_000) return;
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    const max = 1200;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    onDone(canvas.toDataURL('image/jpeg', 0.84));
  };
  img.src = url;
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 44,
  border: '1px solid #cfc8bc',
  background: ISLAND.sand,
  padding: '0 12px',
};

async function requestVision(payload: { image: string; templateId?: string; storeName?: string }) {
  const token = getToken();
  const res = await fetch('/api/onboard/vision', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Vision failed (${res.status})`);
  return data as {
    agentWrote: boolean;
    locked?: boolean;
    warning?: string;
    draft: { name: string; description: string; tags: string[] };
  };
}

export const MerchantItemFields: React.FC<{
  heading?: string;
  presentation?: 'default' | 'landing' | 'create-store';
  name: string;
  price: string;
  qty: string;
  sku: string;
  variant: string;
  description: string;
  image: string;
  tags?: string[];
  storeName?: string;
  templateId?: string;
  onChange: (patch: ItemPatch) => void;
}> = ({
  heading = 'Add item',
  presentation = 'default',
  name, price, qty, sku, variant, description, image, tags = [],
  storeName, templateId, onChange,
}) => {
  const [busy, setBusy] = useState(false);
  const [warning, setWarning] = useState('');
  const [error, setError] = useState('');
  const [locked, setLocked] = useState(false);
  const [applied, setApplied] = useState(false);
  const [proposed, setProposed] = useState<{ name: string; description: string; tags: string[]; conflict: boolean } | null>(null);
  const landing = presentation === 'landing';
  const createStore = presentation === 'create-store';

  const takeFile = (file: File | undefined) => {
    if (!file) return;
    readImage(file, (url) => {
      onChange({ image: url });
      setProposed(null);
      setWarning('');
      setError('');
      setLocked(false);
      setApplied(false);
    });
  };

  const draftFromPhoto = async () => {
    if (!image) {
      setError('Take or upload a photo first.');
      return;
    }
    setBusy(true);
    setError('');
    setWarning('');
    setLocked(false);
    setApplied(false);
    try {
      const result = await requestVision({ image, templateId, storeName });
      if (!result.agentWrote) {
        setProposed(null);
        setLocked(result.locked === true || /locked|not writing|did not write|credits/i.test(result.warning || ''));
        setWarning(result.warning || 'Vision is not writing this listing. Type the name and TT$ price yourself.');
        return;
      }
      const draft = result.draft || { name: '', description: '', tags: [] };
      const conflict = !!(name.trim() || description.trim());
      setProposed({
        name: draft.name || '',
        description: draft.description || '',
        tags: Array.isArray(draft.tags) ? draft.tags : [],
        conflict,
      });
    } catch (err: any) {
      setProposed(null);
      setLocked(true);
      setError(err.message || 'Could not draft from photo.');
      setWarning('Vision did not write this listing. Type the name and TT$ price yourself.');
    } finally {
      setBusy(false);
    }
  };

  const applyDraft = () => {
    if (!proposed) return;
    onChange({
      name: proposed.name,
      description: proposed.description,
      tags: proposed.tags,
    });
    setProposed(null);
    setApplied(true);
  };

  const applyBtn = (
    <button
      type="button"
      onClick={applyDraft}
      disabled={!proposed}
      style={{
        minHeight: 44,
        padding: '0 14px',
        border: 'none',
        background: '#141414',
        color: ISLAND.sand,
        cursor: proposed ? 'pointer' : 'not-allowed',
        opacity: proposed ? 1 : 0.45,
        fontWeight: 700,
      }}
    >
      Apply to this listing
    </button>
  );

  const takePhoto = (
    <label
      style={{
        minHeight: 44,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 16px',
        cursor: 'pointer',
        fontWeight: 700,
        border: 'none',
        background: landing ? '#E31C23' : ISLAND.mango,
        color: landing ? '#fff' : ISLAND.mangoInk,
      }}
    >
      <input
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => { takeFile(e.target.files?.[0]); e.target.value = ''; }}
      />
      Take photo
    </label>
  );

  const uploadPhoto = (
    <label
      style={{
        minHeight: 44,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 16px',
        cursor: 'pointer',
        fontWeight: 600,
        border: '1px solid #141414',
        background: 'transparent',
        color: '#141414',
      }}
    >
      <input
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => { takeFile(e.target.files?.[0]); e.target.value = ''; }}
      />
      {image && !landing ? 'Replace photo' : 'Upload photo'}
    </label>
  );

  const draftBtn = (
    <button
      type="button"
      onClick={draftFromPhoto}
      disabled={busy || !image}
      style={{
        minHeight: 44,
        padding: '0 16px',
        border: 'none',
        background: ISLAND.mango,
        color: ISLAND.mangoInk,
        fontWeight: 700,
        cursor: image ? 'pointer' : 'not-allowed',
        opacity: image ? 1 : 0.45,
      }}
    >
      {busy ? 'Reading photo…' : 'Draft name from photo'}
    </button>
  );

  const lockedPanel = (locked || warning) && !proposed ? (
    <div style={{ fontSize: 13, color: '#3d3429', border: '1px solid #cfc8bc', background: '#fff', padding: 12 }}>
      <strong>{locked ? 'Vision locked' : 'Vision did not write'}</strong>
      <div style={{ marginTop: 6 }}>{warning || 'Type the name and TT$ price yourself. Nothing was invented.'}</div>
    </div>
  ) : null;

  const appliedPanel = applied && !proposed ? (
    <div style={{ fontSize: 13, color: '#14532d', border: '1px solid #84cc16', background: '#f7fee7', padding: 12 }}>
      Listing draft updated. Name and description below are what you confirmed. Type the TT$ price — it stays empty until you type it.
    </div>
  ) : null;

  const proposedPanel = proposed ? (
    <div style={{ border: '1px solid #cfc8bc', padding: 12, display: 'grid', gap: 8, background: '#fff' }}>
      <div style={{ fontSize: 13, color: '#6b6256' }}>
        {proposed.conflict
          ? 'You already typed a name or description. Apply replaces that text. Keep mine leaves yours.'
          : 'Confirm this draft to fill name and description. Price and qty stay empty until you type them.'}
      </div>
      <div><strong>Name</strong> {proposed.name || '(empty)'}</div>
      {proposed.description ? <div><strong>Description</strong> {proposed.description}</div> : null}
      {proposed.tags.length ? <div style={{ fontSize: 12, color: '#6b6256' }}>{proposed.tags.join(' · ')}</div> : null}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {applyBtn}
        <button type="button" onClick={() => setProposed(null)} style={{ minHeight: 44, padding: '0 14px', border: '1px solid #141414', background: 'transparent' }}>
          Keep mine
        </button>
      </div>
    </div>
  ) : null;

  const listingFields = (
    <>
      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Name</span>
        <input value={name} onChange={(e) => onChange({ name: e.target.value })} placeholder="What is in the photo" style={fieldStyle} />
      </label>
      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Description</span>
        <textarea
          value={description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="What the photo shows (optional)"
          rows={3}
          style={{ ...fieldStyle, minHeight: 66, padding: 12 }}
        />
      </label>
      {tags.length ? <div style={{ fontSize: 12, color: '#6b6256' }}>Tags {tags.join(' · ')}</div> : null}
      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Price (TT$) — you type this</span>
        <input value={price} onChange={(e) => onChange({ price: e.target.value })} placeholder="Empty until you type it" inputMode="decimal" style={fieldStyle} />
      </label>
      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Quantity on hand</span>
        <input value={qty} onChange={(e) => onChange({ qty: e.target.value })} placeholder="Empty = do not claim stock" inputMode="numeric" style={fieldStyle} />
      </label>
      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>SKU / code (optional)</span>
        <input value={sku} onChange={(e) => onChange({ sku: e.target.value })} style={fieldStyle} />
      </label>
      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Variant (size / color, optional)</span>
        <input value={variant} onChange={(e) => onChange({ variant: e.target.value })} style={fieldStyle} />
      </label>
    </>
  );

  if (landing || createStore) {
    return (
      <div
        className={landing ? 'grid md:grid-cols-2 gap-6 text-left' : undefined}
        style={createStore ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 } : undefined}
        data-juvay-vision={createStore ? 'create-store' : 'landing'}
      >
        <div
          className={landing ? 'rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm' : undefined}
          style={createStore ? { border: '1px solid #141414', background: '#fff', padding: 20 } : undefined}
        >
          <p className={landing ? 'text-xs font-bold uppercase tracking-wider text-gray-500 mb-2' : undefined} style={createStore ? { fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', margin: '0 0 8px' } : undefined}>
            Step 1 — Photo
          </p>
          <h3 className={landing ? 'text-xl font-black text-gray-900 mb-2' : undefined} style={createStore ? { fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 22, fontWeight: 400, margin: '0 0 8px' } : undefined}>
            Take a picture of what you sell
          </h3>
          <p className={landing ? 'text-sm text-gray-600 mb-4' : undefined} style={createStore ? { margin: '0 0 14px', fontSize: 14, color: '#6b6256' } : undefined}>
            Vision can draft a name and description from the photo. You type the TT$ price. It never invents a product or a price.
          </p>
          <div
            className={landing ? 'mb-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 overflow-hidden flex items-center justify-center' : undefined}
            style={{ minHeight: 180, ...(createStore ? { marginBottom: 14, border: '1px dashed #cfc8bc', background: ISLAND.sand, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}) }}
          >
            {image ? (
              <img src={image} alt="" className={landing ? 'w-full h-full object-cover' : undefined} style={{ width: '100%', minHeight: 180, maxHeight: 220, objectFit: 'cover' }} />
            ) : (
              <span className={landing ? 'text-sm text-gray-400' : undefined} style={createStore ? { fontSize: 13, color: '#6b6256' } : undefined}>No photo yet</span>
            )}
          </div>
          <div className={landing ? 'flex flex-wrap gap-2 mb-3' : undefined} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {takePhoto}
            {uploadPhoto}
          </div>
          {image ? <div style={{ marginBottom: 12 }}>{draftBtn}</div> : null}
          {lockedPanel}
          {error && !warning ? <div className={landing ? 'text-sm text-red-600' : undefined} style={{ fontSize: 13, color: '#E31C23' }}>{error}</div> : null}
        </div>

        <div
          className={landing ? 'rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm' : undefined}
          style={createStore ? { border: '1px solid #e6dfd4', background: ISLAND.sand, padding: 20, display: 'grid', gap: 10 } : undefined}
        >
          <p className={landing ? 'text-xs font-bold uppercase tracking-wider text-gray-500 mb-2' : undefined} style={createStore ? { fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', margin: 0 } : undefined}>
            Step 2 — Confirm the listing
          </p>
          <p className={landing ? 'text-sm text-gray-600 mb-4' : undefined} style={createStore ? { margin: '0 0 8px', fontSize: 14, color: '#6b6256' } : undefined}>
            Apply the draft you see, or type over it. Price stays empty until you type TT$.
          </p>
          {appliedPanel}
          {proposedPanel}
          <div className={landing ? 'grid gap-3' : undefined} style={{ display: 'grid', gap: 10 }}>
            {listingFields}
          </div>
        </div>
        <style>{`
          @media (max-width: 800px) {
            [data-juvay-vision="create-store"] { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <section style={{ display: 'grid', gap: 8 }} data-juvay-vision="studio">
      <div style={{ fontSize: 13, fontWeight: 600 }}>{heading}</div>
      <p style={{ margin: 0, fontSize: 12, color: '#6b6256' }}>
        Take or upload a photo. Draft name and description only. You type TT$. Apply updates the fields below — it does not overwrite until you confirm.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {takePhoto}
        {uploadPhoto}
      </div>
      {image ? (
        <img src={image} alt="" style={{ width: '100%', maxWidth: 220, height: 140, objectFit: 'cover', border: '1px solid #e6dfd4' }} />
      ) : null}
      {draftBtn}
      {lockedPanel}
      {error && !warning ? <div style={{ fontSize: 13, color: '#E31C23' }}>{error}</div> : null}
      {appliedPanel}
      {proposedPanel}
      {listingFields}
    </section>
  );
};
