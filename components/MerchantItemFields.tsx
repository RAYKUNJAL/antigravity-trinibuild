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
    warning?: string;
    draft: { name: string; description: string; tags: string[] };
  };
}

export const MerchantItemFields: React.FC<{
  heading?: string;
  presentation?: 'default' | 'landing';
  name: string;
  price: string;
  qty: string;
  sku: string;
  variant: string;
  description: string;
  image: string;
  storeName?: string;
  templateId?: string;
  onChange: (patch: ItemPatch) => void;
}> = ({
  heading = 'Add item',
  presentation = 'default',
  name, price, qty, sku, variant, description, image,
  storeName, templateId, onChange,
}) => {
  const [busy, setBusy] = useState(false);
  const [warning, setWarning] = useState('');
  const [error, setError] = useState('');
  const [proposed, setProposed] = useState<{ name: string; description: string; tags: string[]; conflict: boolean } | null>(null);
  const landing = presentation === 'landing';

  const takeFile = (file: File | undefined) => {
    if (!file) return;
    readImage(file, (url) => {
      onChange({ image: url });
      setProposed(null);
      setWarning('');
      setError('');
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
    try {
      const result = await requestVision({ image, templateId, storeName });
      if (!result.agentWrote) {
        setProposed(null);
        setWarning(result.warning || 'Vision is not writing this listing. Type the name and price yourself.');
        return;
      }
      const draft = result.draft || { name: '', description: '', tags: [] };
      setProposed({
        name: draft.name || '',
        description: draft.description || '',
        tags: Array.isArray(draft.tags) ? draft.tags : [],
        conflict: !!name.trim(),
      });
    } catch (err: any) {
      setError(err.message || 'Could not draft from photo.');
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
      Apply draft
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
      {busy ? 'Reading photo…' : landing ? 'Use photo to draft details' : 'Draft from photo'}
    </button>
  );

  if (landing) {
    return (
      <div className="grid md:grid-cols-2 gap-6 text-left">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Step 1 — Add a photo</p>
          <h3 className="text-xl font-black text-gray-900 mb-2">Use your camera or upload an image</h3>
          <p className="text-sm text-gray-600 mb-4">Start with a real product photo to draft the basics faster.</p>
          <div
            className="mb-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 overflow-hidden flex items-center justify-center"
            style={{ minHeight: 180 }}
          >
            {image ? (
              <img src={image} alt="" className="w-full h-full object-cover" style={{ minHeight: 180, maxHeight: 220 }} />
            ) : (
              <span className="text-sm text-gray-400">Photo preview</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {takePhoto}
            {uploadPhoto}
          </div>
          {image ? <div className="mb-3">{draftBtn}</div> : null}
          {warning ? <div className="text-sm text-gray-600 border border-gray-200 p-3 mb-2">{warning}</div> : null}
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Step 2 — Review and finish the item</p>
          <div className="mb-5">
            <p className="text-sm font-bold text-gray-900 mb-3">Required</p>
            <label className="block mb-3">
              <span className="block text-sm font-semibold text-gray-800 mb-1">Product name</span>
              <input value={name} onChange={(e) => onChange({ name: e.target.value })} style={fieldStyle} />
            </label>
            <label className="block mb-3">
              <span className="block text-sm font-semibold text-gray-800 mb-1">Price (TT$)</span>
              <input value={price} onChange={(e) => onChange({ price: e.target.value })} inputMode="decimal" style={fieldStyle} />
            </label>
            <label className="block">
              <span className="block text-sm font-semibold text-gray-800 mb-1">Quantity on hand</span>
              <input value={qty} onChange={(e) => onChange({ qty: e.target.value })} inputMode="numeric" style={fieldStyle} />
            </label>
          </div>
          <div className="mb-5">
            <p className="text-sm font-bold text-gray-900 mb-3">Optional</p>
            <label className="block mb-3">
              <span className="block text-sm font-semibold text-gray-800 mb-1">Product description (optional)</span>
              <textarea
                value={description}
                onChange={(e) => onChange({ description: e.target.value })}
                rows={3}
                style={{ ...fieldStyle, minHeight: 66, padding: 12 }}
              />
            </label>
            <label className="block mb-3">
              <span className="block text-sm font-semibold text-gray-800 mb-1">SKU or item code (optional)</span>
              <input value={sku} onChange={(e) => onChange({ sku: e.target.value })} style={fieldStyle} />
            </label>
            <label className="block">
              <span className="block text-sm font-semibold text-gray-800 mb-1">Variant, such as size or color (optional)</span>
              <input value={variant} onChange={(e) => onChange({ variant: e.target.value })} style={fieldStyle} />
            </label>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {applyBtn}
            {proposed ? (
              <button type="button" onClick={() => setProposed(null)} style={{ minHeight: 44, padding: '0 14px', border: '1px solid #141414', background: 'transparent' }}>Keep mine</button>
            ) : null}
          </div>
          {proposed ? (
            <div className="border border-gray-200 p-3 text-sm grid gap-2 bg-gray-50">
              <div className="text-gray-600">
                {proposed.conflict ? 'You already typed a name. Apply to replace it, or keep yours.' : 'Vision draft — apply to use it. Price and qty stay empty.'}
              </div>
              <div><strong>Name</strong> {proposed.name || '(empty)'}</div>
              {proposed.description ? <div><strong>Description</strong> {proposed.description}</div> : null}
              {proposed.tags.length ? <div className="text-gray-500">{proposed.tags.join(' · ')}</div> : null}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <section style={{ display: 'grid', gap: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{heading}</div>
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {takePhoto}
          {uploadPhoto}
        </div>
        {image ? (
          <img src={image} alt="" style={{ width: '100%', maxWidth: 220, height: 140, objectFit: 'cover', border: '1px solid #e6dfd4' }} />
        ) : null}
        {draftBtn}
        <p style={{ margin: 0, fontSize: 12, color: '#6b6256' }}>
          Photo drafts name and description only. You type TT$ and qty. SKU is optional — empty is fine.
        </p>
        {warning ? <div style={{ fontSize: 13, color: '#6b6256', border: '1px solid #e6dfd4', padding: 10 }}>{warning}</div> : null}
        {error ? <div style={{ fontSize: 13, color: '#E31C23' }}>{error}</div> : null}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {applyBtn}
          {proposed ? (
            <button type="button" onClick={() => setProposed(null)} style={{ minHeight: 44, padding: '0 14px', border: '1px solid #141414', background: 'transparent' }}>Keep mine</button>
          ) : null}
        </div>
        {proposed ? (
          <div style={{ border: '1px solid #cfc8bc', padding: 12, display: 'grid', gap: 8, background: '#fff' }}>
            <div style={{ fontSize: 13, color: '#6b6256' }}>
              {proposed.conflict ? 'You already typed a name. Apply to replace it, or keep yours.' : 'Vision draft — apply to use it. Price and qty stay empty.'}
            </div>
            <div><strong>Name</strong> {proposed.name || '(empty)'}</div>
            {proposed.description ? <div><strong>Description</strong> {proposed.description}</div> : null}
            {proposed.tags.length ? <div style={{ fontSize: 12, color: '#6b6256' }}>{proposed.tags.join(' · ')}</div> : null}
          </div>
        ) : null}
      </div>
      <input value={name} onChange={(e) => onChange({ name: e.target.value })} placeholder="Name" style={fieldStyle} />
      <textarea
        value={description}
        onChange={(e) => onChange({ description: e.target.value })}
        placeholder="Description (optional)"
        rows={3}
        style={{ ...fieldStyle, minHeight: 66, padding: 12 }}
      />
      <input value={price} onChange={(e) => onChange({ price: e.target.value })} placeholder="Price TT$ (required)" inputMode="decimal" style={fieldStyle} />
      <input value={qty} onChange={(e) => onChange({ qty: e.target.value })} placeholder="Qty on hand (empty = do not claim stock)" inputMode="numeric" style={fieldStyle} />
      <input value={sku} onChange={(e) => onChange({ sku: e.target.value })} placeholder="SKU / code (optional)" style={fieldStyle} />
      <input value={variant} onChange={(e) => onChange({ variant: e.target.value })} placeholder="Optional variant (size / color)" style={fieldStyle} />
    </section>
  );
};
