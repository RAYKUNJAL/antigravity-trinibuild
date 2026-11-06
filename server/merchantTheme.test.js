const assert = require('assert');
const {
  normalizeHex,
  contrastInk,
  parseColorInstruction,
  parseFontInstruction,
  sanitizeColors,
} = require('./merchantTheme');

assert.strictEqual(normalizeHex('#FFC300'), '#ffc300');
assert.strictEqual(normalizeHex('#fff'), '#ffffff');
assert.strictEqual(normalizeHex('mango'), '');
assert.strictEqual(contrastInk('#ffc300'), '#141414');
assert.strictEqual(contrastInk('#141414'), '#FFF8F0');

const mango = parseColorInstruction('make the button mango gold');
assert.ok(mango);
assert.strictEqual(mango.accent, '#ffc300');

const dark = parseColorInstruction('darker hero please');
assert.ok(dark);
assert.strictEqual(dark.heroBg, '#141414');

assert.strictEqual(parseFontInstruction('use all-sans'), 'all_sans');
assert.strictEqual(parseFontInstruction('serif headlines'), 'serif_sans');

const bad = sanitizeColors({ accent: 'not-a-color', heroBg: 'https://evil' });
assert.strictEqual(bad, null);
const ok = sanitizeColors({ accent: '#0D9488' });
assert.strictEqual(ok.accent, '#0d9488');

console.log('merchantTheme.test.js ok');
