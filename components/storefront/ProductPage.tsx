import React, { useMemo, useState } from 'react';
import { STORE_STARTERS, type StoreStarter } from '../../services/storeStarters';
import { CTA, CONTENT_MAX, RADIUS } from '../../services/storeDesignTokens';
import {
  formatPrice,
  itemIsSellable,
  itemStockLabel,
  reviewBadge,
  type StorefrontItem,
  type StorefrontModel,
  type StorefrontVariant,
} from '../../services/storefrontHonesty';
import { isSampleItem, SAMPLE_ITEM_NOTE } from '../../services/illustrativeSamples';
import {
  formatSelectedModifiers,
  sumModifierDeltas,
  validateModifierSelection,
  type ProductModifierGroup,
  type SelectedModifier,
} from '../../services/productModifiers';

export const ProductPage: React.FC<{
  model: StorefrontModel;
  item: StorefrontItem | null;
  palette: StoreStarter['palette'];
  onBack: () => void;
  onAdd: (item: StorefrontItem, variant?: StorefrontVariant, mods?: SelectedModifier[], qty?: number) => void;
}> = ({ model, item, palette: p, onBack, onAdd }) => {
  const starter = STORE_STARTERS[model.templateId];
  const [variantId, setVariantId] = useState('');
  const [mods, setMods] = useState<SelectedModifier[]>([]);
  const [qty, setQty] = useState(1);
  const [galleryIdx, setGalleryIdx] = useState(0);

  const images = useMemo(() => {
    if (!item) return [] as string[];
    const list = [item.imageUrl].filter(Boolean) as string[];
    return list;
  }, [item]);

  if (!item) {
    return (
      <div style={{ maxWidth: CONTENT_MAX, margin: '0 auto', padding: '48px 6vw 80px' }}>
        <button type="button" onClick={onBack} style={textBtn(p)}>
          ← Back to the shop
        </button>
        <h1 style={{ fontFamily: p.headingFont, fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 500, margin: '24px 0 12px' }}>
          This item is not on the shop
        </h1>
        <p style={{ color: p.muted, maxWidth: '42ch', lineHeight: 1.6 }}>
          It may have been removed, or the link is from a template preview.
        </p>
      </div>
    );
  }

  const sample = isSampleItem(item);
  const sellable = itemIsSellable(item) && !sample;
  const variant = (item.variants || []).find((v) => v.id === variantId);
  const groups = item.modifierGroups || [];
  const basePrice = variant?.price ?? item.price;
  const unit = basePrice == null || !Number.isFinite(Number(basePrice))
    ? null
    : Number(basePrice) + sumModifierDeltas(mods);
  const priceLabel = unit == null ? null : formatPrice(model, unit);
  const badge = reviewBadge(model.reviewCount);
  const modCheck = groups.length ? validateModifierSelection(groups, mods) : { ok: true };
  const needsVariant = !!(item.variants && item.variants.length && !variant);
  const canAdd = sellable && !needsVariant && modCheck.ok;

  const toggleMod = (group: ProductModifierGroup, optionId: string) => {
    const opt = group.options.find((o) => o.id === optionId);
    if (!opt || opt.soldOut) return;
    setMods((prev) => {
      const without = prev.filter((s) => s.groupId !== group.id || (group.mode === 'multi' && s.optionId !== optionId));
      if (group.mode === 'multi' && prev.some((s) => s.groupId === group.id && s.optionId === optionId)) {
        return without;
      }
      return [
        ...without.filter((s) => group.mode === 'multi' || s.groupId !== group.id),
        {
          groupId: group.id,
          groupName: group.name,
          optionId: opt.id,
          optionLabel: opt.label,
          priceDelta: Number(opt.priceDelta) || 0,
        },
      ];
    });
  };

  const add = () => {
    if (!canAdd) return;
    onAdd(item, variant, mods, qty);
  };

  const img = images[galleryIdx] || item.imageUrl;

  return (
    <div style={{ maxWidth: CONTENT_MAX, margin: '0 auto', padding: '16px 6vw 120px' }}>
      <nav style={{ fontSize: 13, color: p.muted, marginBottom: 24, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" onClick={onBack} style={textBtn(p)}>
          {model.storeName || starter.name}
        </button>
        <span aria-hidden="true">/</span>
        <span style={{ color: p.text }}>{item.name}</span>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '48px 56px', alignItems: 'start' }} className="juvay-pdp">
        <div>
          <div
            style={{
              aspectRatio: starter.cardAspect || '1 / 1',
              background: p.surface,
              borderRadius: RADIUS.sm,
              overflow: 'hidden',
              position: 'relative',
              border: `1px solid ${p.border}`,
            }}
          >
            {img ? (
              <img
                src={img}
                alt={item.name}
                width={1200}
                height={1200}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: p.field }} />
            )}
            {model.mode !== 'illustrative' && (sample || (img && img.includes('/templates/'))) ? (
              <span
                style={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  background: 'rgba(20,20,20,0.78)',
                  color: '#fff8f0',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.12,
                  textTransform: 'uppercase',
                  padding: '5px 9px',
                  borderRadius: 4,
                }}
              >
                Preview
              </span>
            ) : null}
          </div>
          {images.length > 1 ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {images.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setGalleryIdx(i)}
                  style={{
                    width: 64,
                    height: 64,
                    padding: 0,
                    border: `2px solid ${i === galleryIdx ? p.accent : p.border}`,
                    borderRadius: 6,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    background: p.surface,
                  }}
                >
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <p style={{ margin: '0 0 8px', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: p.muted, fontWeight: 600 }}>
            {item.category || starter.kicker}
          </p>
          <h1
            style={{
              fontFamily: p.headingFont,
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 500,
              lineHeight: 1.1,
              margin: '0 0 12px',
              letterSpacing: '-0.02em',
            }}
          >
            {item.name}
          </h1>
          {Number(model.reviewCount || 0) > 0 ? (
            <p style={{ margin: '0 0 12px', fontSize: 13, color: p.muted }}>{badge.label}</p>
          ) : null}
          <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 16 }}>
            {priceLabel || <span style={{ fontSize: 16, fontWeight: 500, color: p.muted }}>{model.mode === 'illustrative' || sample ? 'Add your price' : 'Ask the shop'}</span>}
          </div>
          {item.description ? (
            <p style={{ margin: '0 0 24px', fontSize: 15, lineHeight: 1.65, color: p.text, maxWidth: '42ch' }}>{item.description}</p>
          ) : null}
          {item.specs ? <p style={{ margin: '0 0 16px', fontSize: 14, color: p.muted }}>{item.specs}</p> : null}
          {item.compatibilityNote ? <p style={{ margin: '0 0 16px', fontSize: 14, color: p.muted }}>{item.compatibilityNote}</p> : null}
          {itemStockLabel(item) ? <p style={{ margin: '0 0 16px', fontSize: 13, color: p.muted }}>{itemStockLabel(item)}</p> : null}

          {(item.variants || []).length > 0 ? (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Choose an option</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {item.variants!.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVariantId(v.id)}
                    style={{
                      minHeight: 44,
                      padding: '0 14px',
                      borderRadius: RADIUS.sm,
                      border: `1px solid ${variantId === v.id ? p.text : p.border}`,
                      background: variantId === v.id ? p.text : 'transparent',
                      color: variantId === v.id ? p.surface : p.text,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {v.title}
                    {v.price != null ? ` · ${formatPrice(model, v.price)}` : ''}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {groups.map((group) => (
            <div key={group.id} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{group.name}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {group.options.map((opt) => {
                  const on = mods.some((m) => m.groupId === group.id && m.optionId === opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={!!opt.soldOut}
                      onClick={() => toggleMod(group, opt.id)}
                      style={{
                        minHeight: 44,
                        padding: '0 14px',
                        borderRadius: RADIUS.sm,
                        border: `1px solid ${on ? p.text : p.border}`,
                        background: on ? p.text : 'transparent',
                        color: on ? p.surface : p.text,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: opt.soldOut ? 'not-allowed' : 'pointer',
                        opacity: opt.soldOut ? 0.5 : 1,
                      }}
                    >
                      {opt.label}
                      {opt.priceDelta ? ` · +${formatPrice(model, opt.priceDelta)}` : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {sellable ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8, marginBottom: 16 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  border: `1px solid ${p.border}`,
                  borderRadius: RADIUS.sm,
                  height: 48,
                }}
              >
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  style={{ width: 44, height: 48, border: 'none', background: 'none', cursor: 'pointer', color: p.text, fontSize: 18 }}
                >
                  −
                </button>
                <span style={{ minWidth: 28, textAlign: 'center', fontWeight: 600 }}>{qty}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQty((q) => q + 1)}
                  style={{ width: 44, height: 48, border: 'none', background: 'none', cursor: 'pointer', color: p.text, fontSize: 18 }}
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={add}
                disabled={!canAdd}
                className="juvay-pdp-atc"
                style={{
                  flex: 1,
                  minHeight: CTA.height,
                  borderRadius: CTA.radius,
                  border: 'none',
                  background: canAdd ? p.accent : p.border,
                  color: canAdd ? p.accentText : p.muted,
                  fontSize: CTA.fontSize,
                  fontWeight: CTA.weight,
                  cursor: canAdd ? 'pointer' : 'default',
                }}
              >
                {needsVariant || !modCheck.ok
                  ? 'Choose options first'
                  : priceLabel
                    ? `Add to cart · ${priceLabel}`
                    : 'Add to cart'}
              </button>
            </div>
          ) : sample ? (
            <p style={{ color: p.muted, fontSize: 14, lineHeight: 1.55 }}>{SAMPLE_ITEM_NOTE}</p>
          ) : (
            <p style={{ color: p.muted, fontSize: 14 }}>Sold out</p>
          )}

          {mods.length ? (
            <p style={{ fontSize: 13, color: p.muted }}>{formatSelectedModifiers(mods)}</p>
          ) : null}

          <section style={{ marginTop: 36, borderTop: `1px solid ${p.border}`, paddingTop: 24 }}>
            <h2 style={{ fontFamily: p.headingFont, fontSize: 20, fontWeight: 500, margin: '0 0 10px' }}>Details</h2>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: p.muted, maxWidth: '46ch' }}>
              {item.description || 'The seller has not added more details yet.'}
            </p>
          </section>

          <section style={{ marginTop: 32, borderTop: `1px solid ${p.border}`, paddingTop: 24 }}>
            <h2 style={{ fontFamily: p.headingFont, fontSize: 20, fontWeight: 500, margin: '0 0 10px' }}>Reviews</h2>
            {Number(model.reviewCount || 0) > 0 ? (
              <p style={{ margin: 0, fontSize: 14, color: p.muted }}>
                {badge.label}
                {model.reviewAverage != null ? ` · rated ${Number(model.reviewAverage).toFixed(1)} from completed orders` : ''}.
              </p>
            ) : (
              <div
                style={{
                  padding: '20px 16px',
                  border: `1px dashed ${p.border}`,
                  borderRadius: RADIUS.md,
                  color: p.muted,
                  fontSize: 14,
                  lineHeight: 1.55,
                }}
              >
                No reviews yet
              </div>
            )}
          </section>
        </div>
      </div>

      {sellable ? (
        <div
          className="juvay-pdp-sticky"
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 24,
            display: 'none',
            padding: '8px 16px calc(8px + env(safe-area-inset-bottom))',
            background: p.surface,
            borderTop: `1px solid ${p.border}`,
          }}
        >
          <button
            type="button"
            onClick={add}
            disabled={!canAdd}
            style={{
              width: '100%',
              minHeight: CTA.height,
              borderRadius: CTA.radius,
              border: 'none',
              background: canAdd ? p.accent : p.border,
              color: canAdd ? p.accentText : p.muted,
              fontSize: CTA.fontSize,
              fontWeight: CTA.weight,
              cursor: canAdd ? 'pointer' : 'default',
            }}
          >
            {needsVariant || !modCheck.ok
              ? 'Choose options first'
              : priceLabel
                ? `Add to cart · ${priceLabel}`
                : 'Add to cart'}
          </button>
        </div>
      ) : null}

      <style>{`
        @media (max-width: 800px) {
          .juvay-pdp { grid-template-columns: 1fr !important; gap: 28px !important; }
          .juvay-pdp-sticky { display: block !important; }
          .juvay-pdp-atc { display: none !important; }
        }
      `}</style>
    </div>
  );
};

function textBtn(p: StoreStarter['palette']): React.CSSProperties {
  return {
    background: 'none',
    border: 'none',
    color: p.text,
    fontSize: 13,
    cursor: 'pointer',
    padding: 0,
    minHeight: 32,
    textDecoration: 'underline',
    textUnderlineOffset: 3,
  };
}


export default ProductPage;
