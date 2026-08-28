import React from 'react';
import { ISLAND } from '../services/storeStarters';
import {
  ACCENT_SWATCHES,
  SURFACE_SWATCHES,
  FONT_PAIRS,
  normalizeHex,
  contrastInk,
  slugPreview,
  defaultSeo,
  type FontPair,
  type MerchantColors,
} from '../services/merchantTheme';

function readImage(file: File, onDone: (dataUrl: string) => void) {
  if (!file.type.startsWith('image/')) return;
  if (file.size > 2_500_000) return;
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    const max = 1200;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    onDone(canvas.toDataURL('image/jpeg', 0.84));
  };
  img.src = url;
}

const swatchBtn = (hex: string, selected: boolean): React.CSSProperties => ({
  width: 44,
  height: 44,
  minWidth: 44,
  minHeight: 44,
  borderRadius: 8,
  border: selected ? '2px solid #141414' : '1px solid #cfc8bc',
  background: hex,
  cursor: 'pointer',
  padding: 0,
});

export const MerchantStudio: React.FC<{
  storeName: string;
  island: string;
  about: string;
  colors: MerchantColors;
  fontPair: FontPair;
  logo: string;
  announcement: string;
  showAbout: boolean;
  showContact: boolean;
  seoTitle: string;
  seoDescription: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  itemName: string;
  itemPrice: string;
  itemImage: string;
  itemVariant: string;
  onColors: (colors: MerchantColors) => void;
  onFontPair: (pair: FontPair) => void;
  onLogo: (dataUrl: string) => void;
  onAnnouncement: (value: string) => void;
  onShowAbout: (value: boolean) => void;
  onShowContact: (value: boolean) => void;
  onSeo: (title: string, description: string) => void;
  onSocial: (key: 'instagram' | 'facebook' | 'tiktok', value: string) => void;
  onItem: (patch: { name?: string; price?: string; image?: string; variant?: string }) => void;
}> = ({
  storeName, island, about, colors, fontPair, logo, announcement,
  showAbout, showContact, seoTitle, seoDescription, instagram, facebook, tiktok,
  itemName, itemPrice, itemImage, itemVariant,
  onColors, onFontPair, onLogo, onAnnouncement, onShowAbout, onShowContact, onSeo, onSocial, onItem,
}) => {
  const seo = defaultSeo(storeName, island, about);
  const accent = normalizeHex(colors.accent);
  const surface = normalizeHex(colors.surface || colors.heroBg);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section style={{ display: 'grid', gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Accent (CTA)</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button type="button" title="Starter default" onClick={() => onColors({ ...colors, accent: undefined, accentText: undefined, accentSource: 'starter' })} style={{ ...swatchBtn('#e6dfd4', !accent) }}>
            <span style={{ fontSize: 9, color: '#141414' }}>Def</span>
          </button>
          {ACCENT_SWATCHES.map((row) => (
            <button key={row.id} type="button" title={row.label} aria-label={row.label} onClick={() => onColors({ ...colors, accent: row.hex, accentText: contrastInk(row.hex), accentSource: 'swatch' })} style={swatchBtn(row.hex, accent === row.hex)} />
          ))}
        </div>
        <label style={{ display: 'grid', gap: 6, fontSize: 13 }}>
          Custom hex
          <input
            value={colors.accent || ''}
            onChange={(e) => {
              const hex = normalizeHex(e.target.value);
              onColors({
                ...colors,
                accent: hex || e.target.value,
                accentText: hex ? contrastInk(hex) : colors.accentText,
                accentSource: 'hex',
              });
            }}
            placeholder="#ffc300"
            style={{ width: '100%', minHeight: 44, border: '1px solid #cfc8bc', background: ISLAND.sand, padding: '0 12px' }}
          />
        </label>
      </section>

      <section style={{ display: 'grid', gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Surface / hero field</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button type="button" title="Starter default" onClick={() => onColors({ ...colors, surface: undefined, heroBg: undefined, heroText: undefined, surfaceSource: 'starter' })} style={{ ...swatchBtn('#e6dfd4', !surface) }}>
            <span style={{ fontSize: 9, color: '#141414' }}>Def</span>
          </button>
          {SURFACE_SWATCHES.map((row) => (
            <button
              key={row.id}
              type="button"
              title={row.label}
              aria-label={row.label}
              onClick={() => onColors({ ...colors, surface: row.hex, heroBg: row.hex, heroText: contrastInk(row.hex), surfaceSource: 'swatch' })}
              style={swatchBtn(row.hex, surface === row.hex)}
            />
          ))}
        </div>
        <label style={{ display: 'grid', gap: 6, fontSize: 13 }}>
          Custom hex
          <input
            value={colors.heroBg || colors.surface || ''}
            onChange={(e) => {
              const hex = normalizeHex(e.target.value);
              onColors({
                ...colors,
                surface: hex || e.target.value,
                heroBg: hex || e.target.value,
                heroText: hex ? contrastInk(hex) : colors.heroText,
                surfaceSource: 'hex',
              });
            }}
            placeholder="#fff8f0"
            style={{ width: '100%', minHeight: 44, border: '1px solid #cfc8bc', background: ISLAND.sand, padding: '0 12px' }}
          />
        </label>
      </section>

      <section style={{ display: 'grid', gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Font pair</div>
        {FONT_PAIRS.map((row) => (
          <label key={row.id} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44 }}>
            <input type="radio" name="fontPair" checked={fontPair === row.id} onChange={() => onFontPair(row.id)} />
            <span>{row.label}</span>
          </label>
        ))}
      </section>

      <section style={{ display: 'grid', gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Logo</div>
        <label style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', border: '1px solid #cfc8bc', padding: '0 12px', cursor: 'pointer', width: 'fit-content' }}>
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) readImage(f, onLogo); }} />
          {logo ? 'Replace logo' : 'Upload logo'}
        </label>
        <p style={{ margin: 0, fontSize: 12, color: '#6b6256' }}>Square or wide. Header + favicon. No logo = store name wordmark.</p>
      </section>

      <section style={{ display: 'grid', gap: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>
          Announcement bar
          <input
            value={announcement}
            onChange={(e) => onAnnouncement(e.target.value)}
            placeholder="Leave blank for Cash at pickup / COD only"
            style={{ display: 'block', width: '100%', minHeight: 44, marginTop: 6, border: '1px solid #cfc8bc', background: ISLAND.sand, padding: '0 12px' }}
          />
        </label>
      </section>

      <section style={{ display: 'grid', gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Pages</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, color: '#6b6256' }}>
          <input type="checkbox" checked disabled /> Home (always on)
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44 }}>
          <input type="checkbox" checked={showAbout} onChange={(e) => onShowAbout(e.target.checked)} /> About (hidden if empty)
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44 }}>
          <input type="checkbox" checked={showContact} onChange={(e) => onShowContact(e.target.checked)} /> Contact / Hours (hidden if empty)
        </label>
      </section>

      <section style={{ display: 'grid', gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Add first item</div>
        <input value={itemName} onChange={(e) => onItem({ name: e.target.value })} placeholder="Name" style={{ width: '100%', minHeight: 44, border: '1px solid #cfc8bc', background: ISLAND.sand, padding: '0 12px' }} />
        <input value={itemPrice} onChange={(e) => onItem({ price: e.target.value })} placeholder="Price TT$" inputMode="decimal" style={{ width: '100%', minHeight: 44, border: '1px solid #cfc8bc', background: ISLAND.sand, padding: '0 12px' }} />
        <input value={itemVariant} onChange={(e) => onItem({ variant: e.target.value })} placeholder="Optional variant (size / color)" style={{ width: '100%', minHeight: 44, border: '1px solid #cfc8bc', background: ISLAND.sand, padding: '0 12px' }} />
        <label style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', border: '1px solid #cfc8bc', padding: '0 12px', cursor: 'pointer', width: 'fit-content' }}>
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) readImage(f, (url) => onItem({ image: url })); }} />
          {itemImage ? 'Replace item photo' : 'Optional photo'}
        </label>
        <p style={{ margin: 0, fontSize: 12, color: '#6b6256' }}>One real SKU. No sample product. No AI price.</p>
      </section>

      <section style={{ display: 'grid', gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>SEO</div>
        <input value={seoTitle || seo.title} onChange={(e) => onSeo(e.target.value, seoDescription || seo.description)} placeholder={seo.title} style={{ width: '100%', minHeight: 44, border: '1px solid #cfc8bc', background: ISLAND.sand, padding: '0 12px' }} />
        <textarea value={seoDescription || seo.description} onChange={(e) => onSeo(seoTitle || seo.title, e.target.value)} placeholder={seo.description} rows={3} style={{ width: '100%', minHeight: 66, border: '1px solid #cfc8bc', background: ISLAND.sand, padding: 12 }} />
        <div style={{ fontSize: 12, color: '#6b6256' }}>Slug preview {slugPreview(storeName)}</div>
        <div style={{ fontSize: 12, color: '#6b6256' }}>OG image = hero photo.</div>
      </section>

      <section style={{ display: 'grid', gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Social (typed only)</div>
        <input value={instagram} onChange={(e) => onSocial('instagram', e.target.value)} placeholder="Instagram handle or URL" style={{ width: '100%', minHeight: 44, border: '1px solid #cfc8bc', background: ISLAND.sand, padding: '0 12px' }} />
        <input value={facebook} onChange={(e) => onSocial('facebook', e.target.value)} placeholder="Facebook page or URL" style={{ width: '100%', minHeight: 44, border: '1px solid #cfc8bc', background: ISLAND.sand, padding: '0 12px' }} />
        <input value={tiktok} onChange={(e) => onSocial('tiktok', e.target.value)} placeholder="TikTok handle or URL" style={{ width: '100%', minHeight: 44, border: '1px solid #cfc8bc', background: ISLAND.sand, padding: '0 12px' }} />
      </section>
    </div>
  );
};
