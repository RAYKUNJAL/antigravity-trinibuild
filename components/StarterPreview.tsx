import React from 'react';
import { ISLAND, STORE_STARTERS, type StarterId } from '../services/storeStarters';
import { heroStem } from '../services/storeDesignTokens';

function HeroPhoto({ id }: { id: StarterId }) {
  const s = STORE_STARTERS[id];
  return (
    <img
      src={s.heroImage}
      srcSet={s.heroSrcSet}
      sizes="(max-width: 800px) 100vw, 560px"
      alt=""
      width={800}
      height={450}
      loading="lazy"
      decoding="async"
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    />
  );
}

function IllustrativeMark() {
  return (
    <span
      style={{
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 3,
        background: ISLAND.mango,
        color: ISLAND.mangoInk,
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: 1.1,
        padding: '4px 8px',
      }}
    >
      ILLUSTRATIVE
    </span>
  );
}

/** Gallery + create-store thumbs. Always the real starter hero photo, never an emoji mock. */
export function StarterThumb({ id, height = 220, hideBadge = false }: { id: StarterId; height?: number; hideBadge?: boolean }) {
  const s = STORE_STARTERS[id];
  const photo = <HeroPhoto id={id} />;
  const headline: React.CSSProperties = {
    fontFamily: s.palette.headingFont,
    lineHeight: 1.05,
    margin: 0,
  };

  let body: React.ReactNode;
  switch (s.heroLayout) {
    case 'split':
      body = (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100%' }}>
          <div style={{ padding: '22px 14px 14px', color: s.palette.heroText, background: s.palette.heroBg }}>
            <div style={{ fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', opacity: 0.7 }}>{s.kicker}</div>
            <div style={{ ...headline, fontSize: 18, marginTop: 8 }}>{s.heroHeadline}</div>
            <div style={{ marginTop: 12, width: 72, height: 22, background: ISLAND.mango }} />
          </div>
          <div style={{ minHeight: 0, overflow: 'hidden' }}>{photo}</div>
        </div>
      );
      break;
    case 'split_reverse':
      body = (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100%' }}>
          <div style={{ minHeight: 0, overflow: 'hidden' }}>{photo}</div>
          <div style={{ padding: '22px 14px 14px', color: s.palette.heroText, background: s.palette.heroBg }}>
            <div style={{ fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', opacity: 0.7 }}>{s.kicker}</div>
            <div style={{ ...headline, fontSize: 18, marginTop: 8 }}>{s.heroHeadline}</div>
            <div style={{ marginTop: 12, width: 72, height: 22, background: ISLAND.mango }} />
          </div>
        </div>
      );
      break;
    case 'bleed':
      body = (
        <div style={{ height: '100%', position: 'relative' }}>
          {photo}
          <div style={{ position: 'absolute', left: 16, bottom: 16, right: 16, color: s.palette.heroText }}>
            <div style={{ fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', opacity: 0.8 }}>{s.kicker}</div>
            <div style={{ ...headline, fontStyle: 'italic', fontSize: 20, marginTop: 6 }}>{s.heroHeadline}</div>
            <div style={{ marginTop: 10, width: 72, height: 22, border: `1px solid ${s.palette.heroText}` }} />
          </div>
        </div>
      );
      break;
    case 'stack':
      body = (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: s.palette.surface }}>
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>{photo}</div>
          <div style={{ padding: '10px 14px 12px', color: s.palette.text }}>
            <div style={{ fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: s.palette.muted }}>{s.kicker}</div>
            <div style={{ ...headline, fontSize: 16, marginTop: 4 }}>{s.heroHeadline}</div>
          </div>
        </div>
      );
      break;
    case 'rail':
      body = (
        <div style={{ height: '100%', position: 'relative' }}>
          {photo}
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'rgba(10,15,20,0.82)', color: s.palette.heroText, padding: '10px 14px' }}>
            <div style={{ fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', opacity: 0.75 }}>{s.kicker}</div>
            <div style={{ ...headline, fontSize: 16, marginTop: 4 }}>{s.heroHeadline}</div>
          </div>
        </div>
      );
      break;
    case 'desk':
      body = (
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', height: '100%' }}>
          <div style={{ padding: '18px 14px 12px', color: s.palette.heroText, background: s.palette.heroBg }}>
            <div style={{ fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', opacity: 0.7 }}>{s.kicker}</div>
            <div style={{ ...headline, fontSize: 17, marginTop: 8 }}>{s.heroHeadline}</div>
            <div style={{ marginTop: 12, height: 28, border: `1px solid ${s.palette.heroText}`, opacity: 0.55 }} />
          </div>
          <div style={{ minHeight: 0, overflow: 'hidden' }}>{photo}</div>
        </div>
      );
      break;
    case 'card':
      body = (
        <div style={{ height: '100%', position: 'relative' }}>
          {photo}
          <div
            style={{
              position: 'absolute',
              right: 12,
              top: 28,
              bottom: 16,
              width: '46%',
              background: 'rgba(255,248,240,0.94)',
              color: s.palette.text,
              padding: '12px 12px 14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
            }}
          >
            <div style={{ fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: s.palette.muted }}>{s.kicker}</div>
            <div style={{ ...headline, fontSize: 16, marginTop: 6 }}>{s.heroHeadline}</div>
            <div style={{ marginTop: 10, width: 64, height: 20, background: ISLAND.mango }} />
          </div>
        </div>
      );
      break;
    default:
      body = (
        <div style={{ height: '100%', position: 'relative' }}>
          {photo}
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', padding: 16, color: s.palette.heroText }}>
            <div>
              <div style={{ ...headline, fontSize: 26 }}>{s.name}</div>
              <div style={{ fontSize: 11, marginTop: 6, opacity: 0.85 }}>{s.heroHeadline}</div>
            </div>
          </div>
        </div>
      );
  }

  return (
    <div style={{ height, background: s.palette.heroBg, color: s.palette.heroText, position: 'relative', overflow: 'hidden' }}>
      {body}
      {hideBadge ? null : <IllustrativeMark />}
    </div>
  );
}

export function StarterCardMeta({ id }: { id: StarterId }) {
  const s = STORE_STARTERS[id];
  return (
    <div>
      <div style={{ fontFamily: 'Georgia, "Iowan Old Style", Palatino, "Times New Roman", serif', fontSize: 16 }}>{s.name}</div>
      <p style={{ margin: '4px 0 0', color: '#6b6256', fontSize: 13, maxWidth: '42ch' }}>{s.useWhen}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {s.chips.map((chip) => (
          <span key={chip} style={{ fontSize: 11, border: '1px solid #cfc8bc', padding: '3px 8px', color: '#3d3429' }}>
            {chip}
          </span>
        ))}
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: '#6b6256' }}>Preview uses labeled sample items. A published shop starts empty until you add yours.</div>
    </div>
  );
}

export default StarterThumb;



/** Desktop + mobile preview used on the /templates gallery. Sample crops only. */
export function StarterGalleryCard({ id }: { id: StarterId }) {
  const s = STORE_STARTERS[id];
  const stem = heroStem(id);
  const samples = [1, 2, 3].map((n) => `/templates/samples/${stem}-${n}.webp`);
  return (
    <div
      style={{
        position: 'relative',
        background: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid #e6dfd4',
        boxShadow: '0 1px 2px rgba(20,20,20,0.04), 0 12px 32px rgba(20,20,20,0.05)',
      }}
    >
      <div style={{ height: 22, background: '#f3efe8', display: 'flex', alignItems: 'center', gap: 5, padding: '0 10px' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#d9d3c8' }} />
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#d9d3c8' }} />
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#d9d3c8' }} />
        <span style={{ marginLeft: 8, fontSize: 10, color: '#9a9286' }}>{s.name}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 132px', gap: 0, background: s.palette.bg, minHeight: 260 }}>
        <div style={{ minHeight: 0, overflow: 'hidden', position: 'relative' }}>
          <StarterThumb id={id} height={200} hideBadge />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '8px 10px 12px', background: s.palette.bg }}>
            {samples.map((src) => (
              <div key={src} style={{ aspectRatio: s.cardAspect || '1 / 1', overflow: 'hidden', borderRadius: 6, background: s.palette.surface }}>
                <img src={src} alt="" width={200} height={200} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            ))}
          </div>
        </div>
        {/* Mobile frame */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 12px 16px 0' }}>
          <div
            style={{
              width: 108,
              height: 220,
              borderRadius: 16,
              overflow: 'hidden',
              border: '3px solid #1a1a1a',
              background: s.palette.bg,
              boxShadow: '0 8px 20px rgba(20,20,20,0.12)',
            }}
          >
            <StarterThumb id={id} height={110} hideBadge />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: 6 }}>
              {samples.slice(0, 2).map((src) => (
                <div key={src} style={{ aspectRatio: '1 / 1', overflow: 'hidden', borderRadius: 3 }}>
                  <img src={src} alt="" width={80} height={80} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <span
        style={{
          position: 'absolute',
          top: 30,
          right: 10,
          zIndex: 3,
          background: ISLAND.mango,
          color: ISLAND.mangoInk,
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: 1.1,
          padding: '4px 8px',
        }}
      >
        ILLUSTRATIVE
      </span>
    </div>
  );
}
