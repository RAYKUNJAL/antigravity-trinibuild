import React from 'react';
import { STORE_STARTERS, type StarterId } from '../../services/storeStarters';
import {
  closedFoodNextOpen,
  currencyPrefix,
  emptyCatalogCopy,
  featuredItems,
  formatPrice,
  liveItems,
  realTrustChips,
  reviewBadge,
  shouldRenderBlock,
  showOrderCta,
  showWhatsApp,
  type StorefrontItem,
  type StorefrontModel,
} from '../../services/storefrontHonesty';

function waHref(e164: string): string {
  return `https://wa.me/${e164.replace('+', '')}`;
}

const CatalogCard: React.FC<{
  item: StorefrontItem;
  model: StorefrontModel;
  accent: string;
  accentText: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
}> = ({ item, model, accent, accentText, surface, text, muted, border }) => {
  const price = formatPrice(model, item.price);
  return (
    <article
      style={{
        background: surface,
        border: `1px solid ${border}`,
        borderRadius: 16,
        overflow: 'hidden',
        minHeight: 180,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          height: 140,
          background: item.imageUrl
            ? `center/cover no-repeat url(${item.imageUrl})`
            : 'linear-gradient(160deg, rgba(0,0,0,0.06), rgba(0,0,0,0.02))',
        }}
        aria-hidden
      />
      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: text }}>{item.name}</h3>
        {item.description ? (
          <p style={{ margin: 0, fontSize: 13, color: muted, lineHeight: 1.45 }}>{item.description}</p>
        ) : null}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          {price ? <span style={{ fontWeight: 800, fontSize: 15, color: text }}>{price}</span> : <span />}
          <button
            type="button"
            style={{
              minHeight: 44,
              minWidth: 44,
              padding: '0 16px',
              borderRadius: 999,
              border: 'none',
              background: accent,
              color: accentText,
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            Add
          </button>
        </div>
      </div>
    </article>
  );
};

export const JuvayStorefront: React.FC<{
  model: StorefrontModel;
  onPrimaryCta?: () => void;
}> = ({ model, onPrimaryCta }) => {
  const starter = STORE_STARTERS[model.templateId];
  const p = starter.palette;
  const chips = realTrustChips(model);
  const items = liveItems(model);
  const featured = featuredItems(model);
  const badge = reviewBadge(model.reviewCount);
  const cta = starter.cta;
  const closedNote = closedFoodNextOpen(model);
  const showCta = showOrderCta(model);
  const wa = showWhatsApp(model) ? model.whatsappE164! : '';
  const empty = items.length === 0;
  const isIllustrative = model.mode === 'illustrative';
  const catalogPad = shouldRenderBlock('sticky', model) ? 88 : 24;

  const scrollToCatalog = () => {
    if (onPrimaryCta) {
      onPrimaryCta();
      return;
    }
    document.getElementById('juvay-catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div
      style={{
        minHeight: '100%',
        background: p.bg,
        color: p.text,
        fontFamily: p.bodyFont,
        position: 'relative',
      }}
    >
      <link rel="stylesheet" href={p.fontHref} />

      {isIllustrative && (
        <div
          style={{
            background: p.accent,
            color: p.accentText,
            textAlign: 'center',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 1.4,
            padding: '8px 12px',
          }}
        >
          ILLUSTRATIVE LAYOUT — not a live shop. No sample products.
        </div>
      )}

      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          background: p.surface,
          borderBottom: `1px solid ${p.border}`,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: p.headingFont, fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {model.storeName || starter.name}
          </div>
          <div style={{ fontSize: 11, color: p.muted, display: 'flex', gap: 8 }}>
            {model.island ? <span>{model.island}</span> : null}
            {model.isOpen === true && model.hours ? <span>Open</span> : null}
            {model.isOpen === false ? <span>{closedNote || 'Closed'}</span> : null}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '4px 8px',
              borderRadius: 999,
              background: badge.kind === 'new' ? 'transparent' : p.bg,
              border: `1px solid ${p.border}`,
              color: p.muted,
            }}
          >
            {badge.label}
          </span>
          <button
            type="button"
            onClick={scrollToCatalog}
            style={{
              minHeight: 44,
              padding: '0 14px',
              borderRadius: 999,
              border: 'none',
              background: p.accent,
              color: p.accentText,
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {model.templateId === 'services' ? 'Book' : 'Cart'}
          </button>
        </div>
      </header>

      {shouldRenderBlock('hero', model) && (
        <section
          style={{
            background: p.heroBg,
            color: p.heroText,
            padding: '48px 20px 40px',
            minHeight: 220,
          }}
        >
          <p style={{ margin: '0 0 10px', fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase', opacity: 0.75 }}>
            {[model.area, model.island, model.specialty].filter(Boolean).join(' · ') || starter.name}
          </p>
          <h1
            style={{
              fontFamily: p.headingFont,
              fontSize: 'clamp(28px, 8vw, 48px)',
              lineHeight: 1.12,
              margin: '0 0 16px',
              fontWeight: 700,
              maxWidth: 640,
            }}
          >
            {model.hero?.headline || starter.heroHeadline}
          </h1>
          {model.hero?.sub ? (
            <p style={{ margin: '0 0 20px', fontSize: 16, maxWidth: 520, opacity: 0.88 }}>{model.hero.sub}</p>
          ) : null}
          {showCta ? (
            <button
              type="button"
              onClick={scrollToCatalog}
              style={{
                minHeight: 44,
                padding: '0 22px',
                borderRadius: 999,
                border: 'none',
                background: p.accent,
                color: p.accentText,
                fontWeight: 800,
                fontSize: 15,
              }}
            >
              {cta}
            </button>
          ) : (
            <div style={{ fontWeight: 700, fontSize: 15 }}>{closedNote}</div>
          )}
        </section>
      )}

      {shouldRenderBlock('trust', model) && (
        <section style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {chips.map((chip) => (
            <span
              key={chip}
              style={{
                border: `1px solid ${p.border}`,
                background: p.surface,
                borderRadius: 999,
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: p.text,
              }}
            >
              {chip}
            </span>
          ))}
        </section>
      )}

      {model.about ? (
        <section style={{ padding: '8px 20px 24px', maxWidth: 720 }}>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: p.muted }}>{model.about}</p>
        </section>
      ) : null}

      {shouldRenderBlock('featured', model) || shouldRenderBlock('featured_combo', model) ? (
        <section style={{ padding: '8px 20px 28px' }}>
          <h2 style={{ fontFamily: p.headingFont, fontSize: 22, margin: '0 0 14px' }}>
            {model.templateId === 'food' ? 'Today' : 'Featured'}
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: featured.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 12,
            }}
          >
            {featured.map((item) => (
              <CatalogCard
                key={item.id}
                item={item}
                model={model}
                accent={p.accent}
                accentText={p.accentText}
                surface={p.surface}
                text={p.text}
                muted={p.muted}
                border={p.border}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section id="juvay-catalog" style={{ padding: `8px 20px ${catalogPad}px` }}>
        <h2 style={{ fontFamily: p.headingFont, fontSize: 22, margin: '0 0 14px' }}>
          {model.templateId === 'food' ? 'Menu' : model.templateId === 'services' ? 'Services' : model.templateId === 'fashion' ? 'The rack' : 'Shop'}
        </h2>
        {empty ? (
          <div
            style={{
              border: `1px dashed ${p.border}`,
              borderRadius: 16,
              padding: '36px 20px',
              textAlign: 'center',
              color: p.muted,
              fontSize: 15,
            }}
          >
            {emptyCatalogCopy(model)}
          </div>
        ) : shouldRenderBlock('menu', model) || shouldRenderBlock('service_list', model) ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((item) => {
              const price = formatPrice(model, item.price);
              return (
                <div
                  key={item.id}
                  style={{
                    background: p.surface,
                    border: `1px solid ${p.border}`,
                    borderRadius: 14,
                    padding: '14px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    alignItems: 'center',
                    minHeight: 64,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{item.name}</div>
                    {item.description ? <div style={{ fontSize: 13, color: p.muted }}>{item.description}</div> : null}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {price ? <strong>{price}</strong> : null}
                    <button
                      type="button"
                      style={{
                        minHeight: 44,
                        minWidth: 64,
                        border: 'none',
                        borderRadius: 999,
                        background: p.accent,
                        color: p.accentText,
                        fontWeight: 700,
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 12,
            }}
          >
            {items.map((item) => (
              <CatalogCard
                key={item.id}
                item={item}
                model={model}
                accent={p.accent}
                accentText={p.accentText}
                surface={p.surface}
                text={p.text}
                muted={p.muted}
                border={p.border}
              />
            ))}
          </div>
        )}
      </section>

      {shouldRenderBlock('how', model) && (
        <section style={{ padding: '8px 20px 32px' }}>
          <h2 style={{ fontFamily: p.headingFont, fontSize: 22, margin: '0 0 14px' }}>How it works</h2>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 12 }}>
            {model.how!.map((step) => (
              <li key={step.title} style={{ background: p.surface, border: `1px solid ${p.border}`, borderRadius: 14, padding: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{step.title}</div>
                <div style={{ color: p.muted, fontSize: 14, lineHeight: 1.5 }}>{step.body}</div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {shouldRenderBlock('faq', model) && (
        <section style={{ padding: '8px 20px 32px' }}>
          <h2 style={{ fontFamily: p.headingFont, fontSize: 22, margin: '0 0 14px' }}>FAQ</h2>
          <dl style={{ margin: 0 }}>
            {model.faq!.map((row) => (
              <div key={row.q} style={{ borderTop: `1px solid ${p.border}`, padding: '14px 0' }}>
                <dt style={{ fontWeight: 700, marginBottom: 6 }}>{row.q}</dt>
                <dd style={{ margin: 0, color: p.muted, fontSize: 14, lineHeight: 1.5 }}>{row.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {shouldRenderBlock('footer', model) && (
        <footer style={{ padding: '28px 20px 40px', borderTop: `1px solid ${p.border}`, color: p.muted, fontSize: 13 }}>
          <div style={{ fontFamily: p.headingFont, color: p.text, fontSize: 18, marginBottom: 6 }}>
            {model.storeName || starter.name}
          </div>
          {model.island ? <div>{model.island}</div> : null}
          <div style={{ marginTop: 12, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <a href="/terms.html" style={{ color: p.muted }}>Terms</a>
            <a href="/privacy.html" style={{ color: p.muted }}>Privacy</a>
            <a href="/refund.html" style={{ color: p.muted }}>Refunds</a>
          </div>
          <div style={{ marginTop: 16 }}>Juvay · {model.storeName || starter.name}</div>
          <div style={{ marginTop: 4, fontSize: 12 }}>Prices in {currencyPrefix(model)}. No USD convert on this page.</div>
        </footer>
      )}

      {shouldRenderBlock('sticky', model) && (
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            zIndex: 20,
            padding: '10px 16px calc(10px + env(safe-area-inset-bottom))',
            background: p.surface,
            borderTop: `1px solid ${p.border}`,
            display: 'flex',
            gap: 8,
          }}
        >
          {showCta ? (
            <button
              type="button"
              onClick={scrollToCatalog}
              style={{
                flex: 1,
                minHeight: 44,
                border: 'none',
                borderRadius: 999,
                background: p.accent,
                color: p.accentText,
                fontWeight: 800,
              }}
            >
              {cta}
            </button>
          ) : (
            <div style={{ flex: 1, minHeight: 44, display: 'grid', placeItems: 'center', fontWeight: 700 }}>{closedNote}</div>
          )}
          {wa ? (
            <a
              href={waHref(wa)}
              style={{
                minHeight: 44,
                minWidth: 44,
                padding: '0 16px',
                borderRadius: 999,
                border: `1px solid ${p.border}`,
                color: p.text,
                display: 'grid',
                placeItems: 'center',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              WhatsApp
            </a>
          ) : null}
        </div>
      )}
    </div>
  );
};

export function illustrativeModel(templateId: StarterId): StorefrontModel {
  const starter = STORE_STARTERS[templateId];
  return {
    templateId,
    storeName: starter.name,
    mode: 'illustrative',
    items: [],
    reviewCount: 0,
    hero: { headline: starter.heroHeadline, sub: starter.useWhen },
    how: [
      { title: '1. This is a layout', body: 'Blocks skip when they have no real data.' },
      { title: '2. No sample products', body: 'A published shop never fills empty shelves with dummy SKUs.' },
      { title: '3. Use this starter', body: 'Customize with your name, island, and hours. Publish when you choose.' },
    ],
    faq: [
      { q: 'Is this a real shop?', a: 'No. This preview is labeled ILLUSTRATIVE. It is a layout, not a merchant.' },
      { q: 'How do I pay?', a: 'Cash when you collect, or cash on delivery if that option is on. We do not ask for PayPal.' },
      { q: 'Where are the products?', a: 'There are none. Empty catalog stays empty until you add a real item.' },
    ],
  };
}

export default JuvayStorefront;
