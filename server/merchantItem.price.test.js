const assert = require('assert');
const { validateMerchantItem } = require('./merchantItem');
assert.ok(validateMerchantItem({ name: 'Doubles', price: 0 }).error);
assert.ok(validateMerchantItem({ name: 'Doubles', price: 15 }).item);
console.log('merchantItem.price.test.js ok');
