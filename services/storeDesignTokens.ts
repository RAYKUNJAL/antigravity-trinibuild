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
