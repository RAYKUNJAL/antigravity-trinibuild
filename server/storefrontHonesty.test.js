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
  itemStockLabel,
  parseQty,
  showIllustrativeBanner,
  showSampleImageLabel,
  isStarterHeroPath,
  announcementLine,
  showAboutSection,
  showContactSection,
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
assert.strictEqual(itemIsSellable({ id: '3', name: 'Towel', qty: 0 }), false);
assert.strictEqual(itemIsSellable({ id: '4', name: 'Towel', qty: null }), true);
assert.strictEqual(parseQty(''), null);
assert.strictEqual(parseQty('0'), 0);
assert.strictEqual(itemStockLabel({ qty: 0 }), 'Sold out');
assert.strictEqual(itemStockLabel({ qty: 4 }), '4 on hand');
assert.strictEqual(itemStockLabel({ name: 'Towel' }), '');
assert.ok(!itemStockLabel({ name: 'Towel' }).toLowerCase().includes('in stock'));

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

assert.strictEqual(showIllustrativeBanner({ templateId: 'food', storeName: 'Food', mode: 'illustrative' }), true);
assert.strictEqual(showIllustrativeBanner({ templateId: 'food', storeName: 'Food', mode: 'merchant_preview' }), true);
assert.strictEqual(showIllustrativeBanner({
  templateId: 'food', storeName: 'Food', mode: 'merchant_preview', hero: { headline: 'x', image: '/templates/heroes/food.jpg' },
}), true);
assert.strictEqual(showIllustrativeBanner({
  templateId: 'food', storeName: 'Food', mode: 'merchant_preview', hero: { headline: 'x', image: 'data:image/jpeg;base64,abc' },
}), false);
assert.strictEqual(showIllustrativeBanner({
  templateId: 'food', storeName: 'Food', mode: 'published', hero: { headline: 'x', image: 'data:image/jpeg;base64,abc' },
}), false);

assert.strictEqual(announcementLine(food({ acceptsCashPickup: true, acceptsCod: true })), 'Cash at pickup · COD');
assert.strictEqual(announcementLine(food({ announcement: 'Closed Carnival Monday', acceptsCod: true })), 'Closed Carnival Monday');
assert.ok(!announcementLine(food({ acceptsCashPickup: true })).toLowerCase().includes('shipping'));
assert.strictEqual(showAboutSection(food({ about: 'We bake.' })), true);
assert.strictEqual(showAboutSection(food({ about: 'We bake.', showAbout: false })), false);
assert.strictEqual(showContactSection(food({ hours: 'Wed–Sat' })), true);
assert.strictEqual(showContactSection(food({ hours: 'Wed–Sat', showContact: false })), false);

const layoutChips = realTrustChips(food({
  mode: 'illustrative',
  trustChips: ['Menu', 'Cash / COD', 'Pickup hours'],
}));
assert.ok(layoutChips.includes('Menu'));
assert.ok(layoutChips.includes('Cash / COD'));
assert.ok(!layoutChips.join(' ').toLowerCase().includes('paypal'));
assert.ok(!layoutChips.join(' ').toLowerCase().includes('wipay'));

assert.strictEqual(shouldRenderBlock('lookbook', food({ templateId: 'beauty', items: [{ id: '1', name: 'Kit' }] })), true);
assert.strictEqual(shouldRenderBlock('featured', food({ templateId: 'electronics', items: [{ id: '1', name: 'Phone' }] })), false);
assert.strictEqual(shouldRenderBlock('grid', food({ templateId: 'electronics', items: [{ id: '1', name: 'Phone' }] })), true);
assert.strictEqual(shouldRenderBlock('featured', food({ templateId: 'auto', items: [{ id: '1', name: 'Pad' }] })), false);

console.log('storefrontHonesty.test.js ok');

const sold = food({ soldOutToday: true, isOpen: true });
assert.strictEqual(showOrderCta(sold), false);
assert.strictEqual(closedFoodNextOpen(sold), 'Sold out today');
const doublesClosed = food({ templateId: 'doubles', isOpen: false, nextOpen: 'tomorrow 6am' });
assert.strictEqual(showOrderCta(doublesClosed), false);
assert.strictEqual(closedFoodNextOpen(doublesClosed), 'Opens tomorrow 6am');
assert.strictEqual(announcementLine(food({ dailySpecials: 'Corn soup today' })), 'Corn soup today');

assert.strictEqual(isStarterHeroPath('/templates/heroes/food-960.webp'), true);
assert.strictEqual(isStarterHeroPath('/templates/heroes/food.jpg'), true);
assert.strictEqual(isStarterHeroPath('/templates/heroes/street-food-1440.webp'), true);
assert.strictEqual(isStarterHeroPath('https://cdn.example/photo.jpg'), false);
assert.strictEqual(showSampleImageLabel(food({ hero: { headline: 'x', image: '/templates/heroes/food-960.webp' } })), true);
assert.strictEqual(showSampleImageLabel(food({ hero: { headline: 'x', image: 'data:image/jpeg;base64,abc' } })), false);
assert.strictEqual(showSampleImageLabel(food({ mode: 'published', hero: { headline: 'x', image: '' } })), false);

const leaked = food({
  mode: 'published',
  items: [{ id: 'sample-food-1', name: 'Sample roti plate', price: 45, isSample: true }],
});
assert.strictEqual(liveItems(leaked).length, 0, 'published catalogs strip sample rows');

const previewSamples = food({
  mode: 'illustrative',
  items: [{ id: 'sample-food-1', name: 'Sample roti plate', price: 45, isSample: true }],
});
assert.strictEqual(liveItems(previewSamples).length, 1);
assert.ok(liveItems(previewSamples)[0].isSample);

console.log('storefrontHonesty sample-image tests ok');
