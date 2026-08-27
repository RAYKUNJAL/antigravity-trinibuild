const assert = require('assert');
const crypto = require('crypto');
const { isWamConfigured, expectedSignature, verifyWamSignature } = require('./wam');

function withKey(value, fn) {
  const prev = process.env.WAM_API_KEY;
  if (value === undefined) delete process.env.WAM_API_KEY;
  else process.env.WAM_API_KEY = value;
  try { fn(); } finally {
    if (prev === undefined) delete process.env.WAM_API_KEY;
    else process.env.WAM_API_KEY = prev;
  }
}

withKey('', () => {
  assert.strictEqual(isWamConfigured(), false, 'empty key is not configured');
});

withKey(undefined, () => {
  assert.strictEqual(isWamConfigured(), false, 'missing key is not configured');
});

withKey('test-only-not-for-prod', () => {
  assert.strictEqual(isWamConfigured(), true);
  const body = '{"id":"evt_1","amountCents":4900}';
  const sig = crypto.createHmac('sha256', 'test-only-not-for-prod').update(body).digest('hex');
  assert.strictEqual(expectedSignature(body), sig);
  assert.strictEqual(verifyWamSignature({ headers: { 'x-wam-signature': sig } }, body), true);
  assert.strictEqual(verifyWamSignature({ headers: {} }, body), false, 'unsigned fails closed');
  assert.strictEqual(verifyWamSignature({ headers: { 'x-wam-signature': 'deadbeef' } }, body), false);
});

withKey('', () => {
  const body = '{}';
  assert.strictEqual(verifyWamSignature({ headers: { 'x-wam-signature': 'abc' } }, body), false);
});

console.log('wam.test.js ok');
