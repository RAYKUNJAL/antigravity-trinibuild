// tests/vertical-slice.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

// Use a throwaway DB file so tests are isolated.
process.env.DB_FILE = require('node:path').join(require('node:os').tmpdir(), 'catn-test-' + Date.now() + '.json');

const store = require('../src/store');

test('full vertical slice: discover → claim → verify → product → rfq', () => {
  store.reset();
  const src = store.addSource({ name: 'test source', url: 'https://x', tier: 3, owner: 't' });
  const biz = store.addBusiness({ source_id: src.id, name: 'Test Business', country: 'Jamaica', city: 'Kingston', category: 'food', website: 'https://x', address: 'Kingston' });

  // 1. unclaimed, labeled, cannot publish
  assert.equal(biz.state, 'UNCLAIMED_PUBLIC_PROFILE');
  const pub = store.publicBusiness(biz);
  assert.ok(pub.disclaimer);
  assert.equal(pub.can_publish_products, false);

  // 2. claim
  const rep = store.upsertRepresentative({ email: 'owner@test.com', name: 'Owner' });
  const claim = store.claimBusiness(biz.id, rep.id);
  assert.equal(claim.ok, true);
  assert.equal(claim.business.state, 'CLAIM_PENDING');

  // 3. admin approves claim
  const approved = store.approveClaim(biz.id);
  assert.equal(approved.business.state, 'CLAIMED');

  // 4. submit + approve evidence → identity verified → trade verified
  store.submitEvidence(biz.id, rep.id, 'legal_identity', 'registry doc');
  store.submitEvidence(biz.id, rep.id, 'representative_authority', 'authorization');
  store.approveEvidence(biz.id, 'legal_identity');
  store.approveEvidence(biz.id, 'representative_authority');
  assert.equal(store.publicBusiness(biz).state, 'IDENTITY_VERIFIED');
  store.submitEvidence(biz.id, rep.id, 'export_capacity', 'capacity');
  store.approveEvidence(biz.id, 'export_capacity');
  assert.equal(store.publicBusiness(biz).state, 'TRADE_VERIFIED');

  // 5. publish product (allowed now)
  const prod = store.addProduct(biz.id, rep.id, { title: 'Premium Coffee', description: 'd', moq: 10, price_usd: 25 });
  assert.equal(prod.ok, true);
  assert.equal(store.listProducts(biz.id).length, 1);

  // 6. buyer inquiry
  const rfq = store.createRfq({ buyer_name: 'Buyer', buyer_email: 'buyer@x.com', product: 'Premium Coffee', quantity: 50, destination_country: 'US' });
  assert.equal(rfq.status, 'open');
  assert.equal(store.listRfqs().length, 1);

  // 7. activity trace
  assert.ok(store.listActivity().some(a => a.action === 'product_published'));
});

test('unclaimed cannot publish products', () => {
  store.reset();
  const src = store.addSource({ name: 's', url: 'u', tier: 3, owner: 'o' });
  const biz = store.addBusiness({ source_id: src.id, name: 'N', country: 'TT', category: 'x' });
  const rep = store.upsertRepresentative({ email: 'a@a.com' });
  const out = store.addProduct(biz.id, rep.id, { title: 'P' });
  assert.equal(out.ok, false);
  assert.equal(out.error, 'requires_verification');
});

test('cannot claim an already-claimed business', () => {
  store.reset();
  const src = store.addSource({ name: 's', url: 'u', tier: 3, owner: 'o' });
  const biz = store.addBusiness({ source_id: src.id, name: 'N', country: 'TT', category: 'x' });
  const r1 = store.upsertRepresentative({ email: 'a@a.com' });
  const r2 = store.upsertRepresentative({ email: 'b@b.com' });
  assert.equal(store.claimBusiness(biz.id, r1.id).ok, true);
  assert.equal(store.claimBusiness(biz.id, r2.id).ok, false);
});
