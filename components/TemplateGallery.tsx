import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import { starterList, resolveStarterId, isStarterId, type StarterId } from '../services/storeStarters';
import { JuvayStorefront, illustrativeModel } from './storefront/JuvayStorefront';

const CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'food', name: 'Food' },
  { id: 'fashion', name: 'Fashion' },
  { id: 'services', name: 'Services' },
  { id: 'general', name: 'General' },
  { id: 'beauty', name: 'Beauty' },
  { id: 'home', name: 'Home' },
];

export const TemplateGallery: React.FC<{ onSelectTemplate?: (template: { id: string }) => void }> = ({
  onSelectTemplate,
}) => {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const starters = useMemo(() => starterList(true), []);

  const routeId = params.starterId || '';
  const queryPreview = searchParams.get('preview');
  const category = searchParams.get('cat') || 'all';

  const previewId: StarterId | null = (() => {
    if (routeId && (isStarterId(routeId) || routeId === 'basic') && (queryPreview === '1' || queryPreview === 'true' || !queryPreview)) {
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

  const filtered = category === 'all'
    ? starters
    : starters.filter((s) => s.id === category);

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
    <div style={{ minHeight: '100vh', background: '#0c0c0c', color: '#f5f0e8', fontFamily: "'Source Sans 3', system-ui, sans-serif" }}>
      <div style={{ padding: '48px 20px 36px', textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: '#c4a574', fontWeight: 700, marginBottom: 12 }}>JUVAY · STORE STARTERS</div>
        <h1 style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 'clamp(28px, 6vw, 46px)', lineHeight: 1.1, margin: '0 0 12px' }}>
          Six starters. Your name on the door.
        </h1>
        <p style={{ color: '#9a9184', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
          Same chrome. The type changes the blocks. Preview is labeled illustrative — a published shop never ships dummy SKUs.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 24 }}>
          {CATEGORIES.map((cat) => (
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
                padding: '0 16px',
                borderRadius: 999,
                border: `1px solid ${category === cat.id ? '#c4a574' : '#2a2a2a'}`,
                background: category === cat.id ? '#c4a574' : 'transparent',
                color: category === cat.id ? '#1a1a1a' : '#c4c0b6',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px 72px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {filtered.map((starter) => (
            <article
              key={starter.galleryId}
              style={{ background: '#141414', border: '1px solid #242424', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
              <button
                type="button"
                onClick={() => openPreview(starter.galleryId)}
                style={{
                  display: 'block',
                  width: '100%',
                  height: 220,
                  overflow: 'hidden',
                  border: 'none',
                  padding: '40px 16px 58px',
                  cursor: 'pointer',
                  position: 'relative',
                  background: starter.palette.heroBg,
                  color: starter.palette.heroText,
                  textAlign: 'left',
                }}
              >
                <div style={{ fontFamily: starter.palette.headingFont, fontSize: 22, lineHeight: 1.15, maxWidth: '90%' }}>
                  {starter.heroHeadline}
                </div>
                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>{starter.name} · empty catalog</div>
                <div style={{ position: 'absolute', top: 10, left: 10, background: starter.palette.accent, color: starter.palette.accentText, borderRadius: 999, padding: '4px 10px', fontSize: 10, fontWeight: 800 }}>
                  ILLUSTRATIVE
                </div>
                <div style={{ position: 'absolute', left: 10, right: 10, bottom: 10, background: '#fff', color: '#111', borderRadius: 999, minHeight: 44, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13 }}>
                  Preview Full Size
                </div>
              </button>
              <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                <div>
                  <div style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 20 }}>{starter.name}</div>
                  <p style={{ margin: '6px 0 0', color: '#9a9184', fontSize: 13, lineHeight: 1.45 }}>{starter.useWhen}</p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {starter.chips.map((chip) => (
                    <span key={chip} style={{ background: '#1d1d1d', color: '#c4c0b6', borderRadius: 6, padding: '4px 8px', fontSize: 11 }}>{chip}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <button
                    type="button"
                    onClick={() => openPreview(starter.galleryId)}
                    style={{ flex: 1, minHeight: 44, borderRadius: 10, border: '1px solid #2a2a2a', background: '#1a1a1a', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => useTemplate(starter.galleryId)}
                    style={{ flex: 1, minHeight: 44, borderRadius: 10, border: 'none', background: '#c4a574', color: '#1a1a1a', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    Use / Customize <ArrowRight size={14} />
                  </button>
                </div>
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
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 80, display: 'flex', justifyContent: 'center', padding: 16, overflow: 'auto' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 430, background: '#111', borderRadius: 20, overflow: 'hidden', border: '1px solid #2a2a2a', alignSelf: 'flex-start', margin: '12px 0 32px' }}
          >
            <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222' }}>
              <div>
                <div style={{ fontWeight: 800 }}>{STARTER_LABEL(previewId)}</div>
                <div style={{ color: '#8a8478', fontSize: 12, marginTop: 2 }}>Share: /templates/{previewId}?preview=1</div>
              </div>
              <button type="button" onClick={closePreview} aria-label="Close preview" style={{ width: 44, height: 44, borderRadius: 999, border: 'none', background: '#1a1a1a', color: '#fff', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
              <JuvayStorefront model={illustrativeModel(previewId)} />
            </div>
            <div style={{ padding: 16, display: 'flex', gap: 8 }}>
              <button type="button" onClick={closePreview} style={{ flex: 1, minHeight: 44, borderRadius: 10, border: '1px solid #2a2a2a', background: '#1a1a1a', color: '#c4c0b6', fontWeight: 700 }}>
                Back
              </button>
              <button
                type="button"
                onClick={() => useTemplate(previewId)}
                style={{ flex: 2, minHeight: 44, borderRadius: 10, border: 'none', background: '#c4a574', color: '#1a1a1a', fontWeight: 800 }}
              >
                Use / Customize
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function STARTER_LABEL(id: StarterId): string {
  const names: Record<StarterId, string> = {
    food: 'Food',
    fashion: 'Fashion',
    services: 'Services',
    general: 'General',
    beauty: 'Beauty',
    home: 'Home',
  };
  return names[id];
}

export default TemplateGallery;
