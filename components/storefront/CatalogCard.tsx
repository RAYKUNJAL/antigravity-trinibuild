import React from 'react';
import { STORE_STARTERS, type StarterId } from '../../services/storeStarters';
import { CTA, RADIUS } from '../../services/storeDesignTokens';
import {
  formatPrice,
  itemIsSellable,
  itemStockLabel,
  type StorefrontItem,
  type StorefrontModel,
} from '../../services/storefrontHonesty';
import { isSampleItem } from '../../services/illustrativeSamples';

export const CatalogCard: React.FC<{
  item: StorefrontItem;
  model: StorefrontModel;
  palette: (typeof STORE_STARTERS)[StarterId]['palette'];
  onAdd: () => void;
  onOpen?: () => void;
  large?: boolean;
}> = ({ item, model, palette: p, onAdd, onOpen, large }) => {
  const price = formatPrice(model, item.price);
  const sellable = itemIsSellable(item) && !isSampleItem(item);
  const needsVariant = !!(item.variants && item.variants.length) || !!(item.modifierGroups && item.modifierGroups.length);
  const starter = STORE_STARTERS[model.templateId];
  const aspect = large ? '4 / 5' : starter.cardAspect || '1 / 1';
  const sample = isSampleItem(item);

  return (
    <article style={{ display: 'flex', flexDirection: 'column' }}>
      <button
        type="button"
        onClick={onOpen}
        aria-label={item.name}
        style={{
          display: 'block',
          width: '100%',
          border: 'none',
          padding: 0,
          background: 'none',
          cursor: onOpen ? 'pointer' : 'default',
          textAlign: 'left',
          color: 'inherit',
        }}
      >
        <div
          style={{
            aspectRatio: aspect,
            background: p.surface,
            borderRadius: RADIUS.sm,
            overflow: 'hidden',
            position: 'relative',
            border: `1px solid ${p.border}`,
          }}
        >
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              loading="lazy"
              decoding="async"
              width={800}
              height={800}
              sizes="(max-width: 480px) 50vw, (max-width: 900px) 33vw, 280px"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: p.field }} />
          )}
          {sample && model.mode !== 'illustrative' ? (
            <span
              style={{
                position: 'absolute',
                top: 10,
                left: 10,
                background: 'rgba(20,20,20,0.78)',
                color: '#fff8f0',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 0.12,
                textTransform: 'uppercase',
                padding: '4px 8px',
                borderRadius: 4,
              }}
            >
              Preview
            </span>
          ) : null}
        </div>
        <div style={{ paddingTop: 12 }}>
          <h3
            style={{
              margin: 0,
              fontFamily: p.headingFont,
              fontSize: 16,
              fontWeight: 500,
              lineHeight: 1.3,
              letterSpacing: '-0.01em',
            }}
          >
            {item.name}
          </h3>
          {item.compatibilityNote ? (
            <p style={{ margin: '4px 0 0', fontSize: 13, color: p.muted, lineHeight: 1.45 }}>{item.compatibilityNote}</p>
          ) : null}
          {item.specs ? <p style={{ margin: '4px 0 0', fontSize: 13, color: p.muted }}>{item.specs}</p> : null}
          {itemStockLabel(item) ? <p style={{ margin: '4px 0 0', fontSize: 12, color: p.muted }}>{itemStockLabel(item)}</p> : null}
          <div style={{ marginTop: 8, fontSize: 15, fontWeight: 600, color: p.text }}>
            {price ? <span>{price}</span> : (
              <span style={{ fontWeight: 500, color: p.muted }}>
                {model.mode === 'illustrative' || sample ? 'Add your price' : 'Ask the shop'}
              </span>
            )}
          </div>
        </div>
      </button>
      <div style={{ marginTop: 12 }}>
        {sellable ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            style={{
              minHeight: 44,
              minWidth: 44,
              width: '100%',
              borderRadius: CTA.radius,
              border: `1px solid ${p.text}`,
              background: 'transparent',
              color: p.text,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {needsVariant ? 'Choose options' : price ? `Add to cart · ${price}` : 'Add to cart'}
          </button>
        ) : sample ? (
          <div style={{ fontSize: 12, color: p.muted }}>Layout only</div>
        ) : (
          <span style={{ fontSize: 13, color: p.muted }}>Sold out</span>
        )}
      </div>
    </article>
  );
};

export default CatalogCard;
