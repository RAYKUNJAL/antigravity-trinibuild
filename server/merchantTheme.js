/** CommonJS mirror of services/merchantTheme.ts for node tests + Grok patch. */

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function normalizeHex(raw) {
  const value = String(raw || '').trim();
  if (!HEX.test(value)) return '';
  if (value.length === 4) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`.toLowerCase();
  }
  return value.toLowerCase();
}

function hexLuminance(hex) {
  const clean = normalizeHex(hex);
  if (!clean) return 0;
  const n = parseInt(clean.slice(1), 16);
  const r = (n >> 16) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastInk(hex) {
  return hexLuminance(hex) > 0.45 ? '#141414' : '#FFF8F0';
}

function parseColorInstruction(instruction) {
  const t = String(instruction || '').toLowerCase();
  const colors = {};
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

function parseFontInstruction(instruction) {
  const t = String(instruction || '').toLowerCase();
  if (/\ball[- ]sans\b|\bsans only\b/.test(t)) return 'all_sans';
  if (/\bserif\b/.test(t)) return 'serif_sans';
  if (/\bstarter (font|default)\b/.test(t)) return 'starter';
  return null;
}

function sanitizeColors(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const colors = {};
  const accent = normalizeHex(raw.accent);
  const surface = normalizeHex(raw.surface);
  const heroBg = normalizeHex(raw.heroBg);
  if (accent) {
    colors.accent = accent;
    colors.accentText = normalizeHex(raw.accentText) || contrastInk(accent);
  }
  if (surface) colors.surface = surface;
  if (heroBg) {
    colors.heroBg = heroBg;
    colors.heroText = normalizeHex(raw.heroText) || contrastInk(heroBg);
  }
  return Object.keys(colors).length ? colors : null;
}

function sanitizeFontPair(raw) {
  return ['starter', 'serif_sans', 'all_sans'].includes(raw) ? raw : null;
}

function sanitizeSeo(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const title = String(raw.title || '').trim().slice(0, 70);
  const description = String(raw.description || '').trim().slice(0, 160);
  if (!title && !description) return null;
  return { title, description };
}

function sanitizeSocial(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const social = {};
  for (const key of ['instagram', 'facebook', 'tiktok']) {
    const value = String(raw[key] || '').trim().slice(0, 160);
    if (value) social[key] = value;
  }
  return Object.keys(social).length ? social : null;
}

module.exports = {
  HEX,
  normalizeHex,
  hexLuminance,
  contrastInk,
  parseColorInstruction,
  parseFontInstruction,
  sanitizeColors,
  sanitizeFontPair,
  sanitizeSeo,
  sanitizeSocial,
};
