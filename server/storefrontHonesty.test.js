const assert = require('assert');
const {
  liveItems,
  featuredItems,
  catalogEmpty,
  showWhatsApp,
  showOrderCta,
  reviewBadge,
  realTrustChips,
  shouldRenderBlock,
  closedFoodNextOpen,
  mapProductVariants,
  mapProductSpecs,
  itemIsSellable,
} = require('./storefrontHonesty');

function food(partial = {}) {
  return {
    templateId: 'food',
    storeName: 'River Bake',
    island: 'Trinidad',
    items: [],
    reviewCount: 0,
    mode: 'published',
    ...partial,
  };
}

const empty = food();
assert.strictEqual(catalogEmpty(empty), true);
assert.strictEqual(liveItems(empty).length, 0);
assert.strictEqual(shouldRenderBlock('featured_combo', empty), false);
assert.strictEqual(shouldRenderBlock('menu', empty), false);
assert.strictEqual(shouldRenderBlock('hero', empty), true);
assert.strictEqual(shouldRenderBlock('footer', empty), true);

const emptyHome = food({ templateId: 'home' });
assert.strictEqual(shouldRenderBlock('featured', emptyHome), false);
const priced = food({
  templateId: 'home',
  items: [{ id: '1', name: 'Teak bench', price: 900, featured: true }],
});
assert.strictEqual(featuredItems(priced).length, 1);
assert.strictEqual(shouldRenderBlock('featured', priced), true);

assert.strictEqual(showWhatsApp(food()), false);
assert.strictEqual(showWhatsApp(food({ whatsappE164: '868-555-0000' })), false);
assert.strictEqual(showWhatsApp(food({ whatsappE164: '+18681234567' })), true);
assert.ok(!realTrustChips(food({ hours: 'Mon–Fri 8–2' })).includes('WhatsApp'));

const closed = food({ isOpen: false, nextOpen: 'tomorrow 7am' });
assert.strictEqual(showOrderCta(closed), false);
assert.strictEqual(closedFoodNextOpen(closed), 'Opens tomorrow 7am');
assert.strictEqual(showOrderCta(food({ isOpen: true })), true);
assert.strictEqual(showOrderCta(food({ templateId: 'fashion', isOpen: false })), true);

assert.deepStrictEqual(reviewBadge(0), { kind: 'new', label: 'New' });
assert.deepStrictEqual(reviewBadge(undefined), { kind: 'new', label: 'New' });
assert.strictEqual(reviewBadge(3).label, '3 reviews');

const variants = mapProductVariants([
  { id: 'blk-128', title: 'Black / 128GB', price: 2200 },
  { options: { Color: 'Silver', Storage: '256GB' }, price: 2600 },
]);
assert.strictEqual(variants.length, 2);
assert.strictEqual(variants[0].title, 'Black / 128GB');
assert.strictEqual(variants[1].title, 'Silver / 256GB');
assert.deepStrictEqual(mapProductVariants([]), []);
assert.strictEqual(mapProductSpecs({ Storage: '128GB', Color: 'Black' }), 'Storage: 128GB · Color: Black');
assert.strictEqual(mapProductSpecs(''), '');
assert.strictEqual(itemIsSellable({ id: '1', name: 'Cable' }), true);
assert.strictEqual(itemIsSellable({ id: '2', name: 'Pad', inStock: false }), false);

const electronics = food({
  templateId: 'electronics',
  items: [{ id: 'p', name: 'Phone', variants: variants, specs: 'Storage: 128GB' }],
});
assert.strictEqual(shouldRenderBlock('grid', electronics), true);
assert.strictEqual(featuredItems(electronics)[0].variants.length, 2);

const autoFit = food({
  templateId: 'auto',
  items: [{ id: 'a', name: 'Pad', compatibilityNote: 'Fits a 2016 Civic if the merchant typed that' }],
});
assert.strictEqual(autoFit.items[0].compatibilityNote.includes('merchant'), true);
assert.ok(!JSON.stringify(autoFit).toLowerCase().includes('same-day'));

console.log('storefrontHonesty.test.js ok');
