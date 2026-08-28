const assert = require('assert');
const {
  validateVisionInput,
  sanitizeVisionDraft,
  stripForbiddenKeys,
  buildOnboardVision,
  emptyDraft,
  NO_KEY_WARNING,
} = require('./onboardVision');

const TINY = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const missing = validateVisionInput({});
assert.ok(missing.error);
assert.strictEqual(missing.status, 400);
assert.match(missing.error, /image/i);

const missingBlank = validateVisionInput({ image: '' });
assert.strictEqual(missingBlank.status, 400);

const okImg = validateVisionInput({ image: TINY, templateId: 'food', storeName: 'River Bake' });
assert.ok(okImg.input);
assert.ok(okImg.input.image.startsWith('data:image/'));

const poisoned = sanitizeVisionDraft({
  name: 'Premium Quartz Timepiece — Classic Edition',
  description: 'Luxury watch. TT$1,299.',
  tags: ['Quartz', 'TT$1299'],
  price: 1299,
  suggested_price_ttd: 1299,
  sku: 'WATCH-1',
  qty: 12,
  products: [{ name: 'Sample Product 1' }],
});
assert.strictEqual(poisoned.name, '');
assert.ok(!poisoned.description.includes('TT$'));
assert.ok(!poisoned.tags.some((t) => /tt\$|1299/i.test(t)));
assert.ok(!('price' in poisoned));
assert.ok(!('products' in poisoned));
assert.ok(!('sku' in poisoned));
assert.ok(!('qty' in poisoned));

const sample = sanitizeVisionDraft({ name: 'Sample Product 3', description: 'Dummy', tags: [] });
assert.strictEqual(sample.name, '');

const stripped = stripForbiddenKeys({
  name: 'Cable',
  price: 40,
  sku: 'C-1',
  qty: 3,
  products: [{ name: 'x' }],
  tags: ['cable'],
});
assert.ok(!('price' in stripped));
assert.ok(!('sku' in stripped));
assert.ok(!('qty' in stripped));
assert.ok(!('products' in stripped));
assert.strictEqual(stripped.name, 'Cable');

(async () => {
  const prev = process.env.LLM_API_KEY;
  delete process.env.LLM_API_KEY;

  const noImage = await buildOnboardVision({ storeName: 'River Bake' });
  assert.strictEqual(noImage.status, 400);
  assert.match(noImage.error, /image/i);

  const noKey = await buildOnboardVision({ image: TINY, templateId: 'general' });
  assert.strictEqual(noKey.agentWrote, false);
  assert.strictEqual(noKey.warning, NO_KEY_WARNING);
  assert.deepStrictEqual(noKey.draft, emptyDraft());
  assert.strictEqual(noKey.draft.name, '');
  assert.ok(!('price' in noKey.draft));
  assert.ok(!('sku' in noKey.draft));
  assert.ok(!('qty' in noKey.draft));
  assert.ok(!('products' in noKey.draft));
  assert.ok(!Array.isArray(noKey.draft.products));
  const dumped = JSON.stringify(noKey);
  assert.ok(!/"price"/.test(dumped));
  assert.ok(!/"products"/.test(dumped));
  assert.ok(!/"sku"/.test(dumped));
  assert.ok(!/"qty"/.test(dumped));

  process.env.LLM_API_KEY = 'test-key-not-live';
  const origFetch = global.fetch;
  let sent;
  global.fetch = async (_url, opts) => {
    sent = JSON.parse(opts.body);
    return {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({
          name: 'Red kitchen towel',
          description: 'Cotton towel, folded.',
          tags: ['towel', 'cotton'],
          price: 40,
          sku: 'T-1',
          qty: 9,
          products: [{ name: 'Sample Product' }],
        }) } }],
      }),
    };
  };
  const wrote = await buildOnboardVision({ image: TINY, templateId: 'home' });
  assert.strictEqual(wrote.agentWrote, true);
  assert.strictEqual(wrote.draft.name, 'Red kitchen towel');
  assert.ok(!('price' in wrote.draft));
  assert.ok(!('sku' in wrote.draft));
  assert.ok(!('qty' in wrote.draft));
  assert.ok(!('products' in wrote.draft));
  assert.ok(sent.messages[1].content.some((part) => part.type === 'image_url' && part.image_url.url === TINY));
  assert.ok(JSON.stringify(sent).includes(TINY));

  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: '{"name":"Premium Quartz Timepiece","description":"Watch","tags":[]}' } }],
    }),
  });
  const quartz = await buildOnboardVision({ image: TINY });
  assert.strictEqual(quartz.agentWrote, false);
  assert.strictEqual(quartz.draft.name, '');

  global.fetch = origFetch;
  if (prev === undefined) delete process.env.LLM_API_KEY;
  else process.env.LLM_API_KEY = prev;
  console.log('onboardVision.test.js ok');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
