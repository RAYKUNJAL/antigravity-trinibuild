/**
 * Per-store color / font overlay. Starter palettes stay the default.
 * Gallery cards never read these overrides.
 */

import type { StarterPalette } from './storeStarters';

export type FontPair = 'starter' | 'serif_sans' | 'all_sans';

export interface MerchantColors {
  accent?: string;
  accentText?: string;
  surface?: string;
  heroBg?: string;
  heroText?: string;
  accentSource?: 'swatch' | 'hex' | 'starter';
  surfaceSource?: 'swatch' | 'hex' | 'starter';
}

export interface MerchantTheme {
  colors?: MerchantColors;
  fontPair?: FontPair;
}

export const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function normalizeHex(raw?: string | null): string {
  const value = String(raw || '').trim();
  if (!HEX.test(value)) return '';
  if (value.length === 4) {
    const r = value[1];
    const g = value[2];
    const b = value[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return value.toLowerCase();
}

export function hexLuminance(hex: string): number {
  const clean = normalizeHex(hex);
  if (!clean) return 0;
  const n = parseInt(clean.slice(1), 16);
  const r = (n >> 16) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastInk(hex: string): string {
  return hexLuminance(hex) > 0.45 ? '#141414' : '#FFF8F0';
}

/** 6 island accents — not a rainbow farm. */
export const ACCENT_SWATCHES = [
  { id: 'mango', hex: '#ffc300', label: 'Mango' },
  { id: 'teal', hex: '#0d9488', label: 'Teal' },
  { id: 'ink', hex: '#141414', label: 'Ink' },
  { id: 'cocoa', hex: '#8b7355', label: 'Cocoa' },
  { id: 'amber', hex: '#d97706', label: 'Amber' },
  { id: 'pepper', hex: '#e31c23', label: 'Pepper' },
] as const;

/** Surface / hero field options. */
export const SURFACE_SWATCHES = [
  { id: 'sand', hex: '#fff8f0', label: 'Sand' },
  { id: 'ink', hex: '#141414', label: 'Ink' },
  { id: 'cocoa', hex: '#1c140c', label: 'Cocoa night' },
  { id: 'slate', hex: '#1e293b', label: 'Slate' },
  { id: 'blush', hex: '#faf6f3', label: 'Blush' },
] as const;

export const FONT_PAIRS: Array<{ id: FontPair; label: string; heading: string; body: string }> = [
  { id: 'starter', label: 'Starter default', heading: '', body: '' },
  { id: 'serif_sans', label: 'Serif + sans', heading: "'Fraunces', Georgia, serif", body: "'Source Sans 3', system-ui, sans-serif" },
  { id: 'all_sans', label: 'All sans', heading: "'Outfit', system-ui, sans-serif", body: "'Source Sans 3', system-ui, sans-serif" },
];

export function applyMerchantTheme(
  base: StarterPalette,
  theme?: MerchantTheme | null,
): StarterPalette {
  const next = { ...base };
  const colors = theme?.colors || {};
  const accent = normalizeHex(colors.accent);
  if (accent) {
    next.accent = accent;
    next.accentText = normalizeHex(colors.accentText) || contrastInk(accent);
  }
  const surface = normalizeHex(colors.surface);
  if (surface) next.surface = surface;
  const heroBg = normalizeHex(colors.heroBg);
  if (heroBg) {
    next.heroBg = heroBg;
    next.heroText = normalizeHex(colors.heroText) || contrastInk(heroBg);
  }
  const pair = FONT_PAIRS.find((row) => row.id === theme?.fontPair);
  if (pair && pair.id !== 'starter') {
    next.headingFont = pair.heading;
    next.bodyFont = pair.body;
  }
  return next;
}

export function slugPreview(name: string): string {
  const slug = String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'your-store';
  return `juvay.app/store/${slug}`;
}

export function socialHref(kind: 'instagram' | 'facebook' | 'tiktok', raw?: string | null): string {
  const value = String(raw || '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  const handle = value.replace(/^@/, '').replace(/^\/+/, '');
  if (!handle) return '';
  if (kind === 'instagram') return `https://instagram.com/${handle}`;
  if (kind === 'facebook') return `https://facebook.com/${handle}`;
  return `https://tiktok.com/@${handle.replace(/^@/, '')}`;
}

export function defaultSeo(storeName: string, island?: string, about?: string): { title: string; description: string } {
  const name = String(storeName || '').trim() || 'Your store';
  const place = String(island || '').trim();
  const title = place ? `${name} · ${place}` : name;
  const description = String(about || '').trim() || (place ? `${name} in ${place}. Cash at pickup or COD if those rails are on.` : `${name}. Cash at pickup or COD if those rails are on.`);
  return { title: title.slice(0, 70), description: description.slice(0, 160) };
}

export function parseColorInstruction(instruction: string): MerchantColors | null {
  const t = String(instruction || '').toLowerCase();
  const colors: MerchantColors = {};
  if (/\b(mango|gold)\b/.test(t)) colors.accent = '#ffc300';
  else if (/\bteal\b/.test(t)) colors.accent = '#0d9488';
  else if (/\b(ink|black)\b/.test(t) && /\b(button|cta|accent)\b/.test(t)) colors.accent = '#141414';
  else if (/\b(cocoa|brown)\b/.test(t)) colors.accent = '#8b7355';
  else if (/\b(amber|orange)\b/.test(t)) colors.accent = '#d97706';
  else if (/\b(pepper|red)\b/.test(t) && /\b(button|cta|accent)\b/.test(t)) colors.accent = '#e31c23';
  if (/\bdarker hero\b|\bdark hero\b/.test(t)) colors.heroBg = '#141414';
  else if (/\b(sand|lighter) hero\b/.test(t)) colors.heroBg = '#fff8f0';
  const hexMatch = t.match(/#([0-9a-f]{3}|[0-9a-f]{6})\b/);
  if (hexMatch && /\b(button|cta|accent|color)\b/.test(t)) colors.accent = normalizeHex(`#${hexMatch[1]}`);
  if (!colors.accent && !colors.heroBg) return null;
  if (colors.accent) colors.accentText = contrastInk(colors.accent);
  if (colors.heroBg) colors.heroText = contrastInk(colors.heroBg);
  return colors;
}

export function parseFontInstruction(instruction: string): FontPair | null {
  const t = String(instruction || '').toLowerCase();
  if (/\ball[- ]sans\b|\bsans only\b/.test(t)) return 'all_sans';
  if (/\bserif\b/.test(t)) return 'serif_sans';
  if (/\bstarter (font|default)\b/.test(t)) return 'starter';
  return null;
}
