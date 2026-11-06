const assert = require('assert');
const { juvayFeeCents, feeBpsForPlan } = require('./juvayFees');

assert.strictEqual(juvayFeeCents(10000, 450), 450);
assert.strictEqual(juvayFeeCents(10000, 300), 300);
assert.strictEqual(feeBpsForPlan('free'), 450);
assert.strictEqual(feeBpsForPlan('starter'), 300);
assert.strictEqual(feeBpsForPlan('business'), 300);
console.log('juvayFees.test.js ok');
