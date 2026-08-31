const assert = require('assert');
const { parseQty, validateMerchantItem, itemStockLabel, itemIsSellable } = require('./merchantItem');

assert.strictEqual(parseQty(''), null);
assert.strictEqual(parseQty(undefined), null);
assert.strictEqual(parseQty('0'), 0);
assert.strictEqual(parseQty('12'), 12);
assert.ok(parseQty('1.5').error);
assert.ok(parseQty('-1').error);

const noName = validateMerchantItem({ price: 10 });
assert.ok(noName.error);
assert.match(noName.error, /name/i);

const noPrice = validateMerchantItem({ name: 'Towel' });
assert.ok(noPrice.error);
assert.match(noPrice.error, /price/i);

const noSku = validateMerchantItem({ name: 'Towel', price: '25', qty: '' });
assert.ok(noSku.item);
assert.strictEqual(noSku.item.sku, '');
assert.strictEqual(noSku.item.qty, null);
assert.strictEqual(noSku.item.name, 'Towel');
assert.strictEqual(noSku.item.price, 25);

const zero = validateMerchantItem({ name: 'Towel', price: 25, qty: '0', sku: '' });
assert.strictEqual(zero.item.qty, 0);
assert.strictEqual(itemStockLabel(zero.item), 'Sold out');
assert.strictEqual(itemIsSellable(zero.item), false);

const counted = validateMerchantItem({ name: 'Towel', price: 25, qty: '8', sku: 'T-1' });
assert.strictEqual(counted.item.qty, 8);
assert.strictEqual(itemStockLabel(counted.item), '8 on hand');
assert.strictEqual(itemIsSellable(counted.item), true);

const unset = { name: 'Towel', price: 25, qty: null, sku: '' };
assert.strictEqual(itemStockLabel(unset), '');
assert.ok(!itemStockLabel(unset).toLowerCase().includes('in stock'));
assert.strictEqual(itemIsSellable(unset), true);
assert.ok(!JSON.stringify(unset).toLowerCase().includes('in stock'));

console.log('merchantItem.test.js ok');
