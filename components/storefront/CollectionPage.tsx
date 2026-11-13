import React from 'react';
import { STORE_STARTERS, type StarterId } from '../../services/storeStarters';
import { CONTENT_MAX, FONT_DISPLAY, RADIUS } from '../../services/storeDesignTokens';
import {
  emptyCatalogCopy,
  featuredItems,
  liveItems,
  type StorefrontItem,
  type StorefrontModel,
} from '../../services/storefrontHonesty';
import { CatalogCard } from './CatalogCard';

export function decodeCategorySlug(slug: string | undefined | null): string {
  if (!slug) return '';
  try {
    return decodeURIComponent(String(slug)).trim();
  } catch {
    return String(slug).trim();
  }
}

export function itemsInCategory(model: StorefrontModel, categorySlug: string): StorefrontItem[] {
  const label = decodeCategorySlug(categorySlug);
  if (!label) return liveItems(model);
  if (label.toLowerCase() === 'featured') return featuredItems(model);
  const needle = label.toLowerCase();
  return liveItems(model).filter((item) => (item.category || '').trim().toLowerCase() === needle);
}

export function categoryDisplayName(model: StorefrontModel, categorySlug: string): string {
  const label = decodeCategorySlug(categorySlug);
  if (!label) return 'Collection';
  if (label.toLowerCase() === 'featured') return 'Featured';
  const match = liveItems(model).find((item) => (item.category || '').trim().toLowerCase() === label.toLowerCase());
  return (match?.category || '').trim() || label;
}

export const CollectionPage: React.FC<{
  model: StorefrontModel;
  palette: (typeof STORE_STARTERS)[StarterId]['palette'];
  categorySlug: string;
  onBack: () => void;
  onAdd: (item: StorefrontItem) => void;
  onOpen: (item: StorefrontItem) => void;
  categories?: string[];
  onSelectCategory?: (label: string) => void;
}> = ({ model, palette: p, categorySlug, onBack, onAdd, onOpen, categories, onSelectCategory }) => {
  const title = categoryDisplayName(model, categorySlug);
  const items = itemsInCategory(model, categorySlug);
  const large = model.templateId === 'home';

  return (
    <section
      aria-label={title}
      style={{ padding: '32px 6vw 80px', maxWidth: CONTENT_MAX, margin: '0 auto', minHeight: '60vh' }}
    >
      <button
        type="button"
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: p.text,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          minHeight: 44,
          padding: 0,
          marginBottom: 16,
        }}
      >
        ← Shop
      </button>
      <h1
        style={{
          fontFamily: p.headingFont || FONT_DISPLAY,
          fontSize: 'clamp(28px, 4vw, 44px)',
          fontWeight: 500,
          margin: '0 0 8px',
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
        }}
      >
        {title}
      </h1>
      <p style={{ margin: '0 0 28px', color: p.muted, fontSize: 14 }}>
        {items.length === 0 ? 'Nothing in this collection yet.' : items.length === 1 ? '1 item' : `${items.length} items`}
      </p>
      {categories && categories.length > 0 && onSelectCategory ? (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 24 }} role="navigation" aria-label="Collections">
          {categories.map((label) => {
            const active = label.toLowerCase() === decodeCategorySlug(categorySlug).toLowerCase();
            return (
              <button
                key={label}
                type="button"
                onClick={() => onSelectCategory(label)}
                aria-current={active ? 'page' : undefined}
                style={{
                  flex: '0 0 auto',
                  minHeight: 40,
                  padding: '0 14px',
                  borderRadius: 999,
                  border: `1px solid ${active ? p.text : p.border}`,
                  background: active ? p.text : p.surface,
                  color: active ? p.surface : p.text,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : null}
      {items.length === 0 ? (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            color: p.muted,
            background: p.surface,
            borderRadius: RADIUS.md,
            border: `1px solid ${p.border}`,
          }}
        >
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55 }}>
            {model.mode === 'published' ? emptyCatalogCopy(model) : 'Nothing in this collection yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 28 }} className="juvay-grid">
          {items.map((item) => (
            <CatalogCard
              key={item.id}
              item={item}
              model={model}
              palette={p}
              onAdd={() => onAdd(item)}
              onOpen={() => onOpen(item)}
              large={large}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default CollectionPage;
