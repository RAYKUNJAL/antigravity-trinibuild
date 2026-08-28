import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ISLAND, STORE_STARTERS, type StarterId } from '../../services/storeStarters';
import { applyMerchantTheme, socialHref } from '../../services/merchantTheme';
import {
  announcementLine,
  closedFoodNextOpen,
  currencyPrefix,
  emptyCatalogCopy,
  featuredItems,
  formatPrice,
  itemIsSellable,
  liveItems,
  realTrustChips,
  reviewBadge,
  shouldRenderBlock,
  showAboutSection,
  showContactSection,
  showIllustrativeBanner,
  showOrderCta,
  showWhatsApp,
  type StorefrontItem,
  type StorefrontModel,
  type StorefrontVariant,
} from '../../services/storefrontHonesty';

export type StorefrontEditField = 'headline' | 'sub' | 'about';

export interface StorefrontEditor {
  onFieldChange: (field: StorefrontEditField, value: string) => void;
  onHeroUpload: (dataUrl: string) => void;
}

function waHref(e164: string, text?: string): string {
  const base = `https://wa.me/${e164.replace('+', '')}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

const SMALL_CTA: React.CSSProperties = {
  width: 140,
  height: 32,
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: 0.3,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
};

function resolveHeroSrc(model: StorefrontModel): string {
  if (model.hero?.image) return model.hero.image;
  if (model.mode === 'published') return '';
  return STORE_STARTERS[model.templateId].heroImage;
}

function readHeroFile(file: File, onDone: (dataUrl: string) => void) {
  if (!file.type.startsWith('image/')) return;
  if (file.size > 2_500_000) return;
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    const max = 1600;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    onDone(canvas.toDataURL('image/jpeg', 0.82));
  };
  img.src = url;
}

const HeroPhoto: React.FC<{
  src: string;
  field: string;
  editable?: boolean;
  onUpload?: (dataUrl: string) => void;
  priority?: boolean;
  fill?: boolean;
}> = ({ src, field, editable, onUpload, priority, fill }) => (
  <div style={{ position: fill ? 'absolute' : 'relative', inset: fill ? 0 : undefined, minHeight: fill ? undefined : '100%', height: fill ? undefined : '100%', background: field, overflow: 'hidden' }}>
    {src ? (
      <img
        src={src}
        alt=""
        width={1600}
        height={900}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
    ) : null}
    {editable && onUpload ? (
      <label
        style={{
          position: 'absolute',
          inset: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          padding: 16,
          background: src ? 'transparent' : 'rgba(0,0,0,0.04)',
        }}
      >
        <input
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) readHeroFile(file, onUpload);
          }}
        />
        <span
          style={{
            minHeight: 44,
            padding: '0 14px',
            display: 'inline-flex',
            alignItems: 'center',
            background: 'rgba(20,20,20,0.72)',
            color: '#FFF8F0',
            fontSize: 12,
          }}
        >
          {src ? 'Replace photo' : 'Tap to add your photo'}
        </span>
      </label>
    ) : null}
  </div>
);

const EditableText: React.FC<{
  value: string;
  field: StorefrontEditField;
  editor?: StorefrontEditor;
  as?: 'h1' | 'p' | 'div';
  style?: React.CSSProperties;
}> = ({ value, field, editor, as = 'p', style }) => {
  const Tag = as;
  if (!editor) return <Tag style={style}>{value}</Tag>;
  return (
    <Tag
      style={{ ...style, outline: '1px dashed rgba(255,255,255,0.28)', cursor: 'text' }}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => editor.onFieldChange(field, e.currentTarget.textContent || '')}
    >
      {value}
    </Tag>
  );
};

export const JuvayStorefront: React.FC<{
  model: StorefrontModel;
  onPrimaryCta?: () => void;
  editor?: StorefrontEditor;
}> = ({ model, onPrimaryCta, editor }) => {
  const starter = STORE_STARTERS[model.templateId];
  const p = applyMerchantTheme(starter.palette, { colors: model.colors, fontPair: model.fontPair });
  const buy = { background: p.accent, color: p.accentText, border: 'none' };
  const items = liveItems(model);
  const featured = featuredItems(model);
  const badge = reviewBadge(model.reviewCount);
  const cta = starter.cta;
  const closedNote = closedFoodNextOpen(model);
  const showCta = showOrderCta(model);
  const wa = showWhatsApp(model) ? model.whatsappE164! : '';
  const empty = items.length === 0;
  const isIllustrative = showIllustrativeBanner(model);
  const announce = announcementLine(model);
  const heroRef = useRef<HTMLElement | null>(null);
  const [heroGone, setHeroGone] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<Array<{ item: StorefrontItem; variant?: StorefrontVariant; qty: number; note?: string }>>([]);
  const [picker, setPicker] = useState<StorefrontItem | null>(null);
  const [pickedVariant, setPickedVariant] = useState<string>('');
  const [foodNote, setFoodNote] = useState('');
  const [fulfill, setFulfill] = useState<'pickup' | 'cod' | ''>('');
  const [cashExact, setCashExact] = useState<'exact' | 'change' | ''>('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const el = heroRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setHeroGone(!entry.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const visibleItems = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((item) =>
      [item.name, item.compatibilityNote, item.description, item.specs]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q)),
    );
  }, [items, query]);

  const cartTotal = cart.reduce((sum, line) => {
    const unit = line.variant?.price ?? line.item.price;
    return sum + (Number(unit) || 0) * line.qty;
  }, 0);
  const cartCount = cart.reduce((s, l) => s + l.qty, 0);
  const face = formatPrice(model, cartTotal) || `${currencyPrefix(model)}0`;

  const addLine = (item: StorefrontItem, variant?: StorefrontVariant) => {
    if (!itemIsSellable(item)) return;
    if (item.variants && item.variants.length && !variant) {
      setPicker(item);
      setPickedVariant('');
      return;
    }
    setCart((prev) => {
      const key = `${item.id}:${variant?.id || ''}`;
      const found = prev.find((l) => `${l.item.id}:${l.variant?.id || ''}` === key);
      if (found) return prev.map((l) => (l === found ? { ...l, qty: l.qty + 1, note: foodNote || l.note } : l));
      return [...prev, { item, variant, qty: 1, note: foodNote || undefined }];
    });
    setPicker(null);
    setCartOpen(true);
  };

  const scrollToCatalog = () => {
    if (onPrimaryCta) {
      onPrimaryCta();
      return;
    }
    document.getElementById('juvay-catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const ghost = starter.heroLayout === 'bleed' && !model.colors?.accent;
  const ctaStyle: React.CSSProperties = ghost
    ? { ...SMALL_CTA, background: 'transparent', color: p.heroText, border: `1px solid ${p.heroText}` }
    : { ...SMALL_CTA, ...buy };
  const heroSrc = resolveHeroSrc(model);
  const chips = realTrustChips(model);

  const upsell = items.filter((i) => i.inStock !== false && !cart.some((l) => l.item.id === i.id)).slice(0, 1);
  const showUpsell = items.length >= 2 && upsell.length > 0;

  useEffect(() => {
    if (!model.logo || (model.mode !== 'published' && model.mode !== 'merchant_preview')) return;
    let link = document.querySelector('link[rel="icon"][data-juvay="logo"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      link.setAttribute('data-juvay', 'logo');
      document.head.appendChild(link);
    }
    link.href = model.logo;
  }, [model.logo, model.mode]);

  const socials = [
    { key: 'instagram' as const, href: socialHref('instagram', model.social?.instagram) },
    { key: 'facebook' as const, href: socialHref('facebook', model.social?.facebook) },
    { key: 'tiktok' as const, href: socialHref('tiktok', model.social?.tiktok) },
  ].filter((row) => row.href);

  return (
    <div style={{ minHeight: '100%', background: p.bg, color: p.text, fontFamily: p.bodyFont }}>
      <link rel="stylesheet" href={p.fontHref} />

      {isIllustrative && (
        <div style={{ background: ISLAND.mango, color: ISLAND.mangoInk, textAlign: 'center', fontSize: 10, fontWeight: 700, letterSpacing: 1.2, padding: '6px 12px' }}>
          ILLUSTRATIVE LAYOUT — not a live shop. No sample products.
        </div>
      )}

      {announce ? (
        <div style={{ background: p.heroBg, color: p.heroText, textAlign: 'center', fontSize: 11, letterSpacing: 0.4, padding: '6px 12px' }}>
          {announce}
        </div>
      ) : null}

      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          background: p.surface,
        }}
      >
        <div style={{ fontFamily: p.headingFont, fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
          {model.logo ? (
            <img src={model.logo} alt="" width={36} height={36} style={{ width: 36, height: 36, objectFit: 'contain' }} />
          ) : null}
          {model.storeName || starter.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12 }}>
          {model.island ? <span style={{ color: ISLAND.teal }}>{model.island}</span> : null}
          {model.isOpen === true && model.hours ? <span>Open</span> : null}
          {model.isOpen === false ? <span>{closedNote || 'Closed'}</span> : null}
          <span style={{ color: p.muted }}>{badge.label}</span>
          {model.mode === 'published' ? (
            <button
              type="button"
              onClick={() => {
                const url = typeof window !== 'undefined' ? window.location.href : '';
                if (url && navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
              }}
              style={{ background: 'none', border: 'none', color: p.text, fontSize: 12, cursor: 'pointer', minHeight: 32 }}
            >
              Share
            </button>
          ) : null}
          {wa ? (
            <a href={waHref(wa, `Hello ${model.storeName}`)} style={{ color: ISLAND.teal, textDecoration: 'none', minHeight: 32, display: 'inline-flex', alignItems: 'center' }}>
              WhatsApp
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            style={{ background: 'none', border: 'none', color: p.text, fontSize: 12, cursor: 'pointer', minHeight: 32 }}
          >
            Cart{cartCount ? ` (${cartCount})` : ''}
          </button>
        </div>
      </header>

      {shouldRenderBlock('hero', model) && (
        <section ref={heroRef as any} style={{ minHeight: '70vh', background: p.heroBg }}>
          {starter.heroLayout === 'split' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '70vh' }} className="juvay-hero-split">
              <div style={{ background: p.heroBg, color: p.heroText, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 8vw 48px 6vw' }}>
                <p style={{ margin: '0 0 12px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.7 }}>
                  {[model.area, model.island, model.specialty].filter(Boolean).join(' · ') || starter.name}
                </p>
                <EditableText
                  as="h1"
                  field="headline"
                  editor={editor}
                  value={model.hero?.headline || starter.heroHeadline}
                  style={{ fontFamily: p.headingFont, fontSize: 'clamp(40px, 7vw, 72px)', lineHeight: 0.95, margin: '0 0 16px', fontWeight: 600 }}
                />
                {(model.hero?.sub || editor) ? (
                  <EditableText
                    field="sub"
                    editor={editor}
                    value={model.hero?.sub || ''}
                    style={{ margin: '0 0 22px', fontSize: 15, maxWidth: '40ch', lineHeight: 1.55, opacity: 0.85 }}
                  />
                ) : null}
                {showCta ? (
                  <button type="button" onClick={scrollToCatalog} style={ctaStyle}>{cta}</button>
                ) : (
                  <div style={{ fontWeight: 600 }}>{closedNote}</div>
                )}
                {model.templateId === 'food' && model.hours ? (
                  wa ? (
                    <a href={waHref(wa, `Reserve at ${model.storeName}. Hours: ${model.hours}`)} style={{ marginTop: 14, color: p.heroText, fontSize: 13 }}>
                      Reserve
                    </a>
                  ) : (
                    <div style={{ marginTop: 14, fontSize: 13, opacity: 0.8 }}>Hours: {model.hours}</div>
                  )
                ) : null}
              </div>
              <HeroPhoto src={heroSrc} field={p.field} editable={!!editor} onUpload={editor?.onHeroUpload} priority />
            </div>
          ) : starter.heroLayout === 'bleed' ? (
            <div style={{ position: 'relative', minHeight: '70vh', background: p.field, color: p.heroText }}>
              <HeroPhoto src={heroSrc} field={p.field} editable={!!editor} onUpload={editor?.onHeroUpload} priority fill />
              <div style={{ position: 'absolute', left: '6vw', bottom: '12vh', maxWidth: 420, zIndex: 2, pointerEvents: editor ? 'auto' : undefined }}>
                <EditableText
                  as="h1"
                  field="headline"
                  editor={editor}
                  value={model.hero?.headline || starter.heroHeadline}
                  style={{ fontFamily: p.headingFont, fontStyle: 'italic', fontSize: 'clamp(40px, 7vw, 68px)', lineHeight: 0.95, margin: '0 0 12px', fontWeight: 500 }}
                />
                {(model.hero?.sub || editor) ? (
                  <EditableText
                    field="sub"
                    editor={editor}
                    value={model.hero?.sub || ''}
                    style={{ margin: '0 0 18px', fontSize: 14, maxWidth: '40ch', lineHeight: 1.5, opacity: 0.88 }}
                  />
                ) : null}
                {showCta ? <button type="button" onClick={scrollToCatalog} style={ctaStyle}>{cta}</button> : <div>{closedNote}</div>}
              </div>
              {featured[0] && featured[0].price != null ? (
                <div style={{ position: 'absolute', right: '6vw', bottom: '12vh', background: p.surface, color: p.text, padding: '12px 14px', width: 200, zIndex: 2 }}>
                  <div style={{ fontFamily: p.headingFont, fontStyle: 'italic', fontSize: 14 }}>{featured[0].name}</div>
                  <div style={{ color: ISLAND.pepper, fontSize: 13, marginTop: 4 }}>{formatPrice(model, featured[0].price)}</div>
                </div>
              ) : null}
            </div>
          ) : (
            <div style={{ position: 'relative', minHeight: '70vh', background: p.field, color: p.heroText }}>
              <HeroPhoto src={heroSrc} field={p.field} editable={!!editor} onUpload={editor?.onHeroUpload} priority fill />
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', padding: 32, zIndex: 2 }}>
                <div>
                  <div style={{ fontFamily: p.headingFont, fontSize: 'clamp(44px, 8vw, 80px)', lineHeight: 0.95, marginBottom: 10 }}>
                    {model.storeName || starter.name}
                  </div>
                  <EditableText
                    field="headline"
                    editor={editor}
                    value={model.hero?.headline || starter.heroHeadline}
                    style={{ margin: '0 0 18px', fontSize: 16, maxWidth: '40ch', marginInline: 'auto' }}
                  />
                  {showCta ? <button type="button" onClick={scrollToCatalog} style={ctaStyle}>{cta}</button> : <div>{closedNote}</div>}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {shouldRenderBlock('trust', model) && chips.length > 0 ? (
        <div style={{ padding: '14px 6vw', display: 'flex', flexWrap: 'wrap', gap: 8, background: p.surface }}>
          {chips.map((chip) => (
            <span key={chip} style={{ fontSize: 12, color: p.accent, border: `1px solid ${p.accent}`, padding: '4px 10px' }}>{chip}</span>
          ))}
        </div>
      ) : null}

      {(showAboutSection(model) || editor) ? (
        <section style={{ padding: '40px 6vw', maxWidth: 'calc(40ch + 12vw)' }}>
          <h2 style={{ fontFamily: p.headingFont, fontSize: 22, fontWeight: 500, margin: '0 0 10px' }}>About</h2>
          <EditableText
            field="about"
            editor={editor}
            value={model.about || ''}
            style={{ margin: 0, fontSize: 16, lineHeight: 1.65, color: p.muted, maxWidth: '40ch' }}
          />
        </section>
      ) : null}

      {showContactSection(model) ? (
        <section style={{ padding: '8px 6vw 36px', maxWidth: 560 }}>
          <h2 style={{ fontFamily: p.headingFont, fontSize: 22, fontWeight: 500, margin: '0 0 10px' }}>Contact / Hours</h2>
          {model.hours ? <div style={{ marginBottom: 6 }}>{model.hours}</div> : null}
          {model.pickupAddress ? <div style={{ marginBottom: 6 }}>{model.pickupAddress}</div> : null}
          {model.phone ? <div style={{ marginBottom: 6 }}>{model.phone}</div> : null}
          {wa ? (
            <a href={waHref(wa, `Hello ${model.storeName}`)} style={{ color: p.accent }}>WhatsApp</a>
          ) : null}
        </section>
      ) : null}

      {(model.templateId === 'auto' || model.templateId === 'electronics') && !empty ? (
        <div style={{ padding: '0 6vw 8px' }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              model.templateId === 'auto'
                ? 'Search parts. Fit is a merchant note.'
                : 'Search gadgets. Specs only if the seller typed them.'
            }
            style={{ width: '100%', maxWidth: 360, minHeight: 44, border: `1px solid ${p.border}`, background: p.surface, padding: '0 12px' }}
          />
        </div>
      ) : null}

      {(shouldRenderBlock('featured', model) || shouldRenderBlock('featured_combo', model) || shouldRenderBlock('lookbook', model)) && featured.length > 0 ? (
        <section style={{ padding: '8px 6vw 36px' }}>
          <h2 style={{ fontFamily: p.headingFont, fontSize: 28, fontWeight: 500, margin: '0 0 20px', textAlign: 'center' }}>
            {model.templateId === 'food' ? 'Today' : model.templateId === 'fashion' ? 'Lookbook' : 'Featured'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: featured.length === 1 ? '1fr' : 'repeat(4, 1fr)', gap: 28 }} className="juvay-grid">
            {featured.map((item) => (
              <CatalogCard key={item.id} item={item} model={model} palette={p} onAdd={() => addLine(item)} large={model.templateId === 'home'} />
            ))}
          </div>
        </section>
      ) : null}

      <section id="juvay-catalog" style={{ padding: `12px 6vw ${heroGone ? 88 : 48}px` }}>
        <h2 style={{ fontFamily: p.headingFont, fontSize: 28, fontWeight: 500, margin: '0 0 20px', textAlign: 'center' }}>
          {model.templateId === 'food' ? 'Menu' : model.templateId === 'services' ? 'Services' : model.templateId === 'fashion' ? 'The rack' : model.templateId === 'auto' ? 'Parts' : model.templateId === 'electronics' ? 'Gadgets' : 'Shop'}
        </h2>
        {empty ? (
          <div style={{ border: `1px dashed ${p.border}`, padding: '48px 20px', textAlign: 'center', color: p.muted, maxWidth: 560, margin: '0 auto' }}>
            {emptyCatalogCopy(model)}
          </div>
        ) : shouldRenderBlock('menu', model) || shouldRenderBlock('service_list', model) ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720, margin: '0 auto' }}>
            {visibleItems.map((item) => {
              const price = formatPrice(model, item.price);
              return (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', padding: '14px 0', borderBottom: `1px solid ${p.border}` }}>
                  <div>
                    <div style={{ fontFamily: p.headingFont, fontSize: 18 }}>{item.name}</div>
                    {item.description ? <div style={{ fontSize: 13, color: p.muted, maxWidth: '40ch' }}>{item.description}</div> : null}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {price ? <strong style={{ color: ISLAND.pepper }}>{price}</strong> : null}
                    {itemIsSellable(item) ? (
                      <button type="button" onClick={() => addLine(item)} style={{ ...SMALL_CTA, ...buy }}>Add</button>
                    ) : (
                      <span style={{ fontSize: 12, color: p.muted }}>Out of stock</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 28 }} className="juvay-grid">
            {visibleItems.map((item) => (
              <CatalogCard key={item.id} item={item} model={model} palette={p} onAdd={() => addLine(item)} large={model.templateId === 'home'} />
            ))}
          </div>
        )}
      </section>

      {shouldRenderBlock('how', model) && (
        <section style={{ padding: '8px 6vw 40px', maxWidth: 720 }}>
          <h2 style={{ fontFamily: p.headingFont, fontSize: 28, fontWeight: 500, margin: '0 0 16px' }}>How it works</h2>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 16 }}>
            {model.how!.map((step) => (
              <li key={step.title}>
                <div style={{ fontFamily: p.headingFont, fontSize: 18, marginBottom: 4 }}>{step.title}</div>
                <div style={{ color: p.muted, fontSize: 14, maxWidth: '40ch', lineHeight: 1.55 }}>{step.body}</div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {shouldRenderBlock('faq', model) && (
        <section style={{ padding: '8px 6vw 40px', maxWidth: 720 }}>
          <h2 style={{ fontFamily: p.headingFont, fontSize: 28, fontWeight: 500, margin: '0 0 16px' }}>FAQ</h2>
          <dl style={{ margin: 0 }}>
            {model.faq!.map((row) => (
              <div key={row.q} style={{ borderTop: `1px solid ${p.border}`, padding: '14px 0' }}>
                <dt style={{ fontWeight: 600, marginBottom: 6 }}>{row.q}</dt>
                <dd style={{ margin: 0, color: p.muted, fontSize: 14, maxWidth: '40ch', lineHeight: 1.55 }}>{row.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {shouldRenderBlock('footer', model) && (
        <footer style={{ padding: '36px 6vw 48px', borderTop: `1px solid ${p.border}`, color: p.muted, fontSize: 13 }}>
          <div style={{ fontFamily: p.headingFont, color: p.text, fontSize: 20, marginBottom: 6 }}>{model.storeName || starter.name}</div>
          {model.island ? <div>{model.island}</div> : null}
          {socials.length ? (
            <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
              {socials.map((row) => (
                <a key={row.key} href={row.href} style={{ color: p.accent, textTransform: 'capitalize' }}>{row.key}</a>
              ))}
            </div>
          ) : null}
          <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
            <a href="/terms.html" style={{ color: ISLAND.teal }}>Terms</a>
            <a href="/privacy.html" style={{ color: ISLAND.teal }}>Privacy</a>
            <a href="/refund.html" style={{ color: ISLAND.teal }}>Refunds</a>
          </div>
          <div style={{ marginTop: 16 }}>Juvay · {model.storeName || starter.name}</div>
          <div style={{ marginTop: 4, fontSize: 12 }}>Prices in {currencyPrefix(model)}. No USD convert on this page.</div>
        </footer>
      )}

      {shouldRenderBlock('sticky', model) && heroGone && showCta && (
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            zIndex: 24,
            minHeight: 56,
            padding: '8px 16px calc(8px + env(safe-area-inset-bottom))',
            background: p.surface,
            borderTop: `1px solid ${p.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: p.muted }}>{cartCount ? face : starter.name}</div>
            {model.templateId === 'food' ? (
              <input
                value={foodNote}
                onChange={(e) => setFoodNote(e.target.value)}
                placeholder="No pepper / extra lime"
                style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 12, color: p.text }}
              />
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => (cartCount ? setCartOpen(true) : scrollToCatalog())}
            style={{ minHeight: 44, minWidth: 140, ...buy, fontWeight: 700 }}
          >
            {cta}
          </button>
        </div>
      )}

      {picker && (
        <div role="dialog" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setPicker(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: p.surface, width: '100%', maxWidth: 420, padding: 20 }}>
            <div style={{ fontFamily: p.headingFont, fontSize: 20, marginBottom: 12 }}>{picker.name}</div>
            <p style={{ fontSize: 13, color: p.muted }}>Pick a variant before add.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '12px 0 16px' }}>
              {(picker.variants || []).map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setPickedVariant(v.id)}
                  style={{ minHeight: 44, padding: '0 14px', border: `1px solid ${pickedVariant === v.id ? p.text : p.border}`, background: pickedVariant === v.id ? p.text : 'transparent', color: pickedVariant === v.id ? p.surface : p.text }}
                >
                  {v.title}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={!pickedVariant}
              onClick={() => addLine(picker, picker.variants?.find((v) => v.id === pickedVariant))}
              style={{ ...SMALL_CTA, width: '100%', height: 44, ...buy }}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {cartOpen && (
        <div role="dialog" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 42 }} onClick={() => setCartOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: 'min(100%, 380px)',
              background: p.surface,
              display: 'flex',
              flexDirection: 'column',
            }}
            className="juvay-cart"
          >
            <div style={{ padding: 16, display: 'flex', justifyContent: 'space-between' }}>
              <strong>Cart</strong>
              <button type="button" onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', color: p.text }}>Close</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
              {cart.length === 0 ? <p style={{ color: p.muted }}>Nothing in the cart yet.</p> : cart.map((line, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    {line.item.name}{line.variant ? ` · ${line.variant.title}` : ''}
                    {line.note ? <div style={{ fontSize: 12, color: p.muted }}>{line.note}</div> : null}
                  </div>
                  <span style={{ color: ISLAND.pepper }}>{formatPrice(model, (line.variant?.price ?? line.item.price) || 0)}</span>
                </div>
              ))}
              {showUpsell ? (
                <button type="button" onClick={() => addLine(upsell[0])} style={{ marginTop: 8, background: 'none', border: `1px solid ${p.border}`, color: p.text, padding: '8px 10px' }}>
                  Also in this shop: {upsell[0].name}
                </button>
              ) : null}
              {(model.acceptsCashPickup || model.acceptsCod) && cart.length > 0 ? (
                <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
                  {model.acceptsCashPickup ? (
                    <label><input type="radio" name="ful" checked={fulfill === 'pickup'} onChange={() => setFulfill('pickup')} /> Pickup</label>
                  ) : null}
                  {model.acceptsCod ? (
                    <label><input type="radio" name="ful" checked={fulfill === 'cod'} onChange={() => setFulfill('cod')} /> Cash on delivery</label>
                  ) : null}
                  {fulfill ? (
                    <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
                      <label><input type="radio" name="cash" checked={cashExact === 'exact'} onChange={() => setCashExact('exact')} /> Cash exact</label>
                      <label><input type="radio" name="cash" checked={cashExact === 'change'} onChange={() => setCashExact('change')} /> I need change</label>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div style={{ padding: 16, borderTop: `1px solid ${p.border}` }}>
              <div style={{ marginBottom: 10, fontWeight: 700 }}>Face total {face}</div>
              {wa ? (
                <a
                  href={waHref(wa, `Order from ${model.storeName}: ${cart.map((l) => `${l.item.name} x${l.qty}`).join(', ')}. ${face}`)}
                  style={{ display: 'grid', placeItems: 'center', minHeight: 44, background: p.accent, color: p.accentText, textDecoration: 'none', fontWeight: 700 }}
                >
                  WhatsApp this order
                </a>
              ) : (
                <div style={{ fontSize: 13, color: p.muted }}>No WhatsApp on this shop. Pay on the rails that are on.</div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 800px) {
          .juvay-hero-split { grid-template-columns: 1fr !important; }
          .juvay-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 20px !important; }
          .juvay-cart { top: auto !important; height: 70vh; border-radius: 16px 16px 0 0; }
        }
      `}</style>
    </div>
  );
};

const CatalogCard: React.FC<{
  item: StorefrontItem;
  model: StorefrontModel;
  palette: typeof STORE_STARTERS[StarterId]['palette'];
  onAdd: () => void;
  large?: boolean;
}> = ({ item, model, palette: p, onAdd, large }) => {
  const price = formatPrice(model, item.price);
  const sellable = itemIsSellable(item);
  const needsVariant = !!(item.variants && item.variants.length);
  return (
    <article>
      <div
        aria-hidden
        style={{
          height: large ? 240 : 180,
          background: item.imageUrl ? `center/cover no-repeat url(${item.imageUrl})` : p.field,
          borderRadius: 6,
        }}
      />
      <div style={{ paddingTop: 10 }}>
        <h3 style={{ margin: 0, fontFamily: p.headingFont, fontSize: 16, fontWeight: 500 }}>{item.name}</h3>
        {item.compatibilityNote ? <p style={{ margin: '4px 0 0', fontSize: 12, color: p.muted }}>{item.compatibilityNote}</p> : null}
        {item.specs ? <p style={{ margin: '4px 0 0', fontSize: 12, color: p.muted }}>{item.specs}</p> : null}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          {price ? <span style={{ color: ISLAND.pepper, fontWeight: 600 }}>{price}</span> : <span />}
          {sellable ? (
            <button type="button" onClick={onAdd} style={{ ...SMALL_CTA, minWidth: 72, background: p.accent, color: p.accentText, border: 'none' }}>
              {needsVariant ? 'Pick' : 'Add'}
            </button>
          ) : (
            <span style={{ fontSize: 12, color: p.muted }}>Out of stock</span>
          )}
        </div>
      </div>
    </article>
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
