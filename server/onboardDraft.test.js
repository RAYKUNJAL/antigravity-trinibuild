const assert = require('assert');
const {
  validateOnboardInput,
  buildFallbackDraft,
  sanitizeDraft,
  stripProducts,
  buildOnboardDraft,
  validatePatchInput,
  mergePatch,
  buildOnboardPatch,
} = require('./onboardDraft');

const empty = validateOnboardInput({ storeName: '' });
assert.ok(empty.error, 'empty name is rejected');
assert.match(empty.error, /required/i);

const ok = validateOnboardInput({ storeName: '  River Bake  ', type: 'food' });
assert.ok(ok.input);
assert.strictEqual(ok.input.storeName, 'River Bake');
assert.strictEqual(ok.input.templateId, 'food');

const fallback = buildFallbackDraft(ok.input);
assert.strictEqual(fallback.hero.headline, 'Cooked this morning. Ready when you reach.');
assert.ok(!('products' in fallback), 'fallback has no products key');
assert.ok(!Array.isArray(fallback.products));

const poisoned = sanitizeDraft({
  templateId: 'food',
  hero: { headline: 'Cooked this morning. Ready when you reach.' },
  about: 'River Bake in Trinidad.',
  trustChips: ['Cash / pickup'],
  faq: [{ q: 'How do I pay?', a: 'Cash when you collect, or cash on delivery if that option is on. We do not ask for PayPal.' }],
  how: [{ title: '1. See the menu', body: 'Empty until you add an item.' }],
  products: [{ name: 'Sample Product 1', price: 12 }],
  items: [{ name: 'Dummy roti' }],
  agentWrote: true,
}, ok.input);
const clean = stripProducts(poisoned);
assert.ok(!('products' in clean));
assert.ok(!('items' in clean));
assert.ok(!('catalog' in clean));
assert.strictEqual(clean.templateId, 'food');

(async () => {
  const prev = process.env.LLM_API_KEY;
  delete process.env.LLM_API_KEY;
  const rejected = await buildOnboardDraft({ name: '' });
  assert.strictEqual(rejected.status, 400);
  assert.match(rejected.error, /required/i);

  const drafted = await buildOnboardDraft({ storeName: 'River Bake', templateId: 'food' });
  assert.ok(drafted.draft);
  assert.strictEqual(drafted.draft.agentWrote, false);
  assert.ok(!('products' in drafted.draft));
  assert.ok(!Array.isArray(drafted.draft.products));

  const noInstruction = validatePatchInput({ instruction: '' });
  assert.ok(noInstruction.error);

  const current = {
    templateId: 'food',
    hero: { headline: 'Cooked this morning. Ready when you reach.', sub: 'Tunapuna' },
    about: 'River Bake in Trinidad.',
    hours: 'Wed–Sat 4–8',
    trustChips: ['Cash / pickup'],
  };
  const merged = mergePatch(current, {
    hero: { headline: 'Shorter line.' },
    products: [{ name: 'Sample Product 1' }],
  });
  assert.ok(!('products' in merged.proposed));
  assert.deepStrictEqual(merged.changedFields, ['hero.headline']);
  assert.ok(merged.conflicts.includes('hero.headline'));
  assert.strictEqual(merged.proposed.about, 'River Bake in Trinidad.');

  const chipPatch = mergePatch(current, { trustChips: ['Cash / pickup', 'Wed–Sat 4–8'] });
  assert.deepStrictEqual(chipPatch.changedFields, ['trustChips']);
  assert.ok(chipPatch.conflicts.includes('trustChips'));

  const heroSwap = mergePatch(current, { hero: { image: '/templates/heroes/food.jpg' } });
  assert.deepStrictEqual(heroSwap.changedFields, ['hero.image']);
  assert.strictEqual(heroSwap.proposed.hero.image, '/templates/heroes/food.jpg');

  const rejectedPhoto = mergePatch(
    { ...current, hero: { ...current.hero, image: 'data:image/jpeg;base64,abc' } },
    { hero: { image: 'https://example.com/wix-stock.jpg' } },
  );
  assert.ok(!rejectedPhoto.changedFields.includes('hero.image'));
  assert.strictEqual(rejectedPhoto.proposed.hero.image, 'data:image/jpeg;base64,abc');

  const conflictPhoto = mergePatch(
    { ...current, hero: { ...current.hero, image: 'data:image/jpeg;base64,abc' } },
    { hero: { image: '/templates/heroes/food.jpg' } },
  );
  assert.ok(conflictPhoto.conflicts.includes('hero.image'));

  const patched = await buildOnboardPatch({
    instruction: 'shorter headline',
    templateId: 'food',
    current,
    locked: { headline: current.hero.headline, about: current.about, hours: current.hours },
  });
  assert.strictEqual(patched.agentWrote, false);
  assert.deepStrictEqual(patched.changedFields, []);
  assert.match(patched.warning, /not writing|unchanged/i);
  assert.ok(!('products' in patched.proposed));

  if (prev === undefined) delete process.env.LLM_API_KEY;
  else process.env.LLM_API_KEY = prev;
  console.log('onboardDraft.test.js ok');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
