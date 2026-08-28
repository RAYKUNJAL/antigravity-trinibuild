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
  name, price, qty, sku, variant, description, image,
  storeName, templateId, onChange,
}) => {
  const [busy, setBusy] = useState(false);
  const [warning, setWarning] = useState('');
  const [error, setError] = useState('');
  const [proposed, setProposed] = useState<{ name: string; description: string; tags: string[]; conflict: boolean } | null>(null);

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

  return (
    <section style={{ display: 'grid', gap: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{heading}</div>
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <label style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', border: '1px solid #cfc8bc', padding: '0 12px', cursor: 'pointer' }}>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={(e) => { takeFile(e.target.files?.[0]); e.target.value = ''; }}
            />
            Take photo
          </label>
          <label style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', border: '1px solid #cfc8bc', padding: '0 12px', cursor: 'pointer' }}>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => { takeFile(e.target.files?.[0]); e.target.value = ''; }}
            />
            {image ? 'Replace photo' : 'Upload photo'}
          </label>
        </div>
        {image ? (
          <img src={image} alt="" style={{ width: '100%', maxWidth: 220, height: 140, objectFit: 'cover', border: '1px solid #e6dfd4' }} />
        ) : null}
        <button
          type="button"
          onClick={draftFromPhoto}
          disabled={busy || !image}
          style={{
            minHeight: 44,
            border: 'none',
            background: ISLAND.mango,
            color: ISLAND.mangoInk,
            fontWeight: 700,
            cursor: image ? 'pointer' : 'not-allowed',
            opacity: image ? 1 : 0.45,
          }}
        >
          {busy ? 'Reading photo…' : 'Draft from photo'}
        </button>
        <p style={{ margin: 0, fontSize: 12, color: '#6b6256' }}>
          Photo drafts name and description only. You type TT$ and qty. SKU is optional — empty is fine.
        </p>
        {warning ? <div style={{ fontSize: 13, color: '#6b6256', border: '1px solid #e6dfd4', padding: 10 }}>{warning}</div> : null}
        {error ? <div style={{ fontSize: 13, color: '#E31C23' }}>{error}</div> : null}
        {proposed ? (
          <div style={{ border: '1px solid #cfc8bc', padding: 12, display: 'grid', gap: 8, background: '#fff' }}>
            <div style={{ fontSize: 13, color: '#6b6256' }}>
              {proposed.conflict ? 'You already typed a name. Apply to replace it, or keep yours.' : 'Vision draft — apply to use it. Price and qty stay empty.'}
            </div>
            <div><strong>Name</strong> {proposed.name || '(empty)'}</div>
            {proposed.description ? <div><strong>Description</strong> {proposed.description}</div> : null}
            {proposed.tags.length ? <div style={{ fontSize: 12, color: '#6b6256' }}>{proposed.tags.join(' · ')}</div> : null}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button type="button" onClick={applyDraft} style={{ minHeight: 44, padding: '0 14px', border: 'none', background: '#141414', color: ISLAND.sand }}>Apply draft</button>
              <button type="button" onClick={() => setProposed(null)} style={{ minHeight: 44, padding: '0 14px', border: '1px solid #141414', background: 'transparent' }}>Keep mine</button>
            </div>
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
