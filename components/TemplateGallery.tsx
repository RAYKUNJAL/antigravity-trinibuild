import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { GALLERY_FILTERS, ISLAND, starterList, resolveStarterId, isStarterId, STORE_STARTERS, type StarterId } from '../services/storeStarters';
import { FONT_DISPLAY, FONT_SANS, RADIUS } from '../services/storeDesignTokens';
import { JuvayStorefront, illustrativeModel } from './storefront/JuvayStorefront';
import { StarterGalleryCard, StarterCardMeta } from './StarterPreview';

export const TemplateGallery: React.FC<{ onSelectTemplate?: (template: { id: string }) => void }> = ({
  onSelectTemplate,
}) => {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const starters = useMemo(() => starterList(), []);
  const [q, setQ] = useState('');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

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
    const bucket = s.galleryCategory || s.id;
    const catOk = category === 'all' || bucket === category || s.id === category;
    const needle = q.trim().toLowerCase();
    const qOk = !needle || s.name.toLowerCase().includes(needle) || s.useWhen.toLowerCase().includes(needle) || bucket.includes(needle.replace(' ', '_'));
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
    <div style={{ minHeight: '100vh', background: '#F6F1E8', color: '#1a1a1a', fontFamily: FONT_SANS }}>
      <div style={{ padding: '72px 24px 32px', textAlign: 'center', maxWidth: 680, margin: '0 auto' }}>
        <p style={{ margin: '0 0 12px', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, color: '#6b6256' }}>
          Juvay store templates
        </p>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 500, margin: '0 0 16px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          A professional shop, ready for your photos.
        </h1>
        <p style={{ margin: '0 0 28px', color: '#5C574E', fontSize: 16, lineHeight: 1.6 }}>
          Ten original Caribbean starters. Previews use clearly labeled sample items. A published store only shows what you add — and a small “Sample image” mark stays on starter art until you replace it.
        </p>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #d9d1c5', background: '#fff', borderRadius: RADIUS.sm, padding: '0 14px', maxWidth: 400, margin: '0 auto', minHeight: 48 }}>
          <Search size={16} color="#6b6256" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search templates"
            style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: 15 }}
          />
        </label>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 24 }}>
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
                padding: '0 16px',
                borderRadius: 999,
                border: `1px solid ${category === cat.id ? '#1a1a1a' : '#d9d1c5'}`,
                background: category === cat.id ? '#1a1a1a' : '#fff',
                color: category === cat.id ? '#F6F1E8' : '#1a1a1a',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '8px 24px 96px' }}>
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 40 }}
          className="juvay-picker-grid"
        >
          {filtered.map((starter) => (
            <article key={starter.galleryId} style={{ display: 'flex', flexDirection: 'column' }}>
              <button
                type="button"
                onClick={() => openPreview(starter.galleryId)}
                style={{ display: 'block', width: '100%', border: 'none', padding: 0, background: 'none', cursor: 'pointer', textAlign: 'left' }}
                aria-label={`Preview ${starter.name}`}
              >
                <StarterGalleryCard id={starter.id} />
              </button>
              <div style={{ marginTop: 16, flex: 1 }}>
                <StarterCardMeta id={starter.id} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => useTemplate(starter.galleryId)}
                  style={{
                    minHeight: 48,
                    flex: 1,
                    padding: '0 16px',
                    border: 'none',
                    borderRadius: 8,
                    background: ISLAND.mango,
                    color: ISLAND.mangoInk,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  Use this template
                </button>
                <button
                  type="button"
                  onClick={() => openPreview(starter.galleryId)}
                  style={{
                    minHeight: 48,
                    padding: '0 16px',
                    border: '1px solid #1a1a1a',
                    borderRadius: 8,
                    background: 'transparent',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  Preview
                </button>
              </div>
            </article>
          ))}
        </div>
        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b6256', padding: 48 }}>No templates match that search.</p>
        ) : null}
      </div>

      {previewId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${STORE_STARTERS[previewId].name} preview`}
          onClick={closePreview}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,20,0.55)', zIndex: 80, display: 'flex', justifyContent: 'center', padding: 16, overflow: 'auto' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 1080, background: '#F6F1E8', alignSelf: 'flex-start', margin: '12px 0 32px', borderRadius: 12, overflow: 'hidden' }}
          >
            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e6dfd4', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20 }}>{STORE_STARTERS[previewId].name}</div>
                <div style={{ color: '#6b6256', fontSize: 12, marginTop: 2 }}>ILLUSTRATIVE · Sample items are labeled · Share: /templates/{previewId}?preview=1</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setPreviewMode('desktop')}
                  style={{ minHeight: 40, padding: '0 14px', borderRadius: 999, border: 'none', fontWeight: 700, cursor: 'pointer', background: previewMode === 'desktop' ? ISLAND.mango : '#fff', color: ISLAND.mangoInk }}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('mobile')}
                  style={{ minHeight: 40, padding: '0 14px', borderRadius: 999, border: 'none', fontWeight: 700, cursor: 'pointer', background: previewMode === 'mobile' ? ISLAND.mango : '#fff', color: ISLAND.mangoInk }}
                >
                  Mobile
                </button>
                <button type="button" onClick={closePreview} aria-label="Close preview" style={{ width: 44, height: 44, border: 'none', background: 'transparent', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>
            </div>
            <div style={{ maxHeight: '78vh', overflow: 'auto', background: '#e8e0d4' }}>
              <div style={{ maxWidth: previewMode === 'mobile' ? 390 : '100%', margin: '0 auto', boxShadow: previewMode === 'mobile' ? '0 8px 32px rgba(20,20,20,0.12)' : undefined }}>
                <JuvayStorefront model={illustrativeModel(previewId)} />
              </div>
            </div>
            <div style={{ padding: 16, display: 'flex', gap: 8, background: '#F6F1E8' }}>
              <button type="button" onClick={closePreview} style={{ minHeight: 48, padding: '0 16px', border: '1px solid #1a1a1a', background: 'transparent', borderRadius: 8, fontWeight: 600 }}>
                Back
              </button>
              <button
                type="button"
                onClick={() => useTemplate(previewId)}
                style={{ minHeight: 48, padding: '0 20px', border: 'none', background: ISLAND.mango, color: ISLAND.mangoInk, fontWeight: 700, borderRadius: 8, fontSize: 14 }}
              >
                Use this template
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @media (max-width: 800px) {
          .juvay-picker-grid { grid-template-columns: 1fr !important; gap: 36px !important; }
        }
      `}</style>
    </div>
  );
};

export default TemplateGallery;
