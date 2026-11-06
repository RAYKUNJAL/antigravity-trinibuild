import React from 'react';
import { ISLAND, STORE_STARTERS, type StarterId } from '../services/storeStarters';

function HeroPhoto({ id }: { id: StarterId }) {
  const s = STORE_STARTERS[id];
  return (
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
export function StarterThumb({ id, height = 220 }: { id: StarterId; height?: number }) {
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
      <IllustrativeMark />
    </div>
  );
}

export function StarterCardMeta({ id }: { id: StarterId }) {
  const s = STORE_STARTERS[id];
  return (
    <div>
      <div style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 16 }}>{s.name}</div>
      <p style={{ margin: '4px 0 0', color: '#6b6256', fontSize: 13, maxWidth: '42ch' }}>{s.useWhen}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {s.chips.map((chip) => (
          <span key={chip} style={{ fontSize: 11, border: '1px solid #cfc8bc', padding: '3px 8px', color: '#3d3429' }}>
            {chip}
          </span>
        ))}
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: '#6b6256' }}>{s.emptyCatalog}</div>
    </div>
  );
}

export default StarterThumb;
