import assert from 'node:assert/strict';
import {
  DRAFT_FAIL_WARNING,
  PATCH_FAIL_WARNING,
  OnboardClientError,
  recommendStarterFromText,
  isTransientOnboardFail,
  buildLockedDraft,
  resolveDraftResponse,
  resolvePatchResponse,
} from './onboardLockedDraft';

assert.equal(recommendStarterFromText('evening roti from Tunapuna'), 'food');
assert.equal(recommendStarterFromText('linen boutique in San Fernando'), 'fashion');
assert.equal(recommendStarterFromText('unknown shop'), 'general');

assert.equal(isTransientOnboardFail(null), true);
assert.equal(isTransientOnboardFail(500), true);
assert.equal(isTransientOnboardFail(502), true);
assert.equal(isTransientOnboardFail(504), true);
assert.equal(isTransientOnboardFail(400), false);
assert.equal(isTransientOnboardFail(401), false);
assert.equal(isTransientOnboardFail(200), false);

const locked = buildLockedDraft({
  storeName: 'River Bake',
  templateId: 'food',
  island: 'Trinidad',
  specialty: 'roti',
  hours: 'Wed–Sat 4–8',
  pickupAddress: 'Tunapuna',
  acceptsCashPickup: true,
});
assert.equal(locked.agentWrote, false);
assert.equal(locked.templateId, 'food');
assert.equal(locked.hero.headline, 'Cooked this morning. Ready when you reach.');
assert.match(locked.about, /River Bake/);
assert.ok(!('products' in locked));
assert.ok(!('items' in locked));
assert.ok(!('catalog' in locked));
assert.ok(!Array.isArray((locked as { products?: unknown }).products));

const ok = resolveDraftResponse(200, {
  draft: { ...locked, agentWrote: true },
  warning: undefined,
}, { storeName: 'River Bake', templateId: 'food' });
assert.equal(ok.draft.agentWrote, true);

const five = resolveDraftResponse(504, { error: 'gateway timeout' }, {
  storeName: 'River Bake',
  templateId: 'food',
  island: 'Trinidad',
});
assert.equal(five.draft.agentWrote, false);
assert.equal(five.warning, DRAFT_FAIL_WARNING);
assert.equal(five.draft.hero.headline, 'Cooked this morning. Ready when you reach.');
assert.ok(!('products' in five.draft));

const net = resolveDraftResponse(null, {}, { chat: 'evening roti', storeName: 'River Bake' });
assert.equal(net.draft.templateId, 'food');
assert.equal(net.draft.agentWrote, false);
assert.match(net.warning || '', /draft failed|not writing|locked copy/i);

assert.throws(
  () => resolveDraftResponse(400, { error: 'Store name is required' }, { storeName: '' }),
  (err: unknown) => err instanceof OnboardClientError && err.status === 400,
);

const patchOk = resolvePatchResponse(200, {
  changedFields: ['hero.headline'],
  conflicts: ['hero.headline'],
  agentWrote: true,
});
assert.equal(patchOk.agentWrote, true);
assert.deepEqual(patchOk.changedFields, ['hero.headline']);

const patchFail = resolvePatchResponse(500, { error: 'upstream' });
assert.equal(patchFail.agentWrote, false);
assert.deepEqual(patchFail.changedFields, []);
assert.equal(patchFail.warning, PATCH_FAIL_WARNING);
assert.equal(patchFail.proposed, undefined);

const patchNet = resolvePatchResponse(null, {});
assert.equal(patchNet.agentWrote, false);
assert.deepEqual(patchNet.changedFields, []);
assert.match(patchNet.warning || '', /unchanged|did not change|locked/i);

assert.throws(
  () => resolvePatchResponse(400, { error: 'instruction is required' }),
  (err: unknown) => err instanceof OnboardClientError && err.status === 400,
);

console.log('onboardLockedDraft.test.ts ok');
