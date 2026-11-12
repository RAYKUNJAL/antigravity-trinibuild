/**
 * Juvay storefront design tokens.
 * System stacks only — no Google Fonts payload.
 * Island identity is accent, a faint texture, and copy — not clutter.
 */

export const FONT_DISPLAY =
  'Georgia, "Iowan Old Style", "Palatino Linotype", Palatino, "Times New Roman", serif';
export const FONT_SANS =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const SPACE = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 24,
  6: 32,
  7: 48,
  8: 64,
  9: 80,
} as const;

export const RADIUS = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

export const SHADOW = {
  none: 'none',
  soft: '0 1px 2px rgba(20,20,20,0.04), 0 8px 24px rgba(20,20,20,0.05)',
} as const;

/** 44px+ taps. Primary CTA only uses accent. */
export const CTA = {
  height: 48,
  radius: 8,
  fontSize: 14,
  weight: 600,
} as const;

export const HEADER_H = 64;

export const CONTENT_MAX = 1120;

/** Faint linen grain — original, not copied. Used as a page wash. */
export const LINEN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.2  0 0 0 0 0.16  0 0 0 0 0.1  0 0 0 0.035 0'/></filter><rect width='120' height='120' filter='url(%23n)'/></svg>\")";

export function heroStem(id: string): string {
  return id === 'street_food' ? 'street-food' : id;
}

export function heroSources(id: string): { src: string; srcSet: string; sizes: string } {
  const stem = heroStem(id);
  return {
    src: `/templates/heroes/${stem}-960.webp`,
    srcSet: `/templates/heroes/${stem}-960.webp 960w, /templates/heroes/${stem}-1440.webp 1440w`,
    sizes: '100vw',
  };
}

export const STARTER_HERO_RE =
  /\/templates\/heroes\/(food|fashion|services|general|beauty|home|electronics|auto|doubles|street-food)(-960|-1440)?\.(jpg|png|webp)(\?.*)?$/;

/** Relative luminance (sRGB, WCAG 2.x). */
export function relativeLuminance(hex: string): number {
  const raw = String(hex || '').trim().replace('#', '');
  if (raw.length !== 3 && raw.length !== 6) return 0;
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  const ch = (i: number) => {
    const n = parseInt(full.slice(i, i + 2), 16) / 255;
    return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(0) + 0.7152 * ch(2) + 0.0722 * ch(4);
}

export function contrastRatio(a: string, b: string): number {
  const L1 = relativeLuminance(a);
  const L2 = relativeLuminance(b);
  const hi = Math.max(L1, L2);
  const lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}

export const AA_BODY = 4.5;
export const AA_LARGE = 3;

/** Composite a foreground (0–1 opacity) over a solid background; return #rrggbb. */
export function compositeOver(fg: string, bg: string, opacity: number): string {
  const parse = (h: string) => {
    const raw = h.replace('#', '');
    const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  };
  const [fr, fgG, fb] = parse(fg);
  const [br, bgG, bb] = parse(bg);
  const mix = (f: number, b: number) => Math.round(f * opacity + b * (1 - opacity));
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hex(mix(fr, br))}${hex(mix(fgG, bgG))}${hex(mix(fb, bb))}`;
}
