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

console.log('storefrontHonesty.test.js ok');
