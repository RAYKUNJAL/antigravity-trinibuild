/**
 * Color contrast utilities for readable text on any background.
 * Uses perceived brightness formula: (R * 299 + G * 587 + B * 114) / 1000
 * If brightness > 145 → use dark text, else use white text.
 */

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    };
  }
  return null;
}

export function getContrastColor(bgHex: string): string {
  const rgb = hexToRgb(bgHex);
  if (!rgb) return '#000000';
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness > 145 ? '#000000' : '#FFFFFF';
}
