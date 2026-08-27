import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { GALLERY_FILTERS, ISLAND, starterList, resolveStarterId, isStarterId, STORE_STARTERS, type StarterId } from '../services/storeStarters';
import { JuvayStorefront, illustrativeModel } from './storefront/JuvayStorefront';

function BrowserChrome({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 8px 28px rgba(20,20,20,0.08)', overflow: 'hidden' }}>
      <div style={{ height: 22, background: '#f3efe8', display: 'flex', alignItems: 'center', gap: 5, padding: '0 10px' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#d9d3c8' }} />
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#d9d3c8' }} />
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#d9d3c8' }} />
      </div>
      {children}
    </div>
  );
}

function StarterThumb({ id }: { id: StarterId }) {
  const s = STORE_STARTERS[id];
  const photo = (
    <img
      src={s.heroImage}
      alt=""
      width={800}
      height={450}
      loading="lazy"
      decoding="async"
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    />
  );
  return (
    <div style={{ height: 220, background: s.palette.heroBg, color: s.palette.heroText, position: 'relative', overflow: 'hidden' }}>
      {s.heroLayout === 'split' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100%' }}>
          <div style={{ padding: '28px 16px 16px' }}>
            <div style={{ fontFamily: s.palette.headingFont, fontSize: 22, lineHeight: 1.05 }}>{s.heroHeadline}</div>
            <div style={{ marginTop: 14, width: 72, height: 22, background: ISLAND.mango }} />
          </div>
          <div style={{ minHeight: 0, overflow: 'hidden' }}>{photo}</div>
        </div>
      ) : s.heroLayout === 'bleed' ? (
        <div style={{ height: '100%', position: 'relative' }}>
          {photo}
          <div style={{ position: 'absolute', left: 18, bottom: 18, right: 18 }}>
            <div style={{ fontFamily: s.palette.headingFont, fontStyle: 'italic', fontSize: 22, lineHeight: 1.05 }}>{s.heroHeadline}</div>
            <div style={{ marginTop: 12, width: 72, height: 22, border: `1px solid ${s.palette.heroText}` }} />
          </div>
        </div>
      ) : (
        <div style={{ height: '100%', position: 'relative' }}>
          {photo}
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', padding: 16 }}>
            <div>
              <div style={{ fontFamily: s.palette.headingFont, fontSize: 28 }}>{s.name}</div>
              <div style={{ fontSize: 11, marginTop: 6, opacity: 0.85 }}>{s.heroHeadline}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const TemplateGallery: React.FC<{ onSelectTemplate?: (template: { id: string }) => void }> = ({
  onSelectTemplate,
}) => {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const starters = useMemo(() => starterList(), []);
  const [q, setQ] = useState('');

  const routeId = params.starterId || '';
  const queryPreview = searchParams.get('preview');
  const category = searchParams.get('cat') || 'all';

  const previewId: StarterId | null = (() => {
    if (routeId && (isStarterId(routeId) || routeId === 'basic') && (queryPreview === '1' || queryPreview === 'true' || queryPreview === routeId || !queryPreview)) {
      return resolveStarterId(routeId);
    }
    if (queryPreview && queryPreview !== '1' && queryPreview !== 'true') {
      return resolveStarterId(queryPreview);
    }
    if (routeId && (isStarterId(routeId) || routeId === 'basic')) {
      return resolveStarterId(routeId);
    }
    return null;
  })();

  const filtered = starters.filter((s) => {
    const catOk = category === 'all' || s.id === category;
    const needle = q.trim().toLowerCase();
    const qOk = !needle || s.name.toLowerCase().includes(needle) || s.useWhen.toLowerCase().includes(needle);
    return catOk && qOk;
  });

  const openPreview = (galleryId: string) => {
    navigate(`/templates/${galleryId}?preview=1`);
  };

  const closePreview = () => {
    navigate('/templates', { replace: false });
  };

  const useTemplate = (galleryId: string) => {
    const starter = resolveStarterId(galleryId);
    onSelectTemplate?.({ id: starter });
    navigate(`/create-store?template=${starter}`);
  };

  useEffect(() => {
    if (routeId && !isStarterId(routeId) && routeId !== 'basic') {
      navigate('/templates', { replace: true });
    }
  }, [routeId, navigate]);

  return (
    <div style={{ minHeight: '100vh', background: ISLAND.sand, color: '#1a1a1a', fontFamily: "'Source Sans 3', system-ui, sans-serif" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Source+Sans+3:wght@400;600&display=swap" />
      <div style={{ padding: '56px 24px 28px', textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 400, margin: '0 0 20px' }}>
          Pick a starter you can actually run
        </h1>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #1a1a1a', paddingBottom: 8, maxWidth: 360, margin: '0 auto' }}>
          <Search size={16} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search starters"
            style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: 15 }}
          />
        </label>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 22 }}>
          {GALLERY_FILTERS.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                if (cat.id === 'all') next.delete('cat');
                else next.set('cat', cat.id);
                setSearchParams(next, { replace: true });
              }}
              style={{
                minHeight: 44,
                padding: '0 14px',
                borderRadius: 4,
                border: `1px solid ${category === cat.id ? '#1a1a1a' : '#cfc8bc'}`,
                background: category === cat.id ? '#1a1a1a' : 'transparent',
                color: category === cat.id ? ISLAND.sand : '#1a1a1a',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '12px 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }} className="juvay-picker-grid">
          {filtered.map((starter) => (
            <article key={starter.galleryId}>
              <button
                type="button"
                onClick={() => openPreview(starter.galleryId)}
                style={{ display: 'block', width: '100%', border: 'none', padding: 0, background: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <BrowserChrome>
                  <div style={{ position: 'relative' }}>
                    <StarterThumb id={starter.id} />
                    <div style={{ position: 'absolute', left: 12, bottom: 12, background: 'rgba(255,248,240,0.94)', color: '#111', minHeight: 32, padding: '0 12px', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 11 }}>
                      Preview Full Size
                    </div>
                  </div>
                </BrowserChrome>
              </button>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 12, gap: 8 }}>
                <div>
                  <div style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 16 }}>{starter.name}</div>
                  <p style={{ margin: '4px 0 0', color: '#6b6256', fontSize: 13, maxWidth: '40ch' }}>{starter.useWhen}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => openPreview(starter.galleryId)}
                  style={{ minHeight: 44, padding: '0 14px', border: '1px solid #1a1a1a', background: 'transparent', cursor: 'pointer' }}
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => useTemplate(starter.galleryId)}
                  style={{ minHeight: 44, padding: '0 14px', border: 'none', background: ISLAND.mango, color: ISLAND.mangoInk, fontWeight: 700, cursor: 'pointer' }}
                >
                  Use / Customize
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {previewId && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={closePreview}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,20,0.55)', zIndex: 80, display: 'flex', justifyContent: 'center', padding: 16, overflow: 'auto' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 1040, background: ISLAND.sand, alignSelf: 'flex-start', margin: '12px 0 32px' }}
          >
            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e6dfd4' }}>
              <div>
                <div style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}>{STORE_STARTERS[previewId].name}</div>
                <div style={{ color: '#6b6256', fontSize: 12, marginTop: 2 }}>Share: /templates/{previewId}?preview=1</div>
              </div>
              <button type="button" onClick={closePreview} aria-label="Close preview" style={{ width: 44, height: 44, border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ maxHeight: '78vh', overflow: 'auto' }}>
              <JuvayStorefront model={illustrativeModel(previewId)} />
            </div>
            <div style={{ padding: 16, display: 'flex', gap: 8, background: ISLAND.sand }}>
              <button type="button" onClick={closePreview} style={{ minHeight: 44, padding: '0 16px', border: '1px solid #1a1a1a', background: 'transparent' }}>
                Back
              </button>
              <button
                type="button"
                onClick={() => useTemplate(previewId)}
                style={{ minHeight: 44, padding: '0 16px', border: 'none', background: ISLAND.mango, color: ISLAND.mangoInk, fontWeight: 700 }}
              >
                Use / Customize
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @media (max-width: 900px) {
          .juvay-picker-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default TemplateGallery;
